import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';
import DersEkleModal from '../DersEkleModal';

const DersYonetim = () => {
    const [dersler, setDersler] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dersToEdit, setDersToEdit] = useState(null);
    const [error, setError] = useState('');

    const fetchAllDersler = useCallback(async () => {
        try {
            const response = await api.get('/api/dersler/all');
            setDersler(response.data);
        } catch (err) {
            setError('Dersler yüklenemedi.');
        }
    }, []);

    const fetchTeachers = useCallback(async () => {
        try {
            const response = await axios.get('/api/users?rol=ogretmen');
            setTeachers(response.data);
        } catch (err) {
            console.error("Öğretmenler yüklenemedi", err);
        }
    }, []);

    useEffect(() => {
        fetchAllDersler();
        fetchTeachers();
    }, [fetchAllDersler, fetchTeachers]);

    const handleModalOpen = (ders = null) => {
        setDersToEdit(ders);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setDersToEdit(null);
    };

    const handleDersUpdated = () => {
        fetchAllDersler();
    };

    const handleDelete = async (dersId) => {
        if (window.confirm('Bu dersi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await api.delete(`/api/dersler/${dersId}`);
                setDersler(dersler.filter(d => d.id !== dersId));
            } catch (err) {
                setError('Ders silinirken bir hata oluştu.');
                console.error("Ders silme hatası:", err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
            <DersEkleModal 
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onDersEklendi={handleDersUpdated}
                teachers={teachers}
                dersToEdit={dersToEdit}
            />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Link to="/admin/dashboard" className="flex items-center text-primary hover:underline">
                            <span className="material-symbols-outlined mr-1">arrow_back</span>
                            Admin Paneline Geri Dön
                        </Link>
                        <h1 className="text-3xl font-bold">Ders Yönetimi</h1>
                        <button onClick={() => handleModalOpen()} className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                            <span className="material-symbols-outlined mr-2">add</span>
                            Yeni Ders Ekle
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Ders Adı</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Öğretmen</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Sınıf</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Gün & Saat</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {dersler.map(ders => (
                                    <tr key={ders.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ders.dersAdi}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{ders.ogretmen ? `${ders.ogretmen.ad} ${ders.ogretmen.soyad}` : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{ders.sinif}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{`${ders.gun}, ${ders.baslangicSaati} - ${ders.bitisSaati}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleModalOpen(ders)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-md text-xs">Düzenle</button>
                                            <button onClick={() => handleDelete(ders.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-xs">Sil</button>
                                            <Link to={`/admin/dersler/${ders.id}`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-xs no-underline">Öğrenci Ata</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DersYonetim;