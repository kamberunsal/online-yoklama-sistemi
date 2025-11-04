import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import io from 'socket.io-client';

const QROkutucu = () => {
    // 'TARIYOR', 'BEKLIYOR', 'TAMAMLANDI', 'IPTAL', 'HATA'
    const [durum, setDurum] = useState('TARIYOR');
    const [kalanSure, setKalanSure] = useState(0);
    const [mesaj, setMesaj] = useState('QR kod okuyucu hazırlanıyor...');
    
    const navigate = useNavigate();
    const socket = useRef(null);
    const qrcodeScanner = useRef(null);

    // --- SOCKET.IO YÖNETİMİ ---
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            navigate('/login');
            return;
        }

        socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            auth: { userId: user.id, token: user.token }
        });

        socket.current.on('connect', () => console.log('Socket sunucusuna bağlandı.'));

        socket.current.on('yoklama-basarili-bekle', ({ kalanSure }) => {
            setKalanSure(kalanSure);
            setDurum('BEKLIYOR');
        });

        socket.current.on('yoklama-tamamlandi', () => setDurum('TAMAMLANDI'));
        socket.current.on('yoklama-iptal-edildi', () => setDurum('IPTAL'));

        socket.current.on('yoklama-hata', ({ message }) => {
            alert(`Hata: ${message}`); // Basit bir alert ile hata gösterimi
            // Hata sonrası taramaya devam etmesi için durumu resetle
            if(durum !== 'TARIYOR') setDurum('TARIYOR');
        });

        socket.current.on('connect_error', (err) => {
            setMesaj(`Bağlantı Hatası: ${err.message}`);
            setDurum('HATA');
        });

        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, [navigate]); // Sadece ilk renderda çalışır

    // --- QR OKUYUCU YÖNETİMİ ---
    useEffect(() => {
        if (durum === 'TARIYOR' && !qrcodeScanner.current) {
            const scanner = new Html5Qrcode('qr-reader');
            qrcodeScanner.current = scanner;
            setMesaj('Kamera başlatılıyor...');

            scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText, decodedResult) => { // onScanSuccess
                    if (socket.current) {
                        socket.current.emit('yoklamaya-katil', { qrToken: decodedText });
                        setMesaj('QR Kod okundu, sunucu onayı bekleniyor...');
                        if (qrcodeScanner.current) {
                            qrcodeScanner.current.stop();
                            qrcodeScanner.current = null;
                        }
                    }
                },
                (errorMessage) => { /* onScanFailure, görmezden gel */ }
            ).catch(err => {
                setMesaj('Kamera başlatılamadı. Lütfen kamera izni verdiğinizden emin olun.');
                setDurum('HATA');
            });
        }

        return () => {
            if (qrcodeScanner.current) {
                qrcodeScanner.current.stop();
                qrcodeScanner.current = null;
            }
        };
    }, [durum]);

    // --- BEKLEME EKRANI MANTIKLARI (SAYAÇ VE GÖRÜNÜRLÜK) ---
    useEffect(() => {
        if (durum !== 'BEKLIYOR') return;

        // Geri sayım sayacı
        const intervalId = setInterval(() => {
            setKalanSure(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Sayfa görünürlüğü dinleyicisi
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (socket.current) {
                    socket.current.emit('sayfadan-ayrildim');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [durum]);


    const renderContent = () => {
        switch (durum) {
            case 'TARIYOR':
                return (
                    <>
                        <div id="qr-reader" className="w-full max-w-xs mx-auto border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden"></div>
                        <p className="mt-4 text-center text-gray-500 dark:text-slate-400">{mesaj}</p>
                    </>
                );
            case 'BEKLIYOR':
                return (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
                        <h2 className="text-2xl font-bold mt-6">Yoklamanız Alındı, Lütfen Bekleyin</h2>
                        <p className="text-6xl font-mono font-bold my-4 text-primary">{kalanSure}</p>
                        <p className="text-red-500 font-semibold bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                            Oturum bitene kadar bu sayfadan ayrılmayın. <br/> Aksi halde yoklamanız İPTAL EDİLECEKTİR!
                        </p>
                    </div>
                );
            case 'TAMAMLANDI':
                return (
                    <div className="text-center text-green-500">
                        <span className="material-symbols-outlined text-8xl">task_alt</span>
                        <h2 className="text-3xl font-bold mt-4">Yoklamanız Başarıyla Kaydedildi!</h2>
                        <p className="mt-2">Artık bu sayfayı kapatabilirsiniz.</p>
                    </div>
                );
            case 'IPTAL':
                return (
                    <div className="text-center text-red-500">
                        <span className="material-symbols-outlined text-8xl">cancel</span>
                        <h2 className="text-3xl font-bold mt-4">Yoklamanız İptal Edildi!</h2>
                        <p className="mt-2">Oturum bitmeden sayfadan ayrıldığınız için kaydınız alınmadı.</p>
                    </div>
                );
            case 'HATA':
                 return (
                    <div className="text-center text-red-500">
                        <span className="material-symbols-outlined text-8xl">error</span>
                        <h2 className="text-3xl font-bold mt-4">Bir Hata Oluştu</h2>
                        <p className="mt-2">{mesaj}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Link to="/ders-programi" className="flex items-center text-primary hover:underline">
                            <span className="material-symbols-outlined mr-1">arrow_back</span>
                            Geri Dön
                        </Link>
                        <h1 className="text-2xl font-bold">QR Kod Okutucu</h1>
                        <div className="w-20"></div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 md:p-8 flex items-center justify-center" style={{minHeight: '400px'}}>
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default QROkutucu;
