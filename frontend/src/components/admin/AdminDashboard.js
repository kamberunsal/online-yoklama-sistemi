import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
            <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                <h1 className="text-xl font-bold text-primary">Admin Paneli</h1>
                <button 
                    onClick={handleLogout} 
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                    Çıkış Yap
                </button>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-6 text-center">Yönetim Menüsü</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Ders Yönetimi Kartı */}
                        <Link to="/admin/dersler" className="block p-8 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center space-x-4">
                                <span className="material-symbols-outlined text-4xl text-primary">school</span>
                                <div>
                                    <h3 className="text-2xl font-bold">Ders Yönetimi</h3>
                                    <p className="text-gray-500 dark:text-slate-400 mt-1">Yeni dersler ekleyin, mevcutları düzenleyin ve öğrenci atayın.</p>
                                </div>
                            </div>
                        </Link>

                        {/* Kullanıcı Yönetimi Kartı */}
                        <Link to="/admin/kullanicilar" className="block p-8 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center space-x-4">
                                <span className="material-symbols-outlined text-4xl text-primary">group</span>
                                <div>
                                    <h3 className="text-2xl font-bold">Kullanıcı Yönetimi</h3>
                                    <p className="text-gray-500 dark:text-slate-400 mt-1">Tüm kullanıcıları listeleyin ve rollere göre filtreleyin.</p>
                                </div>
                            </div>
                        </Link>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;