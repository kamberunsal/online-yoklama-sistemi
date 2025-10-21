# Proje: QR Kod ile Yoklama Sistemi (MERN Stack + Socket.IO)

Bu dosya, MERN yığını (MongoDB, Express, React, Node.js) ve Socket.IO kullanarak QR kod tabanlı bir yoklama sistemi geliştirmek için Gemini'ye verilecek talimatları içerir. Her bölüm, projenin farklı bir parçasını oluşturmak için ayrı ayrı kullanılabilir.

---

## BÖLÜM 1: BACKEND - Sunucu ve Veritabanı Kurulumu

Sen deneyimli bir backend geliştiricisisin. Aşağıdaki adımları takip ederek projenin temelini oluştur.

1.  **Klasör Yapısı:** Bana Node.js/Express projesi için modern ve ölçeklenebilir bir klasör yapısı öner. (controllers, models, routes, config gibi klasörler içermeli).
2.  **Temel Sunucu Kodu:** `server.js` adında bir ana dosya oluştur. Bu dosya Express sunucusunu başlatsın, veritabanı bağlantısını kursun ve temel route'ları içersin. CORS (Cross-Origin Resource Sharing) ayarlarını da ekle.
3.  **Veritabanı Modelleri (Mongoose):** Proje için gerekli olan 3 adet Mongoose şemasını oluştur:
    * **User (Kullanıcı):** `email`, `password` (hash'lenmiş), `ad`, `soyad`, `okulNumarasi` (öğrenci için), ve `rol` (`'ogrenci'`, `'ogretmen'`, `'admin'`) alanlarını içersin.
    * **Ders:** `dersAdi`, `ogretmenId` (User modeline referans), `sinif`, `gun`, `baslangicSaati`, `bitisSaati` alanlarını içersin.
    * **Yoklama:** `dersId` (Ders modeline referans), `ogretmenId`, `tarih`, `katilanOgrenciler` (User ID'lerini içeren bir dizi), `yoklamaDurumu` (`'aktif'`, `'tamamlandi'`) alanlarını içersin.

Lütfen bu üç isteği karşılayan kodları ayrı ayrı ve açıklamalarıyla birlikte oluştur.

---

## BÖLÜM 2: BACKEND - Kullanıcı İşlemleri ve API Rotaları

Şimdi kullanıcı kimlik doğrulama (authentication) sistemini ve temel API rotalarını oluştur.

1.  **Kullanıcı Kayıt (Register) ve Giriş (Login) API'si:**
    * `/api/auth/register` rotası oluştur. Gelen kullanıcı verisini alıp veritabanına kaydetsin. Şifreyi kaydetmeden önce `bcryptjs` ile hash'lesin.
    * `/api/auth/login` rotası oluştur. Gelen email ve şifreyi kontrol etsin. Başarılı girişte bir JWT (JSON Web Token) üretsin ve kullanıcıya döndürsün.
2.  **Ders Ekleme/Listeleme API'si:**
    * `POST /api/dersler`: Öğretmenin yeni bir ders ekleyebileceği bir endpoint oluştur.
    * `GET /api/dersler/:userId`: Belirli bir öğretmene veya öğrenciye ait dersleri listeleyen bir endpoint oluştur.

Lütfen bu rotaların `controller` ve `route` dosyalarını ayrı ayrı oluştur.

---

## BÖLÜM 3: BACKEND - Gerçek Zamanlı Yoklama Mantığı (Socket.IO)

Projenin en kritik kısmını, yani gerçek zamanlı yoklama mekanizmasını oluştur.

1.  **Yoklama Başlatma API'si:**
    * `POST /api/yoklama/baslat` adında bir endpoint oluştur. Bu endpoint, istek atan öğretmenin ID'si ve dersin ID'si ile yeni bir "Yoklama" dokümanı oluştursun. Durumunu `'aktif'` yapsın ve bu yoklamanın benzersiz ID'sini (`_id`) döndürsün. Bu ID, QR kodun verisi olacak.
2.  **Socket.IO Entegrasyonu:**
    * `server.js` dosyasına Socket.IO'yu entegre et.
    * Bir öğrenci QR kodu okutup sunucuya `yoklamaya-katil` olayı ile bağlandığında şu adımları izle:
        * Gelen veriler: `yoklamaId` ve öğrencinin `kullaniciToken`'ı.
        * Token'ı doğrula ve öğrencinin ID'sini al.
        * Öğrencinin ID'sini, ilgili `yoklamaId`'ye sahip dokümanın `katilanOgrenciler` dizisine ekle (eğer daha önce eklenmemişse).
        * Veritabanından katılan öğrencinin adını, soyadını ve numarasını bul.
        * `yeni-katilimci` adıyla bir olay yayınla ve bu olayın verisi olarak yeni katılan öğrencinin bilgilerini gönder. Bu olay, `yoklamaId` adında bir "oda"ya (room) gönderilmeli ki sadece o yoklamayı başlatan öğretmen bu veriyi alsın.

Bu mantığı içeren, açıklamalı bir `socketManager.js` dosyası ve ilgili API controller kodunu oluştur.

---

## BÖLÜM 4: FRONTEND - React Bileşenleri (Component)

Şimdi projenin arayüzlerini oluşturacak React bileşenlerinin kodlarını yaz. Modern React (Hooks kullanarak) ve `axios` ile API isteği yap.

1.  **Haftalık Ders Programı Bileşeni (`DersProgrami.js`):**
    * Haftanın günlerini ve saat dilimlerini gösteren bir tablo (çizelge) yapısı oluştursun.
    * API'den kullanıcının derslerini çekip bu tabloya yerleştirsin.
    * Öğretmen ise, ders ekleme butonu ve modal'ı olsun.
    * Dersin üzerine tıklandığında ilgili aksiyonu tetiklesin (öğretmen için yoklama başlatma, öğrenci için QR okutma ekranına gitme).
2.  **Öğretmen Yoklama Ekranı (`YoklamaEkrani.js`):**
    * Sayfa yüklendiğinde `POST /api/yoklama/baslat` isteği atarak yoklama oturumunu başlatsın.
    * Gelen yoklama ID'sini kullanarak bir QR kod üretsin ve ekranda göstersin (`qrcode.react` kütüphanesini kullan).
    * Socket.IO ile sunucuyu dinlesin. `yeni-katilimci` olayını dinleyerek gelen öğrencileri anlık olarak bir listeye eklesin.
    * "Yoklamayı Bitir" butonu olsun.
3.  **Öğrenci QR Okutma Bileşeni (`QROkutucu.js`):**
    * `react-qr-reader` veya benzeri bir kütüphane kullanarak telefonun kamerasını açsın.
    * Bir QR kod okuduğunda, içindeki veriyi (yoklamaId) alsın.
    * Socket.IO sunucusuna `yoklamaya-katil` olayını, yoklama ID'si ve kendi kimlik token'ı ile birlikte göndersin.
    * Başarılı olduğunda "Yoklamaya katıldınız!" mesajını göstersin.

Lütfen bu üç React bileşeninin kodunu, gerekli state yönetimini (useState, useEffect) içerecek şekilde ayrı ayrı oluştur.