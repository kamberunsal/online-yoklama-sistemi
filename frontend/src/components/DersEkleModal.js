
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DersEkleModal = ({ isOpen, onClose, onDersEklendi, teachers = [], dersToEdit }) => {
    const isEditMode = Boolean(dersToEdit);

    const initialDersData = {
        dersAdi: '',
        sinif: '',
        gun: 'Pazartesi',
        baslangicSaati: '09:00',
        bitisSaati: '10:00',
        ogretmenId: teachers.length > 0 ? teachers[0].id : ''
    };

    const [dersData, setDersData] = useState(initialDersData);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setDersData({
                    dersAdi: dersToEdit.dersAdi || '',
                    sinif: dersToEdit.sinif || '',
                    gun: dersToEdit.gun || 'Pazartesi',
                    baslangicSaati: dersToEdit.baslangicSaati || '09:00',
                    bitisSaati: dersToEdit.bitisSaati || '10:00',
                    ogretmenId: dersToEdit.ogretmenId || (teachers.length > 0 ? teachers[0].id : '')
                });
            } else {
                setDersData({
                    ...initialDersData,
                    ogretmenId: teachers.length > 0 ? teachers[0].id : ''
                });
            }
        }
    }, [isOpen, isEditMode, dersToEdit, teachers]);

    if (!isOpen) return null;

    const onChange = e => setDersData({ ...dersData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        const url = isEditMode ? `http://localhost:5000/api/dersler/${dersToEdit.id}` : 'http://localhost:5000/api/dersler';
        const method = isEditMode ? 'put' : 'post';

        try {
            await axios[method](url, dersData);
            onDersEklendi();
            onClose();
        } catch (err) {
            setError(`Ders ${isEditMode ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`);
            console.error(`Ders ${isEditMode ? 'güncelleme' : 'ekleme'} hatası:`, err);
        }
    };

    const inputBaseClasses = "form-input mt-1 block w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-12 p-3";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 font-display">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-center mb-6 text-[#0d171b] dark:text-slate-50">{isEditMode ? 'Ders Düzenle' : 'Yeni Ders Ekle'}</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Ders Adı</label>
                        <input type="text" name="dersAdi" value={dersData.dersAdi} onChange={onChange} required className={inputBaseClasses} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Sınıf</label>
                        <input type="text" name="sinif" value={dersData.sinif} onChange={onChange} required className={inputBaseClasses} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Öğretmen</label>
                        <select name="ogretmenId" value={dersData.ogretmenId} onChange={onChange} required className={inputBaseClasses}>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.ad} {teacher.soyad}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Gün</label>
                            <select name="gun" value={dersData.gun} onChange={onChange} className={inputBaseClasses}>
                                <option>Pazartesi</option>
                                <option>Salı</option>
                                <option>Çarşamba</option>
                                <option>Perşembe</option>
                                <option>Cuma</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Başlangıç</label>
                                <input type="time" name="baslangicSaati" value={dersData.baslangicSaati} onChange={onChange} required className={inputBaseClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Bitiş</label>
                                <input type="time" name="bitisSaati" value={dersData.bitisSaati} onChange={onChange} required className={inputBaseClasses} />
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-semibold rounded-lg transition-colors">
                            İptal
                        </button>
                        <button type="submit" className="py-2 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors">
                            {isEditMode ? 'Değişiklikleri Kaydet' : 'Dersi Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DersEkleModal;
