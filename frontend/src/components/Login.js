import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            const response = await axios.post('/api/auth/login', {
                email,
                password,
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (response.data.user.rol === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/ders-programi');
            }

        } catch (err) {
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            }
            console.error('Login error:', err);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col justify-center items-center bg-background-light dark:bg-background-dark font-display">
            <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <span className="material-symbols-outlined text-primary text-6xl">
                        qr_code_scanner
                    </span>
                    <h1 className="text-[#0d171b] dark:text-slate-50 tracking-light text-[32px] font-bold leading-tight px-4 text-center pb-3 pt-6">QR Kod ile Yoklama Sistemi</h1>
                </div>

                <form onSubmit={handleLogin} className="mt-8">
                    <div className="mt-6 px-4 py-3">
                        <label className="flex flex-col min-w-40 flex-1">
                            <p className="text-[#0d171b] dark:text-slate-50 text-base font-medium leading-normal pb-2">E-posta Adresi</p>
                            <input 
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-14 placeholder:text-[#4c809a] dark:placeholder:text-slate-500 p-[15px] text-base font-normal leading-normal"
                                placeholder="E-posta adresinizi girin" 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <div className="px-4 py-3">
                        <label className="flex flex-col min-w-40 flex-1">
                            <p className="text-[#0d171b] dark:text-slate-50 text-base font-medium leading-normal pb-2">Şifre</p>
                            <div className="flex w-full flex-1 items-stretch rounded-lg">
                                <input 
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-14 placeholder:text-[#4c809a] dark:placeholder:text-slate-500 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                                    placeholder="Şifrenizi girin" 
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    type="button"
                                    aria-label="Toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-[#4c809a] dark:text-slate-400 flex border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                                    <span className="material-symbols-outlined">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </label>
                    </div>

                    {error && (
                        <div className="px-4 py-1 text-center">
                            <p className="text-red-500 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex px-4 py-3 mt-6">
                        <button type="submit" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-primary text-slate-50 text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:ring-offset-background-dark">
                            <span className="truncate">Giriş Yap</span>
                        </button>
                    </div>

                     <p style={{ textAlign: 'center', marginTop: '15px' }}>
                        Hesabınız yok mu? <Link className="text-sm text-primary hover:underline" to="/register">Kayıt Olun</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;