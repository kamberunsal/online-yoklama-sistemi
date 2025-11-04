const crypto = require('crypto');
const { Yoklama } = require('./models'); // Sequelize modelini import ediyoruz

// Sunucu hafızasında tutulacak state'ler
const aktifOturumlar = new Map(); // dersId -> { intervalId, timeoutId, ogretmenSocketId, yoklamaId, baslangicZamani }
const gecerliTokenlar = new Map(); // qrToken -> dersId
const beklemeListesi = new Map(); // socket.id -> { ogrenciId, dersId, katilimZamani }

const socketManager = (io) => {

    // GÖREV 1: Yeniden kullanılabilir sonlandırma fonksiyonu
    const sonlandirYoklama = async (dersId) => {
        const oturum = aktifOturumlar.get(dersId);
        if (!oturum) {
            console.log(`Zaten sonlanmış bir oturum tekrar sonlandırılmaya çalışıldı: Ders ID ${dersId}`);
            return;
        }

        console.log(`Yoklama sona eriyor: Ders ID ${dersId}`);

        // Zamanlayıcıları temizle
        clearInterval(oturum.intervalId);
        // clearTimeout(oturum.timeoutId); // Zaten ya süre doldu ya da erken bitirildi, tekrar temizlemeye gerek yok

        // Derse ait geçerli token'ları temizle
        for (const [token, dId] of gecerliTokenlar.entries()) {
            if (dId === dersId) {
                gecerliTokenlar.delete(token);
            }
        }

        // Veritabanı kaydını bul
        const yoklamaKaydi = await Yoklama.findByPk(oturum.yoklamaId);
        if (!yoklamaKaydi) {
            console.error(`HATA: Yoklama kaydı bulunamadı! ID: ${oturum.yoklamaId}`);
            io.to(oturum.ogretmenSocketId).emit('yoklama-sonlandi', { success: false, message: 'Veritabanı kaydı bulunamadı.' });
            aktifOturumlar.delete(dersId);
            return;
        }

        const katilanOgrenciler = [];
        // Bekleme listesindeki öğrencileri işle
        for (const [socketId, beklemedekiOgrenci] of beklemeListesi.entries()) {
            if (beklemedekiOgrenci.dersId === dersId) {
                katilanOgrenciler.push(beklemedekiOgrenci.ogrenciId);
                io.to(socketId).emit('yoklama-tamamlandi', { message: 'Yoklamanız başarıyla kaydedildi.' });
                beklemeListesi.delete(socketId);
            }
        }
        
        // Öğrencileri veritabanına ekle
        if (katilanOgrenciler.length > 0) {
            await yoklamaKaydi.addKatilanOgrenciler(katilanOgrenciler);
            console.log(`${katilanOgrenciler.length} öğrenci ${dersId} dersi için kaydedildi.`);
        }

        // Öğretmene bilgi ver ve oturumu hafızadan sil
        io.to(oturum.ogretmenSocketId).emit('yoklama-sonlandi', { success: true, katilanSayisi: katilanOgrenciler.length });
        aktifOturumlar.delete(dersId);
        console.log(`Yoklama oturumu başarıyla sonlandı ve temizlendi: Ders ID ${dersId}`);
    };


    io.on('connection', (socket) => {
        console.log(`Yeni bir kullanıcı bağlandı: ${socket.id}`);

        socket.on('yoklamayi-baslat', ({ dersId, sure, yoklamaId }) => {
            console.log(`Yoklama başlatıldı: Ders ID ${dersId}, Süre ${sure}s, Yoklama ID ${yoklamaId}`);

            if (aktifOturumlar.has(dersId)) {
                const eskiOturum = aktifOturumlar.get(dersId);
                clearInterval(eskiOturum.intervalId);
                clearTimeout(eskiOturum.timeoutId);
                console.log(`Eski oturum temizlendi: Ders ID ${dersId}`);
            }

            const ogretmenSocketId = socket.id;
            const baslangicZamani = Date.now();

            // GÖREV 2: Ana zamanlayıcı artık sadece `sonlandirYoklama` fonksiyonunu çağırıyor
            const timeoutId = setTimeout(() => sonlandirYoklama(dersId), sure * 1000);

            const intervalId = setInterval(() => {
                const qrToken = crypto.randomUUID();
                gecerliTokenlar.set(qrToken, dersId);
                setTimeout(() => { gecerliTokenlar.delete(qrToken); }, 7000);
                io.to(ogretmenSocketId).emit('yeni-qr-token', { qrToken });
            }, 5000);
            
            const ilkToken = crypto.randomUUID();
            gecerliTokenlar.set(ilkToken, dersId);
            setTimeout(() => { gecerliTokenlar.delete(ilkToken); }, 7000);
            io.to(ogretmenSocketId).emit('yeni-qr-token', { qrToken: ilkToken });

            aktifOturumlar.set(dersId, { intervalId, timeoutId, ogretmenSocketId, yoklamaId, baslangicZamani });
        });
        
        // GÖREV 3: Yoklamayı Erken Bitirme olayı
        socket.on('yoklamayi-erken-bitir', async ({ dersId }) => {
            const oturum = aktifOturumlar.get(dersId);

            // Sadece oturumu başlatan öğretmen bitirebilir
            if (oturum && oturum.ogretmenSocketId === socket.id) {
                console.log(`Yoklama erken bitiriliyor: Ders ID ${dersId}`);
                // Ana zamanlayıcıyı iptal et
                clearTimeout(oturum.timeoutId);
                // Sonlandırma mantığını manuel olarak tetikle
                await sonlandirYoklama(dersId);
            } else {
                console.log(`Yetkisiz erken bitirme denemesi: Ders ID ${dersId}, Socket ID ${socket.id}`);
            }
        });

        socket.on('yoklamaya-katil', ({ qrToken }) => {
            if (!gecerliTokenlar.has(qrToken)) {
                return socket.emit('yoklama-hata', { message: 'Geçersiz veya süresi dolmuş QR kod.' });
            }

            const dersId = gecerliTokenlar.get(qrToken);
            const oturum = aktifOturumlar.get(dersId);
            
            if (!oturum) {
                 return socket.emit('yoklama-hata', { message: 'Bu yoklama otumu artık aktif değil.' });
            }

            if (beklemeListesi.has(socket.id)) {
                return socket.emit('yoklama-hata', { message: 'Zaten bekleme listesindesiniz.' });
            }
            
            const ogrenciId = socket.handshake.auth.userId;
            if (!ogrenciId) {
                 return socket.emit('yoklama-hata', { message: 'Kimlik doğrulanamadı. Lütfen tekrar giriş yapın.' });
            }

            beklemeListesi.set(socket.id, { ogrenciId, dersId, katilimZamani: new Date() });

            const gecenSureMs = Date.now() - oturum.baslangicZamani;
            const kalanSureSn = Math.round((oturum.timeoutId._idleTimeout - gecenSureMs) / 1000);

            socket.emit('yoklama-basarili-bekle', { kalanSure: kalanSureSn > 0 ? kalanSureSn : 0 });
            console.log(`Öğrenci ${ogrenciId} bekleme listesine eklendi. Ders: ${dersId}`);
        });

        const handleAyrilma = () => {
            if (beklemeListesi.has(socket.id)) {
                const { ogrenciId, dersId } = beklemeListesi.get(socket.id);
                beklemeListesi.delete(socket.id);
                console.log(`Öğrenci ${ogrenciId} (Ders: ${dersId}) bekleme listesinden ayrıldı.`);
                socket.emit('yoklama-iptal-edildi', { message: 'Sayfadan ayrıldığınız için yoklama kaydınız iptal edildi.' });
            }
        };

        socket.on('sayfadan-ayrildim', handleAyrilma);
        socket.on('disconnect', () => {
            handleAyrilma();
            console.log(`Kullanıcı bağlantısı koptu: ${socket.id}`);
        });
    });
};

module.exports = socketManager;