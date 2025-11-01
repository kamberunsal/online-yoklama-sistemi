import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import YoklamaKayitlariModal from './YoklamaKayitlariModal'; // Yeni modal bileşeni

const transformDerslerToEvents = (dersler) => {
    if (!Array.isArray(dersler)) return [];
    const dayMap = { 'Pazartesi': 1, 'Salı': 2, 'Çarşamba': 3, 'Perşembe': 4, 'Cuma': 5 };

    return dersler.map(ders => {
        const dayNumber = dayMap[ders.gun];
        if (dayNumber === undefined) return null;

        return {
            id: ders.id,
            title: `${ders.dersAdi} (${ders.sinif})`,
            startTime: ders.baslangicSaati,
            endTime: ders.bitisSaati,
            daysOfWeek: [dayNumber],
            extendedProps: {
                ...ders
            }
        };
    }).filter(Boolean);
};

const DersProgrami = () => {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
    const [selectedDers, setSelectedDers] = useState(null); // Seçilen ders state
    const navigate = useNavigate();

    const fetchDersler = useCallback(async (userId) => {
        if (userId) {
            try {
                const response = await api.get(`/api/dersler/${userId}`);
                const transformedEvents = transformDerslerToEvents(response.data);
                setEvents(transformedEvents);
            } catch (err) {
                setError('Dersler yüklenemedi.');
                console.error(err);
            }
        }
    }, []);

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser) {
            navigate('/login');
            return;
        }
        setUser(loggedInUser);
        fetchDersler(loggedInUser.id);
    }, [navigate, fetchDersler]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second

        return () => clearInterval(timer); // Cleanup on component unmount
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleEventClick = (clickInfo) => {
        const now = new Date();
        const eventStartTime = clickInfo.event.start;
        const eventEndTime = clickInfo.event.end;

        if (user.rol === 'ogretmen') {
            // Eğer ders şu an aktif ise yoklama ekranına git
            if (now >= eventStartTime && now <= eventEndTime) {
                navigate(`/yoklama/${clickInfo.event.id}`);
            } else {
                // Değilse, geçmiş yoklama kayıtları modalını aç
                setSelectedDers(clickInfo.event.extendedProps);
                setIsModalOpen(true);
            }
        } else { // Öğrenci ise QR okutma ekranına git
            navigate('/qr-okut');
        }
    };

    const processedEvents = useMemo(() => {
        const today = currentTime.getDay(); // Sunday: 0, Monday: 1, etc.
        const now = currentTime.getHours() * 60 + currentTime.getMinutes();

        return events.map(event => {
            const isToday = event.daysOfWeek.includes(today);
            if (!isToday) return event;

            const [startHour, startMinute] = event.startTime.split(':').map(Number);
            const [endHour, endMinute] = event.endTime.split(':').map(Number);
            const startTimeInMinutes = startHour * 60 + startMinute;
            const endTimeInMinutes = endHour * 60 + endMinute;

            if (now >= startTimeInMinutes && now < endTimeInMinutes) {
                return {
                    ...event,
                    backgroundColor: '#28a745', // Green for active class
                    borderColor: '#28a745'
                };
            }
            return event;
        });
    }, [events, currentTime]);

    if (error) {
        return <div className="min-h-screen bg-background-light dark:bg-background-dark flex justify-center items-center text-red-500">{error}</div>;
    }

    if (!user) {
        return <div className="min-h-screen bg-background-light dark:bg-background-dark flex justify-center items-center">Yükleniyor...</div>;
    }

    return (
        <>
            <style>{`
                .fc .fc-button-primary {
                    background-color: #1193d4;
                    border-color: #1193d4;
                }
                .fc .fc-button-primary:hover {
                    background-color: #0f82b9;
                    border-color: #0f82b9;
                }
                .fc .fc-button-primary:active, .fc .fc-button-active {
                    background-color: #0d7ab5 !important;
                    border-color: #0d7ab5 !important;
                }
                .fc-event {
                    cursor: pointer;
                }
            `}</style>
            <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#0d171b] dark:text-slate-50">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-4">
                        <span className="material-symbols-outlined text-4xl text-primary">waving_hand</span>
                        <div>
                            <p className="text-md text-gray-500 dark:text-slate-400">Hoş geldiniz,</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-slate-200">{user.ad} {user.soyad}</p>
                            <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center space-x-2 mt-1">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                <span>{currentTime.toLocaleDateString('tr-TR')}</span>
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span>{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                        <span className="material-symbols-outlined mr-2">logout</span>
                        Çıkış Yap
                    </button>
                </header>
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
                        <FullCalendar
                            plugins={[timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            locale={trLocale}
                            events={processedEvents} // Use processed events with dynamic colors
                            eventClick={handleEventClick}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'timeGridWeek,timeGridDay'
                            }}
                            buttonText={{
                                today:    'Bugün',
                                week:     'Hafta',
                                day:      'Gün'
                            }}
                            allDaySlot={false}
                            slotMinTime="08:00:00"
                            slotMaxTime="20:00:00"
                            height="auto"
                            eventColor="#1193d4" // Default event color
                        />
                    </div>
                </main>

                {isModalOpen && (
                    <YoklamaKayitlariModal 
                        ders={selectedDers}
                        onClose={() => setIsModalOpen(false)} 
                    />
                )}
            </div>
        </>
    );
};

export default DersProgrami;