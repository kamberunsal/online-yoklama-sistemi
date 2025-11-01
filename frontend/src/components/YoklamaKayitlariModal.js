import React, { useState, useEffect } from 'react';
import api from '../api';

const YoklamaKayitlariModal = ({ ders, onClose }) => {
    const [kayitlar, setKayitlar] = useState([]);
    const [seciliKayit, setSeciliKayit] = useState(null);
    const [ogrenciler, setOgrenciler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (ders) {
            setLoading(true);
            api.get(`/api/yoklama/kayitlar/${ders.id}`)
                .then(response => {
                    setKayitlar(response.data);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Yoklama kayıtları yüklenemedi.');
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [ders]);

    const handleKayitClick = (kayitId) => {
        setLoading(true);
        setSeciliKayit(kayitId);
        api.get(`/api/yoklama/${kayitId}`)
            .then(response => {
                setOgrenciler(response.data.katilanOgrenciler);
                setLoading(false);
            })
            .catch(err => {
                setError('Öğrenci listesi yüklenemedi.');
                console.error(err);
                setLoading(false);
            });
    };
    
    const formatTarih = (tarih) => {
        const date = new Date(tarih);
        return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">Yoklama Kayıtları: {ders?.dersAdi}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-slate-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-grow flex overflow-hidden">
                    {/* Sol Taraf: Kayıt Listesi */}
                    <div className="w-1/3 border-r dark:border-slate-700 overflow-y-auto p-4">
                        <h3 className="text-lg font-semibold mb-2 dark:text-slate-300">Geçmiş Yoklamalar</h3>
                        {loading && !kayitlar.length ? <p>Yükleniyor...</p> : null}
                        {error && !kayitlar.length ? <p className="text-red-500">{error}</p> : null}
                        <ul>
                            {kayitlar.map(kayit => (
                                <li key={kayit.id} 
                                    onClick={() => handleKayitClick(kayit.id)}
                                    className={`p-2 rounded-lg cursor-pointer mb-2 ${seciliKayit === kayit.id ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                    <p className="font-semibold">{formatTarih(kayit.tarih)}</p>
                                    <p className="text-sm">{kayit.yoklamaDurumu}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Sağ Taraf: Öğrenci Listesi */}
                    <div className="w-2/3 overflow-y-auto p-4">
                        <h3 className="text-lg font-semibold mb-2 dark:text-slate-300">Katılan Öğrenciler</h3>
                        {loading && seciliKayit ? <p>Öğrenciler yükleniyor...</p> : null}
                        {!loading && seciliKayit && ogrenciler.length === 0 ? <p>Bu yoklamaya katılan öğrenci bulunmuyor.</p> : null}
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Ad</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Soyad</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Okul Numarası</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {ogrenciler.map(ogrenci => (
                                        <tr key={ogrenci.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">{ogrenci.ad}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{ogrenci.soyad}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{ogrenci.okulNumarasi}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YoklamaKayitlariModal;
