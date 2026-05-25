import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  ShieldAlert, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Search, 
  PlusCircle, 
  Trash2,
  Building2 // <-- Icon buat menu kampus
} from 'lucide-react';

export default function AdminDashboard({ setCurrentView, user }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // States untuk data statistik pusat
  const [stats, setStats] = useState({ users: 0, campaigns: 0, vouchers: 0 });
  const [usersList, setUsersList] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);
  
  // --- STATE KHUSUS MASTER KAMPUS ---
  const [kampusList, setKampusList] = useState([]);
  const [inputKampus, setInputKampus] = useState('');
  
  // State Saklar Kontrol Pembekuan Photobooth
  const [isPhotoboothActive, setIsPhotoboothActive] = useState(true);
  const [loadingSaklar, setLoadingSaklar] = useState(false);

  // State Fitur Kasir Photobooth
  const [inputVoucher, setInputVoucher] = useState('');
  const [voucherStatus, setVoucherStatus] = useState(null); 

  useEffect(() => {
    fetchSemuaData();
  }, []);

  const fetchSemuaData = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) setUsersList(profiles);

      const { data: camps } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (camps) setCampaignsList(camps);

      const { count: vouchCount } = await supabase.from('vouchers').select('*', { count: 'exact', head: true });

      // TARIK DATA MASTER KAMPUS
      const { data: kmp } = await supabase.from('master_kampus').select('*').order('nama_kampus');
      if (kmp) setKampusList(kmp);

      setStats({
        users: profiles?.length || 0,
        campaigns: camps?.length || 0,
        vouchers: vouchCount || 0
      });

      const { data: setting } = await supabase
        .from('platform_settings')
        .select('is_active')
        .eq('id', 'photobooth_status')
        .maybeSingle();
        
      if (setting) {
        setIsPhotoboothActive(setting.is_active);
      }
    } catch (err) {
      toast.error("Gagal menyinkronkan beberapa data komponen");
    }
  };

  // --- FUNGSI TAMBAH & HAPUS MASTER KAMPUS ---
  const handleAddKampus = async (e) => {
    e.preventDefault();
    if (!inputKampus.trim()) return;
    
    // Paksa jadi huruf besar semua di awal (misal: unp -> UNP)
    const namaKampusBaru = inputKampus.trim().toUpperCase();

    const { error } = await supabase.from('master_kampus').insert([{ nama_kampus: namaKampusBaru }]);
    
    if (error) {
      toast.error("Gagal tambah kampus. Mungkin nama sudah ada?");
    } else {
      toast.success(`${namaKampusBaru} berhasil ditambahkan ke database!`);
      setInputKampus('');
      fetchSemuaData(); 
    }
  };

  const handleDeleteKampus = async (id, nama) => {
    const konfirmasi = window.confirm(`Yakin ingin menghapus ${nama} dari daftar resmi?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('master_kampus').delete().eq('id', id);
    if (error) {
      toast.error("Gagal menghapus kampus.");
    } else {
      toast.success(`${nama} telah dihapus.`);
      fetchSemuaData();
    }
  };

  // --- FITUR 1: SAKLAR KONTROL PHOTOBOOTH (TOGGLE) ---
  const togglePhotobooth = async () => {
    if (loadingSaklar) return; 
    setLoadingSaklar(true);
    const statusBaru = !isPhotoboothActive;
    
    const { error } = await supabase
      .from('platform_settings')
      .update({ is_active: statusBaru })
      .eq('id', 'photobooth_status');
    
    if (error) {
      toast.error("Gagal mengubah status kontrol: " + error.message);
    } else {
      setIsPhotoboothActive(statusBaru);
      if (statusBaru) {
        toast.success("Sistem Photobooth berhasil DIAKTIFKAN!");
      } else {
        toast.error("Sistem Photobooth berhasil DIBEKUKAN! 🛠️");
      }
    }
    setLoadingSaklar(false);
  };

  // --- FITUR 2: VERIFIKASI KASIR PHOTOBOOTH ---
  const handleValidasiVoucher = async (e) => {
    e.preventDefault();
    if (!inputVoucher) return;

    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('kode_voucher', inputVoucher.trim())
      .maybeSingle();

    if (error) {
      toast.error("Terjadi masalah jaringan saat memverifikasi kode");
      return;
    }

    if (!data) {
      setVoucherStatus('invalid');
      toast.error("Tiket tidak valid atau salah ketik!");
      return;
    }

    if (data.status === 'terpakai') {
      setVoucherStatus('used');
      toast.error("Peringatan: Tiket ini sudah hangus!");
      return;
    }

    const { error: updateErr } = await supabase
      .from('vouchers')
      .update({ status: 'terpakai' })
      .eq('id', data.id);
      
    if (updateErr) {
      toast.error("Gagal merubah status klaim tiket");
    } else {
      setVoucherStatus('success');
      toast.success("Verifikasi Berhasil! Silakan cetak foto 🎉");
      fetchSemuaData();
    }
  };

  // --- FITUR 3: PEMBERIAN POIN MANUAL ADMIN ---
  const handleTambahPoin = async (userId, currentPoin, nama) => {
    const tambah = window.prompt(`Masukkan nominal akumulasi poin untuk menambahkan ke akun ${nama}:`, "10");
    if (tambah === null) return; 
    if (!tambah || isNaN(tambah) || parseInt(tambah) <= 0) {
      toast.error("Input nominal poin tidak valid!");
      return;
    }

    const poinBaru = currentPoin + parseInt(tambah);
    const { error } = await supabase.from('profiles').update({ total_poin: poinBaru }).eq('id', userId);
    
    if (error) {
      toast.error("Gagal memperbarui saldo poin: " + error.message);
    } else {
      toast.success(`Berhasil menambahkan +${tambah} poin untuk ${nama}!`);
      fetchSemuaData();
    }
  };

  // --- FITUR 4: MODERASI TAKE-DOWN CAMPAIGN ---
  const handleHapusCampaign = async (id, judul) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus campaign kuesioner "${judul}" secara permanen?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
      toast.error("Gagal memoderasi kuesioner: " + error.message);
    } else {
      toast.success("Kuesioner berhasil di-take down dari server!");
      fetchSemuaData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
    toast.success("Berhasil keluar dari Control Room");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-[#111111]">
      
      {/* SIDEBAR ADMIN (Desain Premium yang dipertahankan) */}
      <div className="w-64 bg-[#111111] text-white flex flex-col fixed h-full z-10 overflow-y-auto">
        <div className="p-6 border-b border-gray-800 shrink-0">
          <h1 className="text-2xl font-serif font-bold tracking-tight">SnapForm<span className="text-amber-500">.</span></h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-sans font-semibold">Control Room</p>
        </div>
        
        <div className="flex-1 py-6 px-4 flex flex-col gap-8">
          {/* Bagian Menu Navigasi */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-3">Menu Utama</p>
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
              <LayoutDashboard size={20} /> Statistik Pusat
            </button>
            <button onClick={() => setActiveTab('voucher')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'voucher' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Ticket size={20} /> Kasir Photobooth
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Users size={20} /> Data Pengguna
            </button>
            <button onClick={() => setActiveTab('campaigns')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'campaigns' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
              <ShieldAlert size={20} /> Moderasi Kuesioner
            </button>
            
            {/* TAMBAHAN MENU MASTER KAMPUS */}
            <button onClick={() => setActiveTab('kampus')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'kampus' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Building2 size={20} /> Master Kampus
            </button>
          </div>

          {/* Bagian Toggle Control (Saklar Pembekuan) */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-3">Control</p>
            <div className="bg-gray-800/50 p-4 rounded-xl flex items-center justify-between border border-gray-700/50">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Sistem Beku</span>
                <span className={`text-[10px] mt-0.5 font-bold ${isPhotoboothActive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPhotoboothActive ? 'Aman (Beroperasi)' : 'Dibekukan'}
                </span>
              </div>
              
              <button 
                onClick={togglePhotobooth}
                disabled={loadingSaklar}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out shrink-0 focus:outline-none ${!isPhotoboothActive ? 'bg-red-500' : 'bg-green-500'} ${loadingSaklar ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${!isPhotoboothActive ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-gray-800 transition-all font-semibold">
            <LogOut size={20} /> Keluar Admin
          </button>
        </div>
      </div>

      {/* CONTENT MONITORING AREA */}
      <div className="ml-64 flex-1 p-10">
        
        {/* --- TAB 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold mb-8">Selamat Datang, Tuan CEO! 👑</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Total Pengguna</p>
                <p className="text-5xl font-black">{stats.users}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Total Kuesioner</p>
                <p className="text-5xl font-black">{stats.campaigns}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-6 rounded-2xl shadow-md text-black transition-transform hover:-translate-y-1">
                <p className="font-bold text-sm uppercase tracking-wider mb-2">Tiket Photobooth Terbit</p>
                <p className="text-5xl font-black">{stats.vouchers}</p>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: MASTER KAMPUS (UI Premium) --- */}
        {activeTab === 'kampus' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold mb-6">Database Universitas Resmi</h2>
            
            {/* Form Tambah Kampus */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 max-w-3xl mb-8 flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={inputKampus} 
                onChange={(e) => setInputKampus(e.target.value)}
                placeholder="CONTOH: UNP" 
                className="flex-1 border-2 border-gray-200 rounded-xl px-6 py-4 outline-none focus:border-amber-500 font-bold uppercase transition-colors" 
                required
              />
              <button 
                onClick={handleAddKampus}
                className="bg-[#111111] text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 shrink-0"
              >
                Tambah Kampus
              </button>
            </div>
            
            {/* Tabel Daftar Kampus */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 max-w-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-6 font-bold">Nama Universitas</th>
                    <th className="p-6 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kampusList.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center p-10 text-gray-400 italic">Belum ada data kampus yang didaftarkan.</td>
                    </tr>
                  ) : (
                    kampusList.map(k => (
                      <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-6 font-bold text-lg text-gray-800">{k.nama_kampus}</td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleDeleteKampus(k.id, k.nama_kampus)}
                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-3 rounded-xl transition-colors"
                            title="Hapus Kampus"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: MANAGEMENT KASIR VOUCHER --- */}
        {activeTab === 'voucher' && (
          <div className="animate-in fade-in duration-300 max-w-2xl">
            <h2 className="text-3xl font-bold mb-2">Validasi Tiket Photobooth</h2>
            <p className="text-gray-500 mb-8">Ketik kode atau scan QR Code milik pengguna untuk memverifikasi keaslian voucher tiket.</p>
            
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <form onSubmit={handleValidasiVoucher} className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Contoh: SNAP-A1B2C3" 
                  value={inputVoucher}
                  onChange={(e) => { setInputVoucher(e.target.value.toUpperCase()); setVoucherStatus(null); }}
                  className="flex-1 text-2xl font-mono tracking-widest px-6 py-4 rounded-xl border-2 border-gray-200 outline-none focus:border-amber-500 transition-colors uppercase"
                  required
                />
                <button type="submit" className="bg-[#111111] text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                  Cek Voucher
                </button>
              </form>

              {voucherStatus === 'success' && (
                <div className="mt-6 bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <CheckCircle2 size={32} className="shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold">Voucher VALID! 🎉</h4>
                    <p className="text-sm">Tiket sukses dicairkan. Silakan berikan akses masuk ke bilik foto.</p>
                  </div>
                </div>
              )}
              {voucherStatus === 'used' && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <XCircle size={32} className="shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold">Akses Ditolak: Tiket Expired</h4>
                    <p className="text-sm">Voucher digital ini sudah pernah digunakan sebelumnya untuk berfoto.</p>
                  </div>
                </div>
              )}
              {voucherStatus === 'invalid' && (
                <div className="mt-6 bg-gray-100 border border-gray-300 text-gray-600 p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <Search size={32} className="shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold">Kode Tidak Dikenali</h4>
                    <p className="text-sm">Periksa kembali susunan karakter kode unik yang tertera pada layar.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 4: DATABASE PENGGUNA --- */}
        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold mb-6">Database Pengguna</h2>
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-6 font-bold">Nama Lengkap</th>
                    <th className="p-6 font-bold">Universitas</th>
                    <th className="p-6 font-bold">Tabungan Poin</th>
                    <th className="p-6 font-bold text-right">Tindakan Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center p-10 text-gray-400 italic">Belum ada user yang terdaftar di dalam database.</td>
                    </tr>
                  ) : (
                    usersList.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-6 font-bold text-gray-800">{u.nama_lengkap || 'Tanpa Nama'}</td>
                        <td className="p-6 text-sm text-gray-600 font-semibold">{u.universitas || '-'}</td>
                        <td className="p-6 font-mono font-bold text-amber-600 text-lg">{u.total_poin || 0} Pts</td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleTambahPoin(u.id, u.total_poin || 0, u.nama_lengkap)}
                            className="px-5 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-xl hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 ml-auto shadow-sm"
                          >
                            <PlusCircle size={16}/> Tambah Poin
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 5: MODERASI CAMPAIGN --- */}
        {activeTab === 'campaigns' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold mb-6">Moderasi Konten Kuesioner</h2>
            {campaignsList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200 max-w-md">
                <p className="text-gray-400 italic">Antrean platform kosong. Tidak ada kuesioner aktif.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaignsList.map(camp => (
                  <div key={camp.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md uppercase tracking-wider">ID: {camp.id}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-3 line-clamp-2 leading-snug">{camp.judul}</h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">Klien: {camp.klien_email}</p>
                    
                    <div className="mb-6">
                       <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100 font-bold">
                         🎯 Target: {camp.target_universitas || 'Semua Kampus'}
                       </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-600">{camp.terisi || 0}/{camp.target_responden} Terisi</span>
                      <button 
                        onClick={() => handleHapusCampaign(camp.id, camp.judul)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2.5 rounded-xl transition-colors"
                        title="Hapus Kuesioner Dari Aplikasi"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}