import React, { useState } from 'react';
import { User, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Auth({ setCurrentView, setSessionData }) {
  const [isLogin, setIsLogin] = useState(false); // Toggle antara Daftar dan Masuk
  const [role, setRole] = useState('hunter');
  const [formData, setFormData] = useState({ nama: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Fungsi Register & Login yang beneran nyambung ke Supabase!
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // LOGIC LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) alert("Gagal masuk: " + error.message);
      else {
        setSessionData(data.user);
        setCurrentView('beranda');
      }
    } else {
      // LOGIC DAFTAR (Termasuk nyimpan Nama & Role)
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

      if (error) alert("Gagal daftar: " + error.message);
      else {
        alert("Berhasil! Silakan cek email kamu untuk verifikasi.");
        setIsLogin(true); // Lempar ke halaman login
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Bagian Kiri (Info) */}
        <div className="w-full md:w-5/12 bg-[#111111] text-white p-12">
          <h1 className="text-3xl font-serif font-bold cursor-pointer" onClick={() => setCurrentView('landing')}>SnapForm.</h1>
          <p className="mt-4 text-gray-400">Satu akun untuk nyebar form dan kumpulkan poin.</p>
        </div>

        {/* Bagian Kanan (Form) */}
        <div className="w-full md:w-7/12 p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-8">{isLogin ? 'Selamat Datang Lagi' : 'Buat Akun Baru'}</h2>

          {/* Toggle Role (Hanya muncul saat Daftar) */}
          {!isLogin && (
            <div className="flex gap-4 mb-8 p-1 bg-gray-100 rounded-xl">
              <button onClick={() => setRole('hunter')} className={`flex-1 py-3 px-4 rounded-lg font-semibold ${role === 'hunter' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Hunter</button>
              <button onClick={() => setRole('klien')} className={`flex-1 py-3 px-4 rounded-lg font-semibold ${role === 'klien' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Pembuat Form</button>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative">
                <User className="absolute top-3 left-3 text-gray-400" size={18} />
                <input type="text" placeholder="Nama Lengkap" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200" required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute top-3 left-3 text-gray-400" size={18} />
              <input type="email" placeholder="Email Anda" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200" required />
            </div>
            <div className="relative">
              <Lock className="absolute top-3 left-3 text-gray-400" size={18} />
              <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200" required />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-[#111111] text-white py-4 rounded-xl font-bold">
              {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar Sekarang')}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500 cursor-pointer hover:text-black" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
          </p>
        </div>
      </div>
    </div>
  );
}