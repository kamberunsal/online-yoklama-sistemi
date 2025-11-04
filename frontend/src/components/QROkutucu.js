import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import io from 'socket.io-client';

const QROkutucu = () => {
    const [durum, setDurum] = useState('TARIYOR');
    const [kalanSure, setKalanSure] = useState(0);
    const [mesaj, setMesaj] = useState('QR kod okuyucu hazırlanıyor...');
    
    const navigate = useNavigate();
    const socket = useRef(null);
    const html5QrcodeScanner = useRef(null);

    // --- SOCKET.IO YÖNETİMİ (DÜZELTİLMİŞ AUTH MANTIĞI) ---
    useEffect(() => {
        const userString = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userString || !token) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(userString);

        socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            auth: { userId: user.id, token: token } // Düzeltilmiş Auth
        });

        socket.current.on('connect', () => console.log('Socket sunucusuna bağlandı.'));
        socket.current.on('yoklama-basarili-bekle', ({ kalanSure }) => {
            setKalanSure(kalanSure);
            setDurum('BEKLIYOR');
        });
        socket.current.on('yoklama-tamamlandi', () => setDurum('TAMAMLANDI'));
        socket.current.on('yoklama-iptal-edildi', () => setDurum('IPTAL'));
        socket.current.on('yoklama-hata', ({ message }) => {
            alert(`Hata: ${message}`);
            setDurum('TARIYOR');
        });
        socket.current.on('connect_error', (err) => {
            setMesaj(`Bağlantı Hatası: ${err.message}`);
            setDurum('HATA');
        });

        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, [navigate]);

    // --- QR OKUYUCU YÖNETİMİ ---
    useEffect(() => {
        if (durum !== 'TARIYOR') {
            if (html5QrcodeScanner.current?.getState() === 2) { // 2: SCANNING
                html5QrcodeScanner.current.stop().catch(err => {
                    console.error('QR okuyucu durdurulurken hata oluştu.', err);
                });
            }
            return;
        }
        
        if (durum === 'TARIYOR') {
            html5QrcodeScanner.current = new Html5Qrcode('qr-reader', false);
            setMesaj('Kamera başlatılıyor...');

            const onScanSuccess = (decodedText, decodedResult) => {
                if (socket.current) {
                    setMesaj('Kod okundu, sunucu onayı bekleniyor...');
                    if (html5QrcodeScanner.current?.getState() === 2) {
                         html5QrcodeScanner.current.stop().then(() => {
                            socket.current.emit('yoklamaya-katil', { qrToken: decodedText });
                         }).catch(err => {
                            console.error('Okuma sonrası durdurma başarısız', err);
                            socket.current.emit('yoklamaya-katil', { qrToken: decodedText }); // Yine de gönder
                         });
                    } else {
                        socket.current.emit('yoklamaya-katil', { qrToken: decodedText });
                    }
                }
            };

            html5QrcodeScanner.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                (errorMessage) => { /* onScanFailure'ı görmezden gel */ }
            ).catch(err => {
                setMesaj('Kamera başlatılamadı. Lütfen kamera izni verdiğinizden emin olun.');
                setDurum('HATA');
            });
        }

        return () => {
            if (html5QrcodeScanner.current?.getState() === 2) {
                html5QrcodeScanner.current.stop().catch(err => {
                    console.error('Component unmount olurken QR okuyucu durdurulamadı.', err);
                });
            }
        };
    }, [durum]);

    // --- BEKLEME EKRANI MANTIKLARI ---
    useEffect(() => {
        if (durum !== 'BEKLIYOR') return;

        const intervalId = setInterval(() => {
            setKalanSure(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (socket.current) socket.current.emit('sayfadan-ayrildim');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [durum]);

    const renderContent = () => {
        const scannerContainerClass = durum === 'TARIYOR' ? '' : 'hidden';

        return (
            <div className="w-full">
                <div id="qr-reader-container" className={scannerContainerClass}>
                    <div id="qr-reader" className="w-full max-w-xs mx-auto border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden"></div>
                </div>

                {durum === 'TARIYOR' && <p className="mt-4 text-center text-gray-500 dark:text-slate-400">{mesaj}</p>}
                
                {durum === 'BEKLIYOR' && (
                     <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
                        <h2 className="text-2xl font-bold mt-6">Yoklamanız Alındı, Lütfen Bekleyin</h2>
                        <p className="text-6xl font-mono font-bold my-4 text-primary">{kalanSure}</p>
                        <p className="text-red-500 font-semibold bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                            Oturum bitene kadar bu sayfadan ayrılmayın. <br/> Aksi halde yoklamanız İPTAL EDİLECEKTİR!
                        </p>
                    </div>
                )}

                {durum === 'TAMAMLANDI' && (
                    <div className="text-center text-green-500">
                        <span className="material-symbols-outlined text-8xl">task_alt</span>
                        <h2 className="text-3xl font-bold mt-4">Yoklamanız Başarıyla Kaydedildi!</h2>
                        <p className="mt-2">Artık bu sayfayı kapatabilirsiniz.</p>
                    </div>
                )}

                {durum === 'IPTAL' && (
                    <div className="text-center text-red-500">
                        <span className="material-symbols-outlined text-8xl">cancel</span>
                        <h2 className="text-3xl font-bold mt-4">Yoklamanız İptal Edildi!</h2>
                        <p className="mt-2">Oturum bitmeden sayfadan ayrıldığınız için kaydınız alınmadı.</p>
                    </div>
                )}

                {durum === 'HATA' && (
                    <div className="text-center text-red-500">
                        <span className="material-symbols-outlined text-8xl">error</span>
                        <h2 className="text-3xl font-bold mt-4">Bir Hata Oluştu</h2>
                        <p className="mt-2">{mesaj}</p>
                    </div>
                )}
            </div>
        );
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
