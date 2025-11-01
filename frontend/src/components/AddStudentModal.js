import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';

const AddStudentModal = ({ dersId, yoklamaId, mevcutOgrenciler, onStudentAdded, onClose }) => {
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (dersId) {
            setLoading(true);
            api.get(`/api/dersler/detay/${dersId}`)
                .then(response => {
                    setEnrolledStudents(response.data.kayitliOgrenciler || []);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Derse kayıtlı öğrenciler yüklenemedi.');
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [dersId]);

    const addableStudents = useMemo(() => {
        const mevcutOgrenciIds = new Set(mevcutOgrenciler.map(o => o.id));
        return enrolledStudents.filter(s => !mevcutOgrenciIds.has(s.id));
    }, [enrolledStudents, mevcutOgrenciler]);

    const handleAddStudent = (ogrenciId) => {
        api.post(`/api/yoklama/${yoklamaId}/ogrenciler`, { ogrenciId })
            .then(response => {
                onStudentAdded(response.data); // Pass the newly added student back
            })
            .catch(err => {
                setError(err.response?.data?.msg || 'Öğrenci eklenemedi.');
                console.error(err);
            });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg h-auto max-h-[70vh] flex flex-col">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">Yoklamaya Öğrenci Ekle</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-slate-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {loading && <p>Yükleniyor...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && addableStudents.length === 0 && <p>Eklenecek öğrenci bulunmuyor.</p>}
                    <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                        {addableStudents.map(student => (
                            <li key={student.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium dark:text-slate-200">{student.ad} {student.soyad}</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">{student.okulNumarasi}</p>
                                </div>
                                <button 
                                    onClick={() => handleAddStudent(student.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
                                    aria-label={`${student.ad} ${student.soyad} ekle`}
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AddStudentModal;
