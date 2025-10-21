
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        ad: '',
        soyad: '',
        email: '',
        password: '',
        okulNumarasi: '',
        rol: 'ogrenci' // Default role
    });
    const [password2, setPassword2] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const { ad, soyad, email, password, okulNumarasi, rol } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== password2) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        try {
            await axios.post('/api/auth/register', formData);
            setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError('Kayıt sırasında bir hata oluştu.');
            }
            console.error('Registration error:', err);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col justify-center items-center bg-background-light dark:bg-background-dark font-display py-10">
            <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <span className="material-symbols-outlined text-primary text-6xl">qr_code_scanner</span>
                    <h1 className="text-[#0d171b] dark:text-slate-50 tracking-light text-[32px] font-bold leading-tight px-4 text-center pb-3 pt-6">Hesap Oluştur</h1>
                </div>

                <form onSubmit={onSubmit} className="mt-8">
                    {/* Role Selector */}
                    <div className="px-4 py-3">
                        <p className="text-[#0d171b] dark:text-slate-50 text-base font-medium leading-normal pb-2">Hesap Türü</p>
                        <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#e7eff3] dark:bg-slate-800 p-1">
                            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-background-light dark:has-[:checked]:bg-background-dark has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-primary text-[#4c809a] dark:text-slate-400 text-sm font-medium leading-normal">
                                <span className="truncate">Öğrenci</span>
                                <input className="invisible w-0" name="rol" type="radio" value="ogrenci" checked={rol === 'ogrenci'} onChange={onChange} />
                            </label>
                            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-background-light dark:has-[:checked]:bg-background-dark has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-primary text-[#4c809a] dark:text-slate-400 text-sm font-medium leading-normal">
                                <span className="truncate">Öğretmen</span>
                                <input className="invisible w-0" name="rol" type="radio" value="ogretmen" checked={rol === 'ogretmen'} onChange={onChange} />
                            </label>
                             <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-background-light dark:has-[:checked]:bg-background-dark has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-primary text-[#4c809a] dark:text-slate-400 text-sm font-medium leading-normal">
                                <span className="truncate">Admin</span>
                                <input className="invisible w-0" name="rol" type="radio" value="admin" checked={rol === 'admin'} onChange={onChange} />
                            </label>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="px-4 py-3">
                        <label className="flex flex-col"><p className="text-[#0d171b] dark:text-slate-50 text-base font-medium pb-2">Ad</p><input className="form-input flex w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-14 p-[15px]" placeholder="Adınızı girin" type="text" name="ad" value={ad} onChange={onChange} required /></label>
                    </div>
                    <div className="px-4 py-3">
                        <label className="flex flex-col"><p className="text-[#0d171b] dark:text-slate-50 text-base font-medium pb-2">Soyad</p><input className="form-input flex w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-14 p-[15px]" placeholder="Soyadınızı girin" type="text" name="soyad" value={soyad} onChange={onChange} required /></label>
                    </div>
                    <div className="px-4 py-3">
                        <label className="flex flex-col"><p className="text-[#0d171b] dark:text-slate-50 text-base font-medium pb-2">E-posta Adresi</p><input className="form-input flex w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-14 p-[15px]" placeholder="E-posta adresinizi girin" type="email" name="email" value={email} onChange={onChange} required /></label>
                    </div>

                    {rol === 'ogrenci' && (
                        <div className="px-4 py-3">
                            <label className="flex flex-col"><p className="text-[#0d171b] dark:text-slate-50 text-base font-medium pb-2">Okul Numarası</p><input className="form-input flex w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-14 p-[15px]" placeholder="Okul numaranızı girin" type="text" name="okulNumarasi" value={okulNumarasi} onChange={onChange} /></label>
                        </div>
                    )}

                    <div className="px-4 py-3">
                        <label className="flex flex-col"><p className="text-[#0d171b] dark:text-slate-50 text-base font-medium pb-2">Şifre</p>
                            <div className="flex w-full items-stretch rounded-lg">
                                <input className="form-input flex w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-14 p-[15px] rounded-r-none border-r-0" placeholder="Şifrenizi girin" type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={onChange} required minLength="6" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#4c809a] dark:text-slate-400 flex border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </label>
                    </div>
                    <div className="px-4 py-3">
                        <label className="flex flex-col"><p className="text-[#0d171b] dark:text-slate-50 text-base font-medium pb-2">Şifre Tekrar</p><input className="form-input flex w-full rounded-lg text-[#0d171b] dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdfe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-14 p-[15px]" placeholder="Şifrenizi tekrar girin" type={showPassword ? 'text' : 'password'} value={password2} onChange={(e) => setPassword2(e.target.value)} required minLength="6" /></label>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-center py-2">{success}</p>}

                    <div className="flex px-4 py-3 mt-6">
                        <button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-5 bg-primary text-slate-50 text-base font-bold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <span className="truncate">Kayıt Ol</span>
                        </button>
                    </div>

                    <div className="text-center mt-4 px-4">
                        <Link className="text-sm text-primary hover:underline" to="/login">Zaten bir hesabınız var mı? Giriş Yapın</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
