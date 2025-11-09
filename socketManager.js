const { verify } = require('jsonwebtoken');
const { Ders, User, Yoklama, sequelize } = require('./models'); // Sequelize modellerini al
const { Op } = require('sequelize');

// --- In-memory Data Stores ---
const aktifOturumlar = new Map();
const gecerliTokenlar = new Map();
const beklemeListesi = new Map();

// --- Helper Functions ---

/**
 * Belirtilen ders ID'si için devam eden yoklama oturumunu sonlandırır.
 */
const sonlandirYoklama = async (dersId, io) => {
    console.log(`Yoklama sonlandırma süreci başlatıldı: Ders ID ${dersId}`);
    const oturum = aktifOturumlar.get(dersId);

    if (!oturum) {
        console.log(`Zaten sonlanmış veya bulunamayan oturum: Ders ID ${dersId}`);
        return;
    }

    const { intervalId, timeoutId, yoklamaId, ogretmenSocketId } = oturum;

    clearTimeout(timeoutId);
    clearInterval(intervalId);
    aktifOturumlar.delete(dersId);
    console.log(`Aktif oturum temizlendi: Ders ID ${dersId}`);

    const kayitListesi = [];
    const bildirimListesi = [];

    beklemeListesi.forEach((value, key) => {
        if (value.dersId === dersId) {
            kayitListesi.push(value.ogrenciId);
            bildirimListesi.push(key);
            beklemeListesi.delete(key);
        }
    });

    console.log(`${kayitListesi.length} öğrenci veritabanına kaydedilecek.`);

    gecerliTokenlar.forEach((value, key) => {
        if (value.dersId === dersId) {
            gecerliTokenlar.delete(key);
        }
    });
    console.log(`Geçerli tokenlar temizlendi: Ders ID ${dersId}`);

    const t = await sequelize.transaction();
    try {
        const yoklama = await Yoklama.findByPk(yoklamaId, { transaction: t });
        if (yoklama) {
            if (kayitListesi.length > 0) {
                // Sequelize'de many-to-many ilişkiye veri eklemek için add<ModelAdıÇoğul> kullanılır
                await yoklama.addOgrenciler(kayitListesi, { transaction: t });
            }
            yoklama.yoklamaDurumu = 'tamamlandi';
            await yoklama.save({ transaction: t });
        }
        await t.commit();
        console.log(`Veritabanı güncellendi: Yoklama ID ${yoklamaId}`);

        bildirimListesi.forEach(socketId => {
            io.to(socketId).emit('yoklama-tamamlandi', { mesaj: 'Yoklamanız başarıyla kaydedildi!' });
        });

        if (ogretmenSocketId) {
            io.to(ogretmenSocketId).emit('yoklama-sonlandi', { success: true, katilanSayisi: kayitListesi.length });
            console.log(`Öğretmene yoklamanın bittiği bildirildi: Socket ID ${ogretmenSocketId}`);
        }

    } catch (error) {
        await t.rollback();
        console.error('Veritabanına toplu kayıt sırasında Sequelize hatası:', error);
        if (ogretmenSocketId) {
            io.to(ogretmenSocketId).emit('hata', { mesaj: 'Öğrenciler yoklamaya kaydedilirken bir veritabanı hatası oluştu.' });
        }
    }
};

// --- Socket.IO Event Management ---

const socketManager = (io) => {
    io.on('connection', (socket) => {
        console.log(`Bir kullanıcı bağlandı: ${socket.id}`);

        socket.on('yoklamayi-baslat', async ({ dersId, sure }) => {
            try {
                const ders = await Ders.findByPk(dersId, {
                    include: [{ model: User, as: 'ogretmen' }] 
                });

                if (!ders) {
                    return socket.emit('hata', { mesaj: 'Ders bulunamadı.' });
                }
                if (!ders.ogretmen) {
                    return socket.emit('hata', { mesaj: 'Bu derse atanmış geçerli bir öğretmen bulunamadı.' });
                }

                // Sequelize ile yeni yoklama kaydı oluştur
                const yeniYoklama = await Yoklama.create({
                    dersId: ders.id,
                    ogretmenId: ders.ogretmen.id,
                    tarih: new Date(),
                    yoklamaDurumu: 'aktif'
                });
                
                const yoklamaId = yeniYoklama.id;
                console.log(`Yeni yoklama başlatıldı: Ders ID ${dersId}, Yoklama ID ${yoklamaId}, Süre: ${sure} saniye`);

                const mainTimeout = setTimeout(() => {
                    sonlandirYoklama(dersId, io);
                }, sure * 1000);

                const interval = setInterval(() => {
                    const token = Math.random().toString(36).substring(2, 10);
                    gecerliTokenlar.set(token, { dersId, yoklamaId });
                    socket.emit('yeni-qr-token', { token });
                    setTimeout(() => { gecerliTokenlar.delete(token); }, 6000);
                }, 5000);

                const ilkToken = Math.random().toString(36).substring(2, 10);
                gecerliTokenlar.set(ilkToken, { dersId, yoklamaId });
                socket.emit('yeni-qr-token', { token: ilkToken });
                setTimeout(() => { gecerliTokenlar.delete(ilkToken); }, 6000);

                aktifOturumlar.set(dersId, {
                    intervalId: interval,
                    timeoutId: mainTimeout,
                    yoklamaId: yoklamaId,
                    ogretmenSocketId: socket.id
                });

            } catch (error) {
                console.error("Yoklama başlatma hatası (Sequelize):", error);
                socket.emit('hata', { mesaj: 'Yoklama başlatılırken bir veritabanı hatası oluştu.' });
            }
        });

        socket.on('yoklamaya-katil', async ({ token, kullaniciToken }) => {
            try {
                const gecerliToken = gecerliTokenlar.get(token);
                if (!gecerliToken) {
                    return socket.emit('hata', { mesaj: 'Geçersiz veya süresi dolmuş QR kod!' });
                }

                let decoded;
                try {
                    decoded = verify(kullaniciToken, process.env.JWT_SECRET);
                } catch (jwtError) {
                    console.error('JWT Doğrulama Hatası:', jwtError.message);
                    throw new Error('Oturumunuz geçersiz veya süresi dolmuş. Lütfen yeniden giriş yapın.');
                }
                
                console.log(`[DEBUG] Yoklamaya katılım için User.findByPk çağrılıyor. ID: ${decoded.user.id}`);
                const user = await User.findByPk(decoded.user.id);
                
                if (!user || user.rol !== 'ogrenci') {
                    return socket.emit('hata', { mesaj: 'Geçersiz kullanıcı veya yetki.' });
                }

                const { dersId, yoklamaId } = gecerliToken;
                beklemeListesi.set(socket.id, {
                    ogrenciId: user.id,
                    dersId: dersId,
                    yoklamaId: yoklamaId
                });

                socket.emit('katilim-alindi', { mesaj: 'Yoklama isteğiniz alındı. Öğretmenin dersi bitirmesi bekleniyor.' });

                const oturum = aktifOturumlar.get(dersId);
                if (oturum && oturum.ogretmenSocketId) {
                    io.to(oturum.ogretmenSocketId).emit('yeni-katilimci-beklemede', {
                        ad: user.ad,
                        soyad: user.soyad,
                        okulNumarasi: user.okulNumarasi
                    });
                }

            } catch (error) {
                console.error('--- YAKALANAN VERİTABANI HATASI ---');
                console.error(JSON.stringify(error, null, 2));
                console.error('--- HATA SONU ---');
                socket.emit('hata', { mesaj: 'Yoklama alınırken veritabanı ile hata oluştu.' });
            }
        });

        socket.on('yoklamayi-bitir', ({ dersId }) => {
            console.log(`Öğretmen yoklamayı manuel bitirdi: Ders ID ${dersId}`);
            sonlandirYoklama(dersId, io);
        });

        socket.on('disconnect', () => {
            console.log(`Bir kullanıcı ayrıldı: ${socket.id}`);
            aktifOturumlar.forEach((value, key) => {
                if (value.ogretmenSocketId === socket.id) {
                    console.log(`Öğretmen bağlantısı koptu, yoklama sonlandırılıyor: Ders ID ${key}`);
                    sonlandirYoklama(key, io);
                }
            });

            if (beklemeListesi.has(socket.id)) {
                beklemeListesi.delete(socket.id);
                console.log(`Bekleme listesindeki öğrenci ayrıldı: ${socket.id}`);
            }
        });
    });
};

module.exports = socketManager;
