import React, { useState } from 'react';
import axios from 'axios';

const KullaniciEkleModal = ({ isOpen, onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        ad: '',
        soyad: '',
        email: '',
        password: '',
        okulNumarasi: '',
        rol: 'ogrenci'
    });
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (formData.password !== password2) {
            setError('Şifreler eşleşmiyor.');
            return;
        }
        setError('');
        try {
            await axios.post('http://localhost:5000/api/auth/register', formData);
            onUserAdded();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Kullanıcı eklenirken bir hata oluştu.');
            console.error('Kullanıcı ekleme hatası:', err);
        }
    };

    const inputBaseClasses = "form-input mt-1 block w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-12 p-3";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 font-display">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-center mb-6 text-[#0d171b] dark:text-slate-50">Yeni Kullanıcı Ekle</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Form fields copied from Register.js and styled like other modals */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Ad</label>
                        <input type="text" name="ad" value={formData.ad} onChange={onChange} required className={inputBaseClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Soyad</label>
                        <input type="text" name="soyad" value={formData.soyad} onChange={onChange} required className={inputBaseClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">E-posta</label>
                        <input type="email" name="email" value={formData.email} onChange={onChange} required className={inputBaseClasses} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Rol</label>
                        <select name="rol" value={formData.rol} onChange={onChange} required className={inputBaseClasses}>
                            <option value="ogrenci">Öğrenci</option>
                            <option value="ogretmen">Öğretmen</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {formData.rol === 'ogrenci' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Okul Numarası</label>
                            <input type="text" name="okulNumarasi" value={formData.okulNumarasi} onChange={onChange} className={inputBaseClasses} />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Şifre</label>
                        <input type="password" name="password" value={formData.password} onChange={onChange} required minLength="6" className={inputBaseClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Şifre Tekrar</label>
                        <input type="password" name="password2" value={password2} onChange={(e) => setPassword2(e.target.value)} required minLength="6" className={inputBaseClasses} />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-semibold rounded-lg transition-colors">
                            İptal
                        </button>
                        <button type="submit" className="py-2 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors">
                            Kullanıcıyı Ekle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KullaniciEkleModal;
