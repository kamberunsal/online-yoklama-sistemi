
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';

const DersDetay = () => {
    const [ders, setDers] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const { id } = useParams();

    const fetchDersDetails = useCallback(async () => {
        try {
            const response = await /api/dersler/detay/${id}`);
            setDers(response.data);
        } catch (err) {
            setError('Ders detayları yüklenemedi.');
        }
    }, [id]);

    const fetchAllStudents = useCallback(async () => {
        try {
            const response = await axios.get('/api/users?rol=ogrenci');
            setAllStudents(response.data);
        } catch (err) {
            console.error("Tüm öğrenciler yüklenemedi", err);
        }
    }, []);

    useEffect(() => {
        fetchDersDetails();
        fetchAllStudents();
    }, [fetchDersDetails, fetchAllStudents]);

    const handleAddStudent = async (ogrenciId) => {
        try {
            await api.post(`/api/dersler/${id}/ogrenciler`, { ogrenciId });
            fetchDersDetails(); // Refresh the list
        } catch (err) {
            alert('Öğrenci eklenirken bir hata oluştu.');
        }
    };

    const handleRemoveStudent = async (ogrenciId) => {
        if (window.confirm('Bu öğrenciyi dersten çıkarmak istediğinizden emin misiniz?')) {
            try {
                await axios.delete(`/api/dersler/${id}/ogrenciler/${ogrenciId}`);
                fetchDersDetails(); // Refresh the list
            } catch (err) {
                alert('Öğrenci çıkarılırken bir hata oluştu.');
            }
        }
    };

    if (error) return <p className="text-red-500 text-center p-8">{error}</p>;
    if (!ders) return <p className="text-center p-8">Yükleniyor...</p>;

    const enrolledStudentIds = new Set(ders.kayitliOgrenciler.map(s => s.id));
    const availableStudents = allStudents
        .filter(student => !enrolledStudentIds.has(student.id))
        .filter(student => 
            `${student.ad} ${student.soyad} ${student.okulNumarasi}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                            <Link to="/admin/dersler" className="flex items-center text-primary hover:underline mb-2">
                                <span className="material-symbols-outlined mr-1">arrow_back</span>
                                Ders Yönetimine Geri Dön
                            </Link>
                            <h1 className="text-3xl font-bold">{ders.dersAdi}</h1>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm mt-4 sm:mt-0">
                            <p><strong>Öğretmen:</strong> {ders.ogretmen.ad} {ders.ogretmen.soyad}</p>
                            <p><strong>Sınıf:</strong> {ders.sinif}</p>
                        </div>
                    </div>

                    {/* Student Management Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        
                        {/* Enrolled Students Column */}
                        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                            <h3 className="text-xl font-bold mb-4">Derse Kayıtlı Öğrenciler ({ders.kayitliOgrenciler.length})</h3>
                            <ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                                {ders.kayitliOgrenciler.length > 0 ? ders.kayitliOgrenciler.map(student => (
                                    <li key={student.id} className="flex justify-between items-center py-3 px-1 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-md">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-500 dark:text-slate-400">person</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary text-sm">{student.ad} {student.soyad}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400"><span className="font-semibold">No:</span> {student.okulNumarasi}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveStudent(student.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors">Kaldır</button>
                                    </li>
                                )) : <p className="text-gray-500 dark:text-slate-400 py-4 text-center">Bu derse kayıtlı öğrenci yok.</p>}
                            </ul>
                        </div>

                        {/* Add Students Column */}
                        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                            <h3 className="text-xl font-bold mb-4">Derse Öğrenci Ekle</h3>
                            <input 
                                type="text"
                                placeholder="Öğrenci ara (Ad, Soyad, No)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full mb-4 rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-12 p-3"
                            />
                            <ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-80 overflow-y-auto">
                                {availableStudents.length > 0 ? availableStudents.map(student => (
                                    <li key={student.id} className="flex justify-between items-center py-3 px-1 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-md">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-500 dark:text-slate-400">person</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{student.ad} {student.soyad}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400"><span className="font-semibold">No:</span> {student.okulNumarasi}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleAddStudent(student.id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors">Ekle</button>
                                    </li>
                                )) : <p className="text-gray-500 dark:text-slate-400 py-4 text-center">Eklenebilecek veya aramayla eşleşen öğrenci bulunamadı.</p>}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DersDetay;
