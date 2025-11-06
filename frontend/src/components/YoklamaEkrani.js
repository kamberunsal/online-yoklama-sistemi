import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';

const YoklamaEkrani = () => {
    const [ders, setDers] = useState(null);
    const [error, setError] = useState(null);
    const [yoklamaSuresi, setYoklamaSuresi] = useState(90); // Varsayılan süre 90sn
    
    // 'idle', 'running', 'finished', 'error'
    const [yoklamaDurumu, setYoklamaDurumu] = useState('idle'); 
    
    const [aktifToken, setAktifToken] = useState(null);
    const [katilimciSayisi, setKatilimciSayisi] = useState(0);

    const { dersId } = useParams();
    const navigate = useNavigate();
    const socket = useRef(null);

    // Ders detaylarını getiren fonksiyon
    const fetchDersDetails = useCallback(async () => {
        try {
            const response = await api.get(`/api/dersler/detay/${dersId}`);
            setDers(response.data);
        } catch (err) {
            setError('Ders detayları yüklenemedi.');
            setYoklamaDurumu('error');
        }
    }, [dersId]);

    // Component ilk yüklendiğinde ders detaylarını getir
    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.rol !== 'ogretmen') {
            navigate('/login');
        } else {
            fetchDersDetails();
        }
    }, [navigate, fetchDersDetails]);

    // Socket bağlantısını ve olay dinleyicilerini yöneten useEffect
    useEffect(() => {
        // Socket'i sadece yoklama çalışırken bağlı tut
        if (yoklamaDurumu !== 'running') {
            if (socket.current) {
                socket.current.disconnect();
                socket.current = null;
            }
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
             auth: { token: user?.token }
        });

        socket.current.on('connect', () => {
            console.log('Socket sunucusuna bağlandı! Yoklama başlatılıyor...');
            // Bağlantı kurulur kurulmaz yoklama başlatma olayını gönder.
            socket.current.emit('yoklamayi-baslat', {
                dersId: dersId,
                sure: yoklamaSuresi, // Süreyi saniye cinsinden gönder
            });
        });

        socket.current.on('yeni-qr-token', ({ token }) => {
            setAktifToken(token);
        });

        socket.current.on('yoklama-sonlandi', ({ success, message, katilanSayisi }) => {
            setYoklamaDurumu('finished');
            setAktifToken(null);
            if(success) {
                setKatilimciSayisi(katilanSayisi);
            } else {
                setError(message || 'Yoklama sonlandırılırken bir hata oluştu.');
            }
        });
        
        socket.current.on('connect_error', (err) => {
            setError('Socket bağlantı hatası: ' + err.message);
            setYoklamaDurumu('error');
        });

        // Component unmount olduğunda veya yoklama durumu değiştiğinde socket'i kapat
        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, [yoklamaDurumu, dersId, yoklamaSuresi]);


    const handleYoklamaBaslat = () => {
        setError(null);
        setYoklamaDurumu('running'); // Sadece UI'ı "çalışıyor" moduna al, useEffect gerisini halledecek
    };

    const handleYoklamaErkenBitir = () => {
        if (socket.current && socket.current.connected) {
            socket.current.emit('yoklamayi-erken-bitir', { dersId: dersId });
            console.log('Yoklamayı erken bitirme isteği gönderildi.');
            // UI'ı hemen güncelle
            setAktifToken(null);
            setYoklamaDurumu('finished'); 
        } else {
            setError('Socket bağlantısı yok. Yoklama erken bitirilemedi.');
            setYoklamaDurumu('error');
        }
    };
    
    const renderContent = () => {
        switch (yoklamaDurumu) {
            case 'running':
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Öğrencileriniz Bu Kodu Okutmalı</h2>
                        <p className="mb-4 text-gray-500 dark:text-slate-400">QR Kod her 5 saniyede bir yenilenir.</p>
                        <div className="p-4 bg-white inline-block rounded-lg shadow-inner">
                            {aktifToken ? <QRCodeSVG value={aktifToken} size={300} /> : <p>QR kod bekleniyor...</p>}
                        </div>
                        <button
                            onClick={handleYoklamaErkenBitir}
                            className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg flex items-center justify-center mx-auto"
                        >
                            <span className="material-symbols-outlined mr-2">stop_circle</span>
                            Yoklamayı Erken Bitir
                        </button>
                    </div>
                );
            case 'finished':
                return (
                    <div className="text-center">
                        <span className="material-symbols-outlined text-green-500 text-7xl">task_alt</span>
                        <h2 className="text-3xl font-bold mt-4 mb-2">Yoklama Tamamlandı</h2>
                        <p className="text-xl">Toplam <span className="font-bold text-primary">{katilimciSayisi}</span> öğrenci derse katıldı.</p>
                        <button onClick={() => navigate('/ders-programi')} className="mt-8 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
                            Ders Programına Dön
                        </button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center text-red-500">
                        <span className="material-symbols-outlined text-7xl">error</span>
                        <h2 className="text-3xl font-bold mt-4 mb-2">Bir Hata Oluştu</h2>
                        <p>{error}</p>
                         <button onClick={() => setYoklamaDurumu('idle')} className="mt-8 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
                            Tekrar Dene
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="text-center max-w-sm mx-auto">
                        <h2 className="text-2xl font-bold mb-4">Yoklamayı Başlat</h2>
                        <p className="mb-6 text-gray-500 dark:text-slate-400">Yoklama süresini saniye cinsinden belirtin ve oturumu başlatın.</p>
                        <div className="mb-6">
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Süre (saniye)</label>
                            <input
                                type="number"
                                id="duration"
                                value={yoklamaSuresi}
                                onChange={(e) => setYoklamaSuresi(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                min="10"
                            />
                        </div>
                        <button onClick={handleYoklamaBaslat} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg flex items-center justify-center">
                            <span className="material-symbols-outlined mr-2">qr_code_scanner</span>
                            Yoklamayı Başlat
                        </button>
                    </div>
                );
        }
    };

    if (!ders && yoklamaDurumu !== 'error') {
        return <div className="min-h-screen bg-background-light dark:bg-background-dark flex justify-center items-center"><p>Ders bilgileri yükleniyor...</p></div>;
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <Link to="/ders-programi" className="flex items-center text-primary hover:underline">
                            <span className="material-symbols-outlined mr-1">arrow_back</span>
                            Geri Dön
                        </Link>
                        <h1 className="text-3xl font-bold text-center">{ders?.dersAdi || 'Yoklama'}</h1>
                        <div className="w-24"></div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-8 flex flex-col items-center justify-center" style={{ minHeight: '500px' }}>
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default YoklamaEkrani;