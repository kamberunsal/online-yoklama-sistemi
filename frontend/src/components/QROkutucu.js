import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import io from 'socket.io-client';

const QROkutucu = () => {
    const [statusMessage, setStatusMessage] = useState('QR kod okuyucu yükleniyor...');
    const [statusType, setStatusType] = useState('info'); // info, success, error
    const navigate = useNavigate();
    const socket = useRef(null);
    const scannerRef = useRef(null); // To hold the scanner instance

    // This function handles the logic after a QR code is successfully decoded
    const handleScanResult = useCallback((yoklamaId) => {
        setStatusMessage(`Yoklama ID'si okundu: ${yoklamaId}. Sunucuya bağlanılıyor...`);
        setStatusType('info');

        const token = localStorage.getItem('token');
        if (!token) {
            setStatusMessage('Hata: Giriş yapılmamış. Lütfen tekrar giriş yapın.');
            setStatusType('error');
            return;
        }

        socket.current = io(process.env.REACT_APP_API_URL, { transports: ['websocket'] });

        socket.current.on('connect', () => {
            setStatusMessage('Sunucuya bağlandı. Yoklamaya katılım gönderiliyor...');
            socket.current.emit('yoklamaya-katil', { yoklamaId, kullaniciToken: token });
        });

        socket.current.on('katilim-basarili', (message) => {
            setStatusMessage(message);
            setStatusType('success');
            setTimeout(() => navigate('/ders-programi'), 2000);
        });

        socket.current.on('zaten-katildin', (message) => {
            setStatusMessage(message);
            setStatusType('info');
            setTimeout(() => navigate('/ders-programi'), 2000);
        });

        socket.current.on('error', (errorMessage) => {
            setStatusMessage(`Hata: ${errorMessage}`);
            setStatusType('error');
        });

        socket.current.on('connect_error', (err) => {
            setStatusMessage(`Bağlantı Hatası: ${err.message}`);
            setStatusType('error');
        });

    }, [navigate]);

    // This effect handles the scanner setup and cleanup
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Success callback
        const onScanSuccess = (decodedText, decodedResult) => {
            // Stop the scanner once a QR code is successfully scanned.
            if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
            }
            handleScanResult(decodedText);
        };

        // Failure callback
        const onScanFailure = (error) => {
            // This callback is called frequently, so we only log significant errors.
            if (!String(error).includes('No QR code found')) {
                console.warn(`QR Code Scan Error: ${error}`);
            }
        };

        // Only initialize the scanner if it hasn't been initialized yet.
        if (!scannerRef.current) {
            try {
                const html5QrcodeScanner = new Html5QrcodeScanner(
                    "qr-reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        rememberLastUsedCamera: true,
                    },
                    false // verbose
                );
                html5QrcodeScanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = html5QrcodeScanner; // Store instance in ref
                setStatusMessage('Kamerayı QR koda doğru tutun...');
            } catch (err) {
                console.error("Html5QrcodeScanner initialization failed!", err);
                setStatusMessage(`Kamera başlatılamadı: ${err.message}`);
                setStatusType('error');
            }
        }

        // Cleanup function to ensure the scanner is properly stopped on component unmount.
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Scanner cleanup failed.", err));
            }
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, [navigate, handleScanResult]);

    const statusColors = {
        info: 'text-gray-500 dark:text-slate-400',
        success: 'text-green-500',
        error: 'text-red-500',
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

                    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 md:p-8">
                        {/* This div is where the scanner will be rendered */}
                        <div id="qr-reader" className="w-full max-w-xs mx-auto"></div>
                        <div className="text-center mt-6">
                            <h3 className="font-semibold">Durum</h3>
                            <p className={`mt-1 font-medium text-lg ${statusColors[statusType]}`}>{statusMessage}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default QROkutucu;