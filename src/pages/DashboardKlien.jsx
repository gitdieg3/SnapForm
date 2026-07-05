import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlusCircle, Link, FileText, Target, Coins, LogOut, Key, BarChart3, CheckCircle2, Clock, Building2, ShieldCheck, Menu, X, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardKlien({ user, setCurrentView }) {
  const [formData, setFormData] = useState({ judul: '', link: '', target: '', poin: '', kode: '', target_universitas: '' });
  const [loading, setLoading] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(true);
  
  const [kampusList, setKampusList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [loadingAksi, setLoadingAksi] = useState(false);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchRiwayat = async () => {
    setLoadingRiwayat(true);
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('klien_email', user.email)
      .order('id', { ascending: false });

    if (!error && data) setRiwayat(data);

    const { data: pendingData } = await supabase
      .from('submissions')
      .select(`id, bukti_nim, created_at, hunter_id, campaign_id, campaigns!inner(judul, klien_email, reward_poin)`)
      .eq('campaigns.klien_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (pendingData) setPendingList(pendingData);

    const { data: kmp } = await supabase.from('master_kampus').select('*').order('nama_kampus');
    if (kmp) setKampusList(kmp);

    setLoadingRiwayat(false);
  };

  useEffect(() => {
    if (user?.email) {
      fetchRiwayat();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
    toast.success("Berhasil keluar.");
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
          target_universitas: formData.target_universitas || 'Semua Kampus',
          terisi: 0
        }
      ]);

    if (error) {
      toast.error("Gagal upload: " + error.message);
    } else {
      toast.success("Mantap! Kuesioner dan Kode Validasi berhasil disebar!");
      setFormData({ judul: '', link: '', target: '', poin: '', kode: '', target_universitas: '' });
      fetchRiwayat();
    }
    setLoading(false);
  };

  const handleTolak = async (submissionId) => {
    const konfirmasi = window.confirm("Yakin mau tolak bukti ini? Poin Hunter akan hangus.");
    if (!konfirmasi) return;
    
    setLoadingAksi(true);
    const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', submissionId);
    
    if (error) {
      toast.error("Gagal menolak: " + error.message);
    } else {
      toast.success("Berhasil ditolak! Target responden Anda aman.");
      fetchRiwayat(); 
    }
    setLoadingAksi(false);
  };

  const handleSetujuiSemua = async () => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin MENGUBAH STATUS ${pendingList.length} data menjadi DISETUJUI, serta mencairkan poin mereka?`);
    if (!konfirmasi) return;

    setLoadingAksi(true);
    
    try {
      const listIds = pendingList.map(item => item.id);
      const { error } = await supabase.rpc('approve_kuesioner_massal', {
        p_submission_ids: listIds
      });

      if (error) throw error;

      toast.success(`${pendingList.length} Responden berhasil disetujui! Poin telah dicairkan.`);
      fetchRiwayat(); 
    } catch (err) {
      toast.error("Terjadi kesalahan saat memproses persetujuan massal.");
      console.error(err);
    }
    setLoadingAksi(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-[#111111] flex flex-col">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold font-serif cursor-pointer flex items-center">
            SnapForm <span className="text-amber-600 text-[10px] sm:text-xs font-bold font-sans px-2 sm:px-2.5 py-1 bg-amber-50 rounded-lg ml-2 tracking-wide uppercase">Klien Area</span>
          </h1>
          
          <div className="hidden md:flex items-center">
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4 shrink-0" /> Keluar
            </button>
          </div>

          <button 
            className="md:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 absolute w-full shadow-lg">
            <button 
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }} 
              className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" /> Keluar
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Halo, {user?.user_metadata?.nama_lengkap || 'Pembuat Form'}! 🚀</h2>
          <p className="text-sm sm:text-base text-gray-500">Pantau dan sebarkan kuesioner Anda untuk mendapatkan responden dengan cepat.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-8">
          {/* FORM BUAT CAMPAIGN KIRI */}
          <div className="lg:col-span-7 bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <PlusCircle className="text-blue-600 w-5 h-5 shrink-0" />
              <h3 className="text-lg font-bold">Buat Campaign Baru</h3>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Penelitian / Kuesioner</label>
                <div className="relative">
                  <FileText className="absolute top-3 left-4 text-gray-400 w-4 h-4 shrink-0" />
                  <input type="text" value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Link Google Form Anda</label>
                <div className="relative">
                  <Link className="absolute top-3 left-4 text-gray-400 w-4 h-4 shrink-0" />
                  <input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Target Kampus (Opsional)</label>
                <div className="relative">
                  <Building2 className="absolute top-3 left-4 text-emerald-500 w-4 h-4 shrink-0 z-10" />
                  <select
                    value={formData.target_universitas}
                    onChange={(e) => setFormData({ ...formData, target_universitas: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-400 transition-colors outline-none text-sm appearance-none cursor-pointer font-semibold"
                  >
                    <option value="">🌎 Semua Kampus (Bebas)</option>
                    {kampusList.map(k => (
                      <option key={k.id} value={k.nama_kampus}>🎯 Khusus Mahasiswa {k.nama_kampus}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">*Pilih nama kampus agar form hanya muncul di beranda mahasiswa kampus tersebut.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kode Validasi (Anti-Spam)</label>
                <div className="relative">
                  <Key className="absolute top-3 left-4 text-amber-500 w-4 h-4 shrink-0" />
                  <input type="text" value={formData.kode} onChange={(e) => setFormData({ ...formData, kode: e.target.value })} className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 transition-colors outline-none text-sm" placeholder="Misal: SKRIPSI-LULUS-123" required />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Target Responden</label>
                  <div className="relative">
                    <Target className="absolute top-3 left-4 text-gray-400 w-4 h-4 shrink-0" />
                    <input type="number" min="1" value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })} className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none text-sm" required />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Reward Poin / Orang</label>
                  <div className="relative">
                    <Coins className="absolute top-3 left-4 text-amber-500 w-4 h-4 shrink-0 z-10" />
                    <select
                      value={formData.poin}
                      onChange={(e) => setFormData({ ...formData, poin: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 transition-colors outline-none text-sm appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>Pilih Reward Poin...</option>
                      <option value="5">5 Poin (tersedia)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#111111] text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors mt-4 shadow-md shadow-black/10 text-sm">
                {loading ? 'Mengunggah Data...' : 'Sebarkan Kuesioner Sekarang'}
              </button>
            </form>
          </div>

          {/* PROGRESS CAMPAIGN KANAN */}
          <div className="lg:col-span-5 bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <BarChart3 className="text-emerald-600 w-5 h-5 shrink-0" />
              <h3 className="text-lg font-bold">Progress Campaign</h3>
            </div>

            {loadingRiwayat ? (
              <p className="text-center text-sm text-gray-400 py-8">Memuat data...</p>
            ) : riwayat.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500">Belum ada campaign yang dibuat.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {riwayat.map((item, index) => {
                  const terisi = item.terisi || 0;
                  const target = item.target_responden || 1;
                  const persentase = Math.min(Math.round((terisi / target) * 100), 100);
                  const isSelesai = terisi >= target;

                  return (
                    <div key={index} className="p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <h4 className="font-bold text-sm line-clamp-2 pr-2 leading-tight">{item.judul}</h4>
                        {isSelesai ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md shrink-0">
                            <CheckCircle2 size={12} /> Selesai
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-md shrink-0">
                            <Clock size={12} /> Aktif
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-bold mb-1.5 text-gray-500 uppercase tracking-wide">
                          <span>Progress</span>
                          <span>{terisi} / {target} Responden</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full transition-all duration-1000 ${isSelesai ? 'bg-emerald-500' : 'bg-[#111111]'}`} style={{ width: `${persentase}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* --- SECTION TABEL VERIFIKASI (REDESIGNED) --- */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-0 shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section dari Tabel */}
          <div className="p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="text-amber-600 w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold text-gray-900">Antrean Verifikasi NIM</h3>
              </div>
              <p className="text-xs text-gray-500">Tinjau dan setujui bukti pengerjaan kuesioner dari responden.</p>
            </div>
            
            <button 
              onClick={handleSetujuiSemua} 
              disabled={pendingList.length === 0 || loadingAksi} 
              className="w-full sm:w-auto bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <CheckSquare size={16} /> 
              {loadingAksi ? 'Memproses...' : `Setujui Semua (${pendingList.length})`}
            </button>
          </div>

          {/* Data Tabel */}
          {pendingList.length === 0 ? (
             <div className="text-center py-12 bg-gray-50/50">
               <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                 <CheckCircle2 size={24} />
               </div>
               <p className="text-sm text-gray-500 font-medium">Yeay! Belum ada antrean responden untuk diverifikasi saat ini.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-bold w-1/2">Informasi Kuesioner</th>
                    <th className="px-6 py-4 font-bold text-center">Data Responden</th>
                    <th className="px-6 py-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {pendingList.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">{item.campaigns?.judul}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={10} /> Disubmit: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded border border-amber-200 text-sm shadow-sm">
                          {item.bukti_nim || 'Tidak ada NIM'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleTolak(item.id)} disabled={loadingAksi} className="text-red-600 hover:text-white bg-red-50 hover:bg-red-500 px-4 py-2 rounded-lg transition-all font-bold text-xs border border-red-100 hover:border-red-500 shadow-sm" title="Tolak Poin">
                          Tolak & Hanguskan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}