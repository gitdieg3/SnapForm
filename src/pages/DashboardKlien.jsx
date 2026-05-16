import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlusCircle, Link, FileText, Target, Coins, LogOut, Key, BarChart3, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardKlien({ user, setCurrentView }) {
  const [formData, setFormData] = useState({ judul: '', link: '', target: '', poin: '', kode: '' });
  const [loading, setLoading] = useState(false);
  
  // State baru untuk nyimpen data riwayat form Klien
  const [riwayat, setRiwayat] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(true);

  // Fungsi untuk narik data dari Supabase
  const fetchRiwayat = async () => {
    setLoadingRiwayat(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('klien_email', user.email)
      .order('id', { ascending: false }); // Urutkan dari yang terbaru

    if (!error && data) {
      setRiwayat(data);
    }
    setLoadingRiwayat(false);
  };

  // Otomatis jalanin fungsi tarik data pas halaman dibuka
  useEffect(() => {
    if (user?.email) {
      fetchRiwayat();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('campaigns')
      .insert([
        { 
          judul: formData.judul, 
          link_form: formData.link, 
          target_responden: parseInt(formData.target), 
          reward_poin: parseInt(formData.poin),
          kode_validasi: formData.kode,
          klien_email: user.email,
          terisi: 0 // <-- Kita set default 0 buat progress awal
        }
      ]);

    if (error) {
      alert("Gagal upload: " + error.message);
    } else {
      alert("Mantap! Kuesioner dan Kode Validasi berhasil disebar!");
      setFormData({ judul: '', link: '', target: '', poin: '', kode: '' });
      fetchRiwayat(); // Otomatis refresh daftar riwayat setelah upload berhasil!
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-[#111111] flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif cursor-pointer">
            SnapForm <span className="text-amber-600 text-xs font-bold font-sans px-2.5 py-1 bg-amber-50 rounded-lg ml-2 tracking-wide uppercase">Klien Area</span>
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" /> Keluar
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Header Sapaan */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Halo, {user?.user_metadata?.nama_lengkap || 'Pembuat Form'}! 🚀</h2>
          <p className="text-gray-500">Pantau dan sebarkan kuesioner Anda untuk mendapatkan responden dengan cepat.</p>
        </div>

        {/* Layout Grid: Kiri (Buat Form), Kanan (Riwayat) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI: FORM UPLOAD (Lebih Besar) */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-100/50 border border-gray-100 h-fit">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <PlusCircle className="text-blue-600 w-7 h-7 shrink-0" />
              <h3 className="text-2xl font-bold">Buat Campaign Baru</h3>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Judul Penelitian / Kuesioner</label>
                <div className="relative">
                  <FileText className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 shrink-0" />
                  <input type="text" value={formData.judul} onChange={(e) => setFormData({...formData, judul: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Link Google Form Anda</label>
                <div className="relative">
                  <Link className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 shrink-0" />
                  <input type="url" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none text-sm" required />
                </div>
                <p className="text-xs text-red-500 mt-2 font-medium">*Wajib tambahkan pesan konfirmasi di akhir Google Form berisi kode di bawah ini.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kode Validasi (Anti-Spam)</label>
                <div className="relative">
                  <Key className="absolute top-3.5 left-4 text-amber-500 w-5 h-5 shrink-0" />
                  <input type="text" value={formData.kode} onChange={(e) => setFormData({...formData, kode: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 transition-colors outline-none text-sm" placeholder="Misal: SKRIPSI-LULUS-123" required />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Target Responden</label>
                  <div className="relative">
                    <Target className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 shrink-0" />
                    <input type="number" min="1" value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none text-sm" required />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Reward Poin / Orang</label>
                  <div className="relative">
                    <Coins className="absolute top-3.5 left-4 text-amber-500 w-5 h-5 shrink-0" />
                    <input type="number" min="1" value={formData.poin} onChange={(e) => setFormData({...formData, poin: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none text-sm" required />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#111111] text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors mt-6">
                {loading ? 'Mengunggah Data...' : 'Sebarkan Kuesioner Sekarang'}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: RIWAYAT & PROGRESS */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-100/50 border border-gray-100 h-fit">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <BarChart3 className="text-emerald-600 w-6 h-6 shrink-0" />
              <h3 className="text-xl font-bold">Progress Campaign</h3>
            </div>

            {loadingRiwayat ? (
              <p className="text-center text-sm text-gray-400 py-8">Memuat data...</p>
            ) : riwayat.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500">Belum ada campaign yang dibuat.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                {riwayat.map((item, index) => {
                  const terisi = item.terisi || 0;
                  const target = item.target_responden || 1;
                  const persentase = Math.min(Math.round((terisi / target) * 100), 100);
                  const isSelesai = terisi >= target;

                  return (
                    <div key={index} className="p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-sm line-clamp-2 pr-4 leading-tight">{item.judul}</h4>
                        {isSelesai ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md shrink-0">
                            <CheckCircle2 w={12} h={12} /> Selesai
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-md shrink-0">
                            <Clock w={12} h={12} /> Aktif
                          </span>
                        )}
                      </div>

                      {/* Progress Bar UI */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold mb-1.5 text-gray-600">
                          <span>Progress</span>
                          <span>{terisi} / {target} Responden</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-1000 ${isSelesai ? 'bg-emerald-500' : 'bg-[#111111]'}`} 
                            style={{ width: `${persentase}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}