
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';
import KullaniciDuzenleModal from './KullaniciDuzenleModal';
import KullaniciEkleModal from './KullaniciEkleModal'; // Import the new modal

const KullaniciYonetim = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    
    // State for modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            const params = filter === 'all' ? {} : { rol: filter };
            const response = await api.get('/api/users', { params });
            setUsers(response.data);
        } catch (err) {
            setError('Kullanıcılar yüklenemedi.');
        }
    }, [filter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEditClick = (user) => {
        setUserToEdit(user);
        setIsEditModalOpen(true);
    };

    const handleUserListChanged = () => {
        fetchUsers(); // Refresh the user list
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await api.delete(`/api/users/${userId}`);
                setUsers(users.filter(u => u.id !== userId));
            } catch (err) {
                setError('Kullanıcı silinirken bir hata oluştu.');
                console.error("Kullanıcı silme hatası:", err);
            }
        }
    };

    const FilterButton = ({ value, currentFilter, setFilter, children }) => {
        const isActive = value === currentFilter;
        const baseClasses = "py-2 px-4 rounded-lg font-medium transition-colors duration-200";
        const activeClasses = "bg-primary text-white shadow";
        const inactiveClasses = "bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600";
        
        return (
            <button onClick={() => setFilter(value)} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                {children}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
            <KullaniciDuzenleModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUserUpdated={handleUserListChanged}
                userToEdit={userToEdit}
            />
            <KullaniciEkleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUserAdded={handleUserListChanged}
            />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Link to="/admin/dashboard" className="flex items-center text-primary hover:underline">
                            <span className="material-symbols-outlined mr-1">arrow_back</span>
                            Admin Paneline Geri Dön
                        </Link>
                        <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                            <span className="material-symbols-outlined mr-2">add</span>
                            Yeni Kullanıcı Ekle
                        </button>
                    </div>

                    <div className="mb-6 flex justify-center items-center bg-gray-100 dark:bg-slate-800/50 p-2 rounded-xl shadow-inner space-x-2">
                        <FilterButton value="all" currentFilter={filter} setFilter={setFilter}>Tümü</FilterButton>
                        <FilterButton value="admin" currentFilter={filter} setFilter={setFilter}>Adminler</FilterButton>
                        <FilterButton value="ogretmen" currentFilter={filter} setFilter={setFilter}>Öğretmenler</FilterButton>
                        <FilterButton value="ogrenci" currentFilter={filter} setFilter={setFilter}>Öğrenciler</FilterButton>
                    </div>

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Ad Soyad</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">E-posta</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Rol</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Okul Numarası</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.ad} {user.soyad}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.rol === 'admin' ? 'bg-red-100 text-red-800' : user.rol === 'ogretmen' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{user.okulNumarasi || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleEditClick(user)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-md text-xs">Düzenle</button>
                                            <button onClick={() => handleDelete(user.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-xs">Sil</button>
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

export default KullaniciYonetim;
