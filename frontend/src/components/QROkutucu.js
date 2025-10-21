import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import io from 'socket.io-client';

const QROkutucu = () => {
    const [statusMessage, setStatusMessage] = useState('Kamerayı QR koda doğru tutun...');
    const [statusType, setStatusType] = useState('info'); // info, success, error
    const [isScanning, setIsScanning] = useState(true);
    const navigate = useNavigate();
    const socket = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');
        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, [navigate]);

    const handleScan = (result) => {
        if (result && result.length > 0 && isScanning) {
            setIsScanning(false);
            const yoklamaId = result[0].rawValue; // Get rawValue from the first result
            setStatusMessage(`Yoklama ID'si okundu. Sunucuya bağlanılıyor...`);
            setStatusType('info');

            const token = localStorage.getItem('token');
            if (!token) {
                setStatusMessage('Hata: Giriş yapılmamış. Lütfen tekrar giriş yapın.');
                setStatusType('error');
                return;
            }

            // Use environment variable for API URL
            socket.current = io(process.env.REACT_APP_API_URL);

            socket.current.on('connect', () => {
                setStatusMessage('Sunucuya bağlandı. Yoklamaya katılım gönderiliyor...');
                socket.current.emit('yoklamaya-katil', { yoklamaId, kullaniciToken: token });
            });

            socket.current.on('katilim-basarili', (message) => {
                setStatusMessage(message);
                setStatusType('success');
                setTimeout(() => navigate('/ders-programi'), 2000);
                socket.current.disconnect();
            });

            socket.current.on('zaten-katildin', (message) => {
                setStatusMessage(message);
                setStatusType('info');
                setTimeout(() => navigate('/ders-programi'), 2000);
                socket.current.disconnect();
            });

            socket.current.on('error', (errorMessage) => {
                setStatusMessage(`Hata: ${errorMessage}`);
                setStatusType('error');
                setIsScanning(true);
                if(socket.current) socket.current.disconnect();
            });

            socket.current.on('connect_error', () => {
                setStatusMessage('Hata: Sunucuya bağlanılamadı.');
                setStatusType('error');
                setIsScanning(true);
            });
        }
    };

    const handleError = (err) => {
        console.error(err);
        const errorMessage = err?.message ? err.message : String(err);
        setStatusMessage(`Kamera Hatası: ${errorMessage}`);
        setStatusType('error');
        setIsScanning(true); // Allow rescanning on error
    };

    const statusColors = {
        info: 'text-gray-500 dark:text-slate-400',
        success: 'text-green-500',
        error: 'text-red-500',
    };

    return (
        <>
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

                        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 md:p-8">
                            <div className="w-full max-w-xs mx-auto">
                                {isScanning ? (
                                    <div className="scanner-container relative w-full pt-[100%] overflow-hidden rounded-xl">
                                        <Scanner
                                            onResult={handleScan}
                                            onError={handleError}
                                            options={{
                                                delayBetweenScanSuccess: 300, // Optional: Add a small delay to prevent multiple scans
                                            }}
                                            styles={{
                                                container: {
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                },
                                                video: {
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                },
                                            }}
                                        />
                                        {/* Laser effect can be added with custom CSS if desired, but removed for simplicity */}
                                    </div>
                                ) : (
                                    <div className="aspect-square w-full flex flex-col justify-center items-center">
                                        <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="mt-4 font-medium">İşleniyor...</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-center mt-6">
                                <h3 className="font-semibold">Durum</h3>
                                <p className={`mt-1 font-medium text-lg ${statusColors[statusType]}`}>{statusMessage}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default QROkutucu;