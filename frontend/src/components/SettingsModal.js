import React, { useState } from 'react';
import api from '../api';

const SettingsModal = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmNewPassword) {
            setError('Yeni şifreler eşleşmiyor.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.put('/api/auth/update-password', {
                currentPassword,
                newPassword,
                confirmNewPassword
            });
            setMessage(response.data.msg);
            // Clear fields after success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">Şifre Değiştir</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-slate-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mevcut Şifre</label>
                        <input 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-[#4c809a] dark:placeholder:text-slate-500 p-[15px] text-base"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Yeni Şifre</label>
                        <input 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-[#4c809a] dark:placeholder:text-slate-500 p-[15px] text-base"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Yeni Şifreyi Onayla</label>
                        <input 
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-[#4c809a] dark:placeholder:text-slate-500 p-[15px] text-base"
                        />
                    </div>

                    {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
                    {message && <p className="text-green-500 text-center text-sm mb-4">{message}</p>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                        {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
