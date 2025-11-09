import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import AddStudentModal from './AddStudentModal'; // Modal'ı import et

const YoklamaEkrani = () => {
    const [ders, setDers] = useState(null);
    const [error, setError] = useState(null);
    const [yoklamaSuresi, setYoklamaSuresi] = useState(90);
    
    const [yoklamaDurumu, setYoklamaDurumu] = useState('idle'); 
    
    const [aktifToken, setAktifToken] = useState(null);
    const [katilanOgrenciler, setKatilanOgrenciler] = useState([]); // Öğrenci listesi için state
    const [yoklamaId, setYoklamaId] = useState(null); // Yoklama ID'si için state
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

    const { dersId } = useParams();
    const navigate = useNavigate();
    const socket = useRef(null);

    const fetchDersDetails = useCallback(async () => {
        try {
            const response = await api.get(`/api/dersler/detay/${dersId}`);
            setDers(response.data);
        } catch (err) {
            setError('Ders detayları yüklenemedi.');
            setYoklamaDurumu('error');
        }
    }, [dersId]);

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.rol !== 'ogretmen') {
            navigate('/login');
        } else {
            fetchDersDetails();
        }
    }, [navigate, fetchDersDetails]);

    useEffect(() => {
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
            socket.current.emit('yoklamayi-baslat', {
                dersId: dersId,
                sure: yoklamaSuresi,
            });
        });

        socket.current.on('yeni-qr-token', ({ token }) => {
            setAktifToken(token);
        });

        // GÜNCELLENMİŞ OLAY DİNLEYİCİ
        socket.current.on('yoklama-sonlandi', ({ success, yoklamaId, katilanOgrenciler: gelenOgrenciler }) => {
            if (success) {
                setYoklamaDurumu('finished');
                setAktifToken(null);
                setKatilanOgrenciler(gelenOgrenciler || []);
                setYoklamaId(yoklamaId);
            } else {
                setError('Yoklama sonlandırılırken bir hata oluştu.');
                setYoklamaDurumu('error');
            }
        });
        
        socket.current.on('connect_error', (err) => {
            setError('Socket bağlantı hatası: ' + err.message);
            setYoklamaDurumu('error');
        });

        socket.current.on('hata', (data) => {
            setError(`Sunucu hatası: ${data.mesaj}`);
            setYoklamaDurumu('error');
            if (socket.current) socket.current.disconnect();
        });

        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, [yoklamaDurumu, dersId, yoklamaSuresi]);

    const handleYoklamaBaslat = () => {
        setError(null);
        setKatilanOgrenciler([]);
        setYoklamaId(null);
        setYoklamaDurumu('running');
    };

    const handleYoklamaErkenBitir = () => {
        if (socket.current && socket.current.connected) {
            socket.current.emit('yoklamayi-bitir', { dersId: dersId });
            console.log('Yoklamayı erken bitirme isteği gönderildi.');
        } else {
            setError('Socket bağlantısı yok. Yoklama erken bitirilemedi.');
            setYoklamaDurumu('error');
        }
    };

    const handleRemoveOgrenci = (ogrenciId) => {
        if (!yoklamaId) return;

        api.delete(`/api/yoklama/${yoklamaId}/ogrenciler/${ogrenciId}`)
            .then(() => {
                setKatilanOgrenciler(prev => prev.filter(o => o.id !== ogrenciId));
            })
            .catch(err => {
                alert('Öğrenci kaldırılamadı.');
                console.error(err);
            });
    };

    const handleStudentAdded = (yeniOgrenci) => {
        setKatilanOgrenciler(prev => [...prev, yeniOgrenci]);
        setIsAddStudentModalOpen(false);
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
                    <div className="w-full max-w-2xl text-center">
                        <span className="material-symbols-outlined text-green-500 text-7xl">task_alt</span>
                        <h2 className="text-3xl font-bold mt-4 mb-2">Yoklama Tamamlandı</h2>
                        <p className="text-xl mb-6">Toplam <span className="font-bold text-primary">{katilanOgrenciler.length}</span> öğrenci derse katıldı.</p>
                        
                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 text-left">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Katılan Öğrenciler</h3>
                                <button 
                                    onClick={() => setIsAddStudentModalOpen(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
                                    aria-label="Öğrenci Ekle"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="min-w-full">
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {katilanOgrenciler.map(ogrenci => (
                                            <tr key={ogrenci.id}>
                                                <td className="px-4 py-2 font-medium">{ogrenci.ad} {ogrenci.soyad}</td>
                                                <td className="px-4 py-2 text-gray-500 dark:text-slate-400">{ogrenci.okulNumarasi}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button onClick={() => handleRemoveOgrenci(ogrenci.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                        <span className="material-symbols-outlined">person_remove</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {katilanOgrenciler.length === 0 && <p className="text-center text-gray-500 py-4">Katılan öğrenci bulunmuyor.</p>}
                            </div>
                        </div>

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
                         <button onClick={handleYoklamaBaslat} className="mt-8 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
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
        <>
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
            {isAddStudentModalOpen && (
                <AddStudentModal 
                    dersId={dersId}
                    yoklamaId={yoklamaId}
                    mevcutOgrenciler={katilanOgrenciler}
                    onStudentAdded={handleStudentAdded}
                    onClose={() => setIsAddStudentModalOpen(false)}
                />
            )}
        </>
    );
};

export default YoklamaEkrani;