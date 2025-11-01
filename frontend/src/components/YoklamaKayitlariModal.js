import React, { useState, useEffect } from 'react';
import api from '../api';
import AddStudentModal from './AddStudentModal'; // Import the new modal

const YoklamaKayitlariModal = ({ ders, onClose }) => {
    const [kayitlar, setKayitlar] = useState([]);
    const [seciliKayit, setSeciliKayit] = useState(null);
    const [ogrenciler, setOgrenciler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false); // State for the new modal

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

    const handleDeleteKayit = (kayitId) => {
        if (window.confirm('Bu yoklama kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            api.delete(`/api/yoklama/${kayitId}`)
                .then(() => {
                    setKayitlar(prevKayitlar => prevKayitlar.filter(k => k.id !== kayitId));
                    if (seciliKayit === kayitId) {
                        setSeciliKayit(null);
                        setOgrenciler([]);
                    }
                })
                .catch(err => {
                    setError('Yoklama kaydı silinemedi.');
                    console.error(err);
                });
        }
    };

    const handleRemoveOgrenci = (ogrenciId) => {
        if (!seciliKayit) return;

        api.delete(`/api/yoklama/${seciliKayit}/ogrenciler/${ogrenciId}`)
            .then(() => {
                setOgrenciler(prevOgrenciler => prevOgrenciler.filter(o => o.id !== ogrenciId));
            })
            .catch(err => {
                setError('Öğrenci kaldırılamadı.');
                console.error(err);
            });
    };

    const handleStudentAdded = (yeniOgrenci) => {
        setOgrenciler(prevOgrenciler => [...prevOgrenciler, yeniOgrenci]);
        setIsAddStudentModalOpen(false); // Close the modal after adding
    };
    
    const formatTarih = (tarih) => {
        const date = new Date(tarih);
        return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <>
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
                                        className={`p-2 rounded-lg group mb-2 flex justify-between items-center ${seciliKayit === kayit.id ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                        <div onClick={() => handleKayitClick(kayit.id)} className="cursor-pointer flex-grow">
                                            <p className="font-semibold">{formatTarih(kayit.tarih)}</p>
                                            <p className="text-sm">{kayit.yoklamaDurumu}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteKayit(kayit.id); }}
                                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 ml-2">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Sağ Taraf: Öğrenci Listesi */}
                        <div className="w-2/3 overflow-y-auto p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold dark:text-slate-300">Katılan Öğrenciler</h3>
                                {seciliKayit && (
                                    <button 
                                        onClick={() => setIsAddStudentModalOpen(true)}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
                                        aria-label="Öğrenci Ekle"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                )}
                            </div>
                            
                            {loading && seciliKayit ? <p>Öğrenciler yükleniyor...</p> : null}
                            {!loading && seciliKayit && ogrenciler.length === 0 ? <p>Bu yoklamaya katılan öğrenci bulunmuyor.</p> : null}
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Ad</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Soyad</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Okul Numarası</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Kaldır</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {ogrenciler.map(ogrenci => (
                                            <tr key={ogrenci.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">{ogrenci.ad}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{ogrenci.soyad}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{ogrenci.okulNumarasi}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleRemoveOgrenci(ogrenci.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                        <span className="material-symbols-outlined">person_remove</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isAddStudentModalOpen && (
                <AddStudentModal 
                    dersId={ders.id}
                    yoklamaId={seciliKayit}
                    mevcutOgrenciler={ogrenciler}
                    onStudentAdded={handleStudentAdded}
                    onClose={() => setIsAddStudentModalOpen(false)}
                />
            )}
        </>
    );

export default YoklamaKayitlariModal;
