import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlusCircle, Link, FileText, Target, Coins, LogOut, Key } from 'lucide-react';

export default function DashboardKlien({ user, setCurrentView }) {
  const [formData, setFormData] = useState({ judul: '', link: '', target: '', poin: '', kode: '' });
  const [loading, setLoading] = useState(false);

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
          klien_email: user.email 
        }
      ]);

    if (error) {
      alert("Gagal upload: " + error.message);
    } else {
      alert("Mantap! Kuesioner dan Kode Validasi berhasil disebar!");
      setFormData({ judul: '', link: '', target: '', poin: '', kode: '' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-[#111111] flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif">SnapForm <span className="text-amber-600 text-sm font-sans px-2 py-1 bg-amber-50 rounded-lg ml-2">Klien Area</span></h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" /> Keluar
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Halo, {user?.user_metadata?.nama_lengkap || 'Pembuat Form'}! 🚀</h2>
          <p className="text-gray-500">Sebarkan kuesioner Anda dan dapatkan responden dengan cepat.</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-100 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <PlusCircle className="text-blue-600 w-7 h-7 shrink-0" />
            <h3 className="text-2xl font-bold">Buat Campaign Baru</h3>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Judul Penelitian / Kuesioner</label>
              <div className="relative">
                <FileText className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 shrink-0" />
                <input type="text" value={formData.judul} onChange={(e) => setFormData({...formData, judul: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Link Google Form Anda</label>
              <div className="relative">
                <Link className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 shrink-0" />
                <input type="url" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none" required />
              </div>
              <p className="text-xs text-red-500 mt-2 font-medium">*Wajib tambahkan pesan konfirmasi di akhir Google Form berisi kode di bawah ini.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kode Validasi (Anti-Spam)</label>
              <div className="relative">
                <Key className="absolute top-3.5 left-4 text-amber-500 w-5 h-5 shrink-0" />
                <input type="text" value={formData.kode} onChange={(e) => setFormData({...formData, kode: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 outline-none" placeholder="Misal: SKRIPSI-LULUS-123" required />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Target Responden</label>
                <div className="relative">
                  <Target className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 shrink-0" />
                  <input type="number" value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none" required />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Reward Poin per Orang</label>
                <div className="relative">
                  <Coins className="absolute top-3.5 left-4 text-amber-500 w-5 h-5 shrink-0" />
                  <input type="number" value={formData.poin} onChange={(e) => setFormData({...formData, poin: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none" required />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#111111] text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors mt-4">
              {loading ? 'Mengunggah Data...' : 'Sebarkan Kuesioner Sekarang'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}