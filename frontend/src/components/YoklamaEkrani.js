import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';

const YoklamaEkrani = () => {
    const [yoklamaId, setYoklamaId] = useState(null);
    const [katilanlar, setKatilanlar] = useState([]);
    const [ders, setDers] = useState(null);
    const [error, setError] = useState(null);
    const { dersId } = useParams();
    const navigate = useNavigate();
    const socket = useRef(null);

    const fetchDersDetails = useCallback(async () => {
        try {
            const response = await api.get(`/api/dersler/detay/${dersId}`);
            setDers(response.data);
        } catch (err) {
            setError('Ders detayları yüklenemedi.');
        }
    }, [dersId]);

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.rol !== 'ogretmen') {
            navigate('/login');
            return;
        }

        fetchDersDetails();

        const startSession = async () => {
            try {
                const response = await api.post('/api/yoklama/baslat', {
                    dersId: dersId,
                    ogretmenId: loggedInUser.id
                });
                setYoklamaId(response.data.yoklamaId);
            } catch (err) {
                setError('Yoklama oturumu başlatılamadı.');
            }
        };

        startSession();

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, [dersId, navigate, fetchDersDetails]);

    useEffect(() => {
        if (yoklamaId) {
            socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
            socket.current.emit('join-yoklama-room', yoklamaId);
            socket.current.on('yeni-katilimci', (yeniKatilimci) => {
                setKatilanlar(prevKatilanlar => {
                    // Prevent duplicates
                    if (prevKatilanlar.some(k => k.id === yeniKatilimci.id)) {
                        return prevKatilanlar;
                    }
                    return [yeniKatilimci, ...prevKatilanlar];
                });
            });
            socket.current.on('connect_error', (err) => {
                setError('Socket bağlantı hatası.');
            });
        }
    }, [yoklamaId]);

    const handleBitir = () => {
        console.log('Yoklama bitirildi.');
        if (socket.current) {
            socket.current.disconnect();
        }
        navigate('/ders-programi');
    };

    if (error && !ders) {
        return <div className="min-h-screen bg-background-light dark:bg-background-dark flex justify-center items-center text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <Link to="/ders-programi" className="flex items-center text-primary hover:underline">
                            <span className="material-symbols-outlined mr-1">arrow_back</span>
                            Ders Programına Geri Dön
                        </Link>
                        <h1 className="text-3xl font-bold text-center">Yoklama: {ders ? ders.dersAdi : '...'}</h1>
                        <div className="w-48"></div> {/* Spacer */}
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                        
                        {/* QR Code Column */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 flex flex-col items-center justify-center">
                            {yoklamaId ? (
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold mb-4">Öğrencileriniz Bu Kodu Okutmalı</h2>
                                    <div className="p-4 bg-white inline-block rounded-lg shadow-inner">
                                        <QRCodeSVG value={yoklamaId} size={320} />
                                    </div>
                                    <p className="mt-4 text-gray-500 dark:text-slate-400">Oturum ID: {yoklamaId}</p>
                                    <button onClick={handleBitir} className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
                                        Yoklamayı Bitir
                                    </button>
                                </div>
                            ) : (
                                <p>{error ? error : 'Yoklama oturumu oluşturuluyor...'}</p>
                            )}
                        </div>

                        {/* Participants Column */}
                        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                            <h3 className="text-xl font-bold mb-4">Katılan Öğrenciler ({katilanlar.length})</h3>
                            <ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[60vh] overflow-y-auto">
                                {katilanlar.length > 0 ? katilanlar.map((ogrenci) => (
                                    <li key={ogrenci.id} className="flex items-center py-3 px-1">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-500 dark:text-slate-400">person</span>
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-bold text-primary text-sm">{ogrenci.ad} {ogrenci.soyad}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400"><span className="font-semibold">No:</span> {ogrenci.okulNumarasi}</p>
                                        </div>
                                    </li>
                                )) : <p className="text-gray-500 dark:text-slate-400 py-4 text-center">Henüz katılan öğrenci yok.</p>}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default YoklamaEkrani;