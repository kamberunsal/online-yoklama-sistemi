const { verify } = require('jsonwebtoken');
const User = require('./models/User');
const Yoklama = require('./models/Yoklama');
const Ders = require('./models/Ders');
const mongoose = require('mongoose');

// --- In-memory Data Stores ---

// Aktif yoklama oturumlarını ve ilgili zamanlayıcıları (interval/timeout) saklar.
// Yapısı: Map<dersId, { intervalId, timeoutId, yoklamaId, ogretmenSocketId }>
const aktifOturumlar = new Map();

// O an için geçerli olan ve öğrenci katılımı için kullanılacak token'ları saklar.
// Yapısı: Map<token, { dersId, yoklamaId }>
const gecerliTokenlar = new Map();

// QR kodu okutup yoklama kaydının sonlanmasını bekleyen öğrencileri saklar.
// Yapısı: Map<socket.id, { ogrenciId, dersId, yoklamaId }>
const beklemeListesi = new Map();


// --- Helper Functions ---

/**
 * Belirtilen ders ID'si için devam eden yoklama oturumunu sonlandırır.
 * Bu fonksiyon, normal süre dolduğunda veya öğretmen tarafından erken bitirildiğinde çağrılır.
 * Bekleme listesindeki öğrencileri veritabanına kaydeder ve tüm ilgili kaynakları temizler.
 * @param {string} dersId - Yoklaması sonlandırılacak olan dersin ID'si.
 * @param {object} io - Socket.IO sunucu örneği.
 */
const sonlandirYoklama = async (dersId, io) => {
    console.log(`Yoklama sonlandırma süreci başlatıldı: Ders ID ${dersId}`);

    const oturum = aktifOturumlar.get(dersId);

    // Eğer bu ders için aktif bir oturum yoksa (zaten bitmiş olabilir), işlemi durdur.
    if (!oturum) {
        console.log(`Zaten sonlanmış veya bulunamayan oturum: Ders ID ${dersId}`);
        return;
    }

    const { intervalId, timeoutId, yoklamaId, ogretmenSocketId } = oturum;

    // Zamanlayıcıları temizle
    clearTimeout(timeoutId); // Ana bitiş zamanlayıcısını temizle
    clearInterval(intervalId); // Yeni QR kod üretimini durdur

    // Oturumu aktif listesinden kaldır
    aktifOturumlar.delete(dersId);
    console.log(`Aktif oturum temizlendi: Ders ID ${dersId}`);

    // ----- Bekleme Listesindeki Öğrencileri İşle -----
    const kayitListesi = [];    // Veritabanına yazılacak öğrenci ID'leri
    const bildirimListesi = []; // yoklama-tamamlandi mesajı gönderilecek socket ID'leri

    beklemeListesi.forEach((value, key) => {
        if (value.dersId === dersId) {
            kayitListesi.push(value.ogrenciId);
            bildirimListesi.push(key);
            beklemeListesi.delete(key); // Öğrenciyi bekleme listesinden sil
        }
    });

    console.log(`${kayitListesi.length} öğrenci veritabanına kaydedilecek.`);
    
    // Geçerli token'lar listesinden bu derse ait olanları temizle
    gecerliTokenlar.forEach((value, key) => {
        if (value.dersId === dersId) {
            gecerliTokenlar.delete(key);
        }
    });
    console.log(`Geçerli tokenlar temizlendi: Ders ID ${dersId}`);


    // Veritabanı Güncelleme
    if (kayitListesi.length > 0) {
        try {
            await Yoklama.findByIdAndUpdate(yoklamaId, {
                $addToSet: { katilanOgrenciler: { $each: kayitListesi } }, // $addToSet ile mükerrer kayıt önlenir
                yoklamaDurumu: 'tamamlandi'
            });
            console.log(`Veritabanı güncellendi: Yoklama ID ${yoklamaId}`);
        } catch (error) {
            console.error('Veritabanına toplu kayıt sırasında hata:', error);
            // Hata durumunda öğretmene bilgi verilebilir
            io.to(ogretmenSocketId).emit('hata', { mesaj: 'Öğrenciler yoklamaya kaydedilirken bir hata oluştu.' });
        }
    } else {
        // katılan kimse yoksa bile durumu güncelle
         await Yoklama.findByIdAndUpdate(yoklamaId, {
            yoklamaDurumu: 'tamamlandi'
        });
    }

    // Bildirimleri Gönder
    bildirimListesi.forEach(socketId => {
        io.to(socketId).emit('yoklama-tamamlandi', { mesaj: 'Yoklamanız başarıyla kaydedildi!' });
    });

    // Öğretmene yoklamanın bittiğini bildir
    if (ogretmenSocketId) {
        io.to(ogretmenSocketId).emit('yoklama-sonlandi');
        console.log(`Öğretmene yoklamanın bittiği bildirildi: Socket ID ${ogretmenSocketId}`);
    }
};


// --- Socket.IO Event Management ---

const socketManager = (io) => {
    io.on('connection', (socket) => {
        console.log(`Bir kullanıcı bağlandı: ${socket.id}`);

        // Öğretmen yoklamayı başlattığında tetiklenir
        socket.on('yoklamayi-baslat', async ({ dersId, sure }) => {
            try {
                const ders = await Ders.findById(dersId).populate('ogretmenId');
                if (!ders) {
                    return socket.emit('hata', { mesaj: 'Ders bulunamadı.' });
                }

                // Yeni yoklama kaydı oluştur
                const yeniYoklama = new Yoklama({
                    dersId: ders._id,
                    ogretmenId: ders.ogretmenId._id,
                    tarih: new Date(),
                    katilanOgrenciler: [],
                    yoklamaDurumu: 'aktif'
                });
                await yeniYoklama.save();
                const yoklamaId = yeniYoklama._id;

                console.log(`Yeni yoklama başlatıldı: Ders ID ${dersId}, Yoklama ID ${yoklamaId}, Süre: ${sure} saniye`);

                // Ana oturum zamanlayıcısı (süre sonunda yoklamayı otomatik bitirir)
                const mainTimeout = setTimeout(() => {
                    sonlandirYoklama(dersId, io);
                }, sure * 1000);

                // Her 5 saniyede bir yeni QR kod (token) üreten interval
                const interval = setInterval(() => {
                    const token = Math.random().toString(36).substring(2, 10);
                    gecerliTokenlar.set(token, { dersId, yoklamaId });
                    
                    // Öğretmene yeni token'ı gönder
                    socket.emit('yeni-qr-token', { token });

                    // **Düzeltme 1:** Token'ı 6 saniye sonra geçersiz kıl
                    setTimeout(() => {
                        gecerliTokenlar.delete(token);
                    }, 6000); 

                }, 5000);

                // İlk token'ı hemen oluştur ve gönder
                const ilkToken = Math.random().toString(36).substring(2, 10);
                gecerliTokenlar.set(ilkToken, { dersId, yoklamaId });
                socket.emit('yeni-qr-token', { token: ilkToken });
                setTimeout(() => { gecerliTokenlar.delete(ilkToken); }, 6000);

                // Oturum bilgilerini sakla
                aktifOturumlar.set(dersId, {
                    intervalId: interval,
                    timeoutId: mainTimeout,
                    yoklamaId: yoklamaId,
                    ogretmenSocketId: socket.id
                });

            } catch (error) {
                console.error("Yoklama başlatma hatası:", error);
                socket.emit('hata', { mesaj: 'Yoklama başlatılırken sunucu hatası oluştu.' });
            }
        });

        // Öğrenci QR kodu okutup katılım isteği gönderdiğinde
        socket.on('yoklamaya-katil', async ({ token, kullaniciToken }) => {
            try {
                const gecerliToken = gecerliTokenlar.get(token);
                if (!gecerliToken) {
                    return socket.emit('hata', { mesaj: 'Geçersiz veya süresi dolmuş QR kod!' });
                }
                
                const decoded = verify(kullaniciToken, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);

                if (!user || user.rol !== 'ogrenci') {
                    return socket.emit('hata', { mesaj: 'Geçersiz kullanıcı veya yetki.' });
                }

                const { dersId, yoklamaId } = gecerliToken;
                
                // Öğrenciyi bekleme listesine ekle
                beklemeListesi.set(socket.id, {
                    ogrenciId: user._id,
                    dersId: dersId,
                    yoklamaId: yoklamaId
                });

                // Katılımın alındığına dair öğrenciye anında geri bildirim yap
                socket.emit('katilim-alindi', { mesaj: 'Yoklama isteğiniz alındı. Öğretmenin dersi bitirmesi bekleniyor.' });

                // Öğretmene anlık katılım bilgisi gönder
                const oturum = aktifOturumlar.get(dersId);
                if (oturum && oturum.ogretmenSocketId) {
                    io.to(oturum.ogretmenSocketId).emit('yeni-katilimci-beklemede', {
                        ad: user.ad,
                        soyad: user.soyad,
                        okulNumarasi: user.okulNumarasi
                    });
                }

            } catch (error) {
                console.error('Yoklamaya katılım hatası:', error);
                socket.emit('hata', { mesaj: 'Katılım sırasında bir hata oluştu. Lütfen tekrar deneyin.' });
            }
        });

        // Öğretmen yoklamayı manuel olarak bitirdiğinde
        socket.on('yoklamayi-bitir', ({ dersId }) => {
            console.log(`Öğretmen yoklamayı manuel bitirdi: Ders ID ${dersId}`);
            sonlandirYoklama(dersId, io); // Düzeltilmiş fonksiyonu çağır
        });

        // Kullanıcı bağlantısı kesildiğinde
        socket.on('disconnect', () => {
            console.log(`Bir kullanıcı ayrıldı: ${socket.id}`);
            
            // Eğer ayrılan kişi bir öğretmense ve aktif bir oturumu varsa, o oturumu sonlandır (dijital kelepçe)
            aktifOturumlar.forEach((value, key) => {
                if (value.ogretmenSocketId === socket.id) {
                    console.log(`Öğretmen bağlantısı koptu, yoklama sonlandırılıyor: Ders ID ${key}`);
                    sonlandirYoklama(key, io);
                }
            });

            // Eğer ayrılan kişi bekleme listesindeki bir öğrenciyse, onu listeden kaldır
            if (beklemeListesi.has(socket.id)) {
                beklemeListesi.delete(socket.id);
                console.log(`Bekleme listesindeki öğrenci ayrıldı: ${socket.id}`);
            }
        });
    });
};

module.exports = socketManager;
