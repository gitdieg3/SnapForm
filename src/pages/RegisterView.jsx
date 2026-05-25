import React, { useState } from 'react';
import { User, Lock, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function RegisterView({ setCurrentView, onLoginSuccess, defaultIsLogin = false }) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [role, setRole] = useState('hunter');
  const [formData, setFormData] = useState({ nama: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // --- LOGIKA MASUK (LOGIN) ---
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error("Gagal masuk: Email atau password salah."); 
      } else {
        toast.success("Selamat datang kembali!"); 
        onLoginSuccess(data.user);
      }

    } else {
      // --- LOGIKA DAFTAR (REGISTER) ---
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nama_lengkap: formData.nama,
            role_user: role
          }
        }
      });

      if (error) {
        toast.error("Gagal daftar: " + error.message); 
      } else {
        toast.success("Berhasil! Silakan masuk dengan akun barumu."); 
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 font-sans text-[#111111]">
      <div className="w-full max-w-[1000px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* --- KOLOM KIRI (Dark Mode) --- */}
        <div className="w-full md:w-[45%] bg-[#111111] text-white p-12 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight cursor-pointer" onClick={() => setCurrentView('landing')}>
              SnapForm.
            </h1>
            <p className="text-gray-400 mt-3 text-sm">Gabung komunitas periset terbesar.</p>
          </div>

          <div className="mt-12 mb-8">
            <h3 className="text-xl font-bold mb-6 leading-snug">Satu akun untuk semua akses:</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-0.5">
                  <CheckCircle2 className="text-green-500" size={18} />
                </div>
                Sebar kuesioner super cepat
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-0.5">
                  <CheckCircle2 className="text-green-500" size={18} />
                </div>
                Isi kuesioner dapat poin
              </li>
            </ul>
          </div>
        </div>

        {/* --- KOLOM KANAN (Formulir) --- */}
        <div className="w-full md:w-[55%] p-10 md:p-14 bg-white flex flex-col justify-center relative">

          {/* Tombol Kembali (Absolute di Kanan Atas) */}
          <button
            onClick={() => setCurrentView('landing')}
            className="absolute top-8 right-8 text-gray-400 hover:text-black flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </button>

          <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
          <p className="text-gray-500 text-sm mb-8">{isLogin ? 'Masukkan email dan password Anda.' : 'Pilih tipe akun Anda untuk mulai.'}</p>

          {/* Toggle Role (Hunter / Klien) */}
          {!isLogin && (
            <div className="flex gap-2 mb-8 p-1.5 bg-gray-100 rounded-xl">
              <button
                onClick={() => setRole('hunter')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${role === 'hunter' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Saya Pengisi (Hunter)
              </button>
              <button
                onClick={() => setRole('klien')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${role === 'klien' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Saya Pembuat Form
              </button>
            </div>
          )}

          {/* Form Input */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative">
                <User className="absolute top-3.5 left-4 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-gray-400 text-sm"
                  placeholder="Nama Lengkap"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute top-3.5 left-4 text-gray-400" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 outline-none focus:border-gray-400 focus:bg-white text-sm transition-colors"
                placeholder="Email Kampus / Pribadi"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute top-3.5 left-4 text-gray-400" size={18} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 outline-none focus:border-gray-400 focus:bg-white text-sm transition-colors tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111111] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors mt-6"
            >
              {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Buat Akun')}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-8 cursor-pointer hover:text-black font-semibold" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
          </p>
        </div>
      </div>
    </div>
  );
}