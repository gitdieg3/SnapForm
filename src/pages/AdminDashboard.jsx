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
  Banknote,
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

  // --- STATE ANTREAN PENCAIRAN ---
  const [withdrawalsList, setWithdrawalsList] = useState([]);
  // STATE PENCARIAN PENGGUNA
  const [searchPengguna, setSearchPengguna] = useState('');
  const [filterRole, setFilterRole] = useState('semua');

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedUserForNotif, setSelectedUserForNotif] = useState(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [loadingNotif, setLoadingNotif] = useState(false);

  useEffect(() => {
    fetchSemuaData();
    fetchSystemSettings();
  }, []);

  // FUNGSI HAPUS PENGGUNA (CRUD - DELETE)
  const handleHapusPengguna = async (id, nama) => {
    const konfirmasi = window.confirm(`PERINGATAN! Yakin ingin memusnahkan akun ${nama} secara permanen dari sistem?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      toast.error("Gagal menghapus pengguna: " + error.message);
    } else {
      toast.success(`Akun ${nama} berhasil dihapus!`);
      fetchSemuaData(); // Refresh data tabel
    }
  };


  // State untuk menyimpan status saklar
  const [systemSettings, setSystemSettings] = useState({
    is_photobooth_active: false,
    is_cash_active: true,
    min_cash_withdrawal: 10000
  });

  // Fungsi untuk mengambil data setting dari Supabase
  const fetchSystemSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) setSystemSettings(data);
    if (error) console.error("Error fetching settings:", error);
  };

  // Fungsi untuk mengubah status saklar dan mengirimnya ke Supabase
  const handleToggleSetting = async (field, value) => {
    // Update UI duluan biar terasa responsif (Optimistic UI)
    const newSettings = { ...systemSettings, [field]: value };
    setSystemSettings(newSettings);

    const { error } = await supabase
      .from('system_settings')
      .update({ [field]: value })
      .eq('id', 1);

    if (error) {
      alert("Gagal mengubah pengaturan sistem!");
      fetchSystemSettings(); // Rollback UI kalau gagal
    }
  };

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

      // ⬇️ PASTE KODENYA TEPAT DI SINI ⬇️
      // TARIK DATA ANTREAN PENCAIRAN
      const { data: wd } = await supabase
        .from('cash_withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      if (wd) setWithdrawalsList(wd);
      // ⬆️ BATAS PASTE KODE ⬆️

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

  // FUNGSI KIRIM NOTIFIKASI KE SUPABASE
  const handleKirimNotif = async (e) => {
    e.preventDefault();
    if (!notifMessage.trim()) return toast.error("Pesan tidak boleh kosong!");

    setLoadingNotif(true);
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: selectedUserForNotif.id,
        pesan: notifMessage
      }]);

    if (error) {
      toast.error("Gagal mengirim notifikasi: " + error.message);
    } else {
      toast.success("Notifikasi terkirim ke " + selectedUserForNotif.nama_lengkap);
      setShowNotifModal(false);
      setNotifMessage(''); // Kosongkan form
    }
    setLoadingNotif(false);
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
      // INJEKSI AUTO-NOTIFIKASI
      await supabase.from('notifications').insert([{
        user_id: userId,
        pesan: `🎉 Selamat! Admin baru saja menambahkan +${tambah} Poin/Koin ke akunmu.`
      }]);

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

  // --- FITUR 5: PROSES PENCAIRAN (SUKSES) ---
  const handleSetujuiPencairan = async (id, hunterId, namaEmail) => {
    const konfirmasi = window.confirm(`Pastikan Anda SUDAH mentransfer uang ke ${namaEmail}. Yakin tandai sebagai Selesai?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('cash_withdrawals').update({ status: 'success' }).eq('id', id);
    if (error) {
      toast.error("Gagal mengupdate status: " + error.message);
    } else {
      // INJEKSI AUTO-NOTIFIKASI
      await supabase.from('notifications').insert([{
        user_id: hunterId,
        pesan: `💸 Hore! Penarikan dana SnapCash kamu telah berhasil ditransfer. Silakan cek saldo e-wallet kamu ya!`
      }]);

      toast.success("Pencairan berhasil diselesaikan!");
      fetchSemuaData();
    }
  };

  // --- FITUR 6: TOLAK PENCAIRAN & REFUND POIN ---
  const handleTolakPencairan = async (id, hunterId, jumlahRupiah) => {
    const konfirmasi = window.confirm(`Tolak pencairan ini dan KEMBALIKAN poin ke akun Hunter?`);
    if (!konfirmasi) return;

    const poinRefund = jumlahRupiah / 50; 

    // 1. Ubah status jadi ditolak
    const { error: errUpdate } = await supabase.from('cash_withdrawals').update({ status: 'rejected' }).eq('id', id);
    if (errUpdate) {
      toast.error("Gagal menolak tagihan.");
      return;
    }

    // 2. Ambil poin Hunter saat ini, lalu tambahkan dengan poin refund
    const { data: profile } = await supabase.from('profiles').select('total_poin').eq('id', hunterId).single();
    const currentPoin = profile?.total_poin || 0;

    await supabase.from('profiles').update({ total_poin: currentPoin + poinRefund }).eq('id', hunterId);

    // INJEKSI AUTO-NOTIFIKASI
    await supabase.from('notifications').insert([{
      user_id: hunterId,
      pesan: `❌ Maaf, penarikan dana SnapCash ditolak. Saldo sebesar ${poinRefund} Pts telah dikembalikan ke dompetmu.`
    }]);

    toast.success(`Pencairan ditolak. ${poinRefund} Poin telah di-refund ke akun Hunter.`);
    fetchSemuaData();
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
            {/* TAMBAHAN MENU LOKET PENCAIRAN */}
            <button onClick={() => setActiveTab('withdrawals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'withdrawals' ? 'bg-green-500 text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Banknote size={20} /> Loket Pencairan
            </button>

            {/* TAMBAHAN MENU MASTER KAMPUS */}
            <button onClick={() => setActiveTab('kampus')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'kampus' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Building2 size={20} /> Master Kampus
            </button>
          </div>


          {/* PANEL KENDALI SISTEM */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-200">


            <div className="flex flex-col gap-4">
              {/* Saklar Photobooth */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800">🎟️ Akses Photobooth</p>
                  <p className="text-sm text-gray-500">Aktifkan untuk penukaran tiket sesi foto gratis.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={systemSettings.is_photobooth_active}
                    onChange={(e) => handleToggleSetting('is_photobooth_active', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Saklar Uang Tunai (SnapCash) */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800">💰 Dompet SnapCash</p>
                  <p className="text-sm text-gray-500">Aktifkan untuk fitur tarik tunai (Rp 10.000).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={systemSettings.is_cash_active}
                    onChange={(e) => handleToggleSetting('is_cash_active', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
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

        {/* --- TAB 4: DATABASE PENGGUNA & KLIEN (UPGRADE) --- */}
        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold mb-2">Manajemen Pengguna & Klien</h2>
            <p className="text-gray-500 mb-6">Kelola akun, hapus data (CRUD), atau berikan saldo gratis (Top-Up) 100 Poin untuk Klien baru.</p>

            {/* FITUR SEARCH BAR & FILTER DROPDOWN */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari nama atau universitas..."
                  value={searchPengguna}
                  onChange={(e) => setSearchPengguna(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none transition-colors shadow-sm"
                />
              </div>
              <div className="w-full sm:w-48 shrink-0 relative">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none transition-colors shadow-sm bg-white cursor-pointer font-bold text-gray-700"
                >
                  <option value="semua">Semua Role</option>
                  <option value="klien">Khusus Klien</option>
                  <option value="hunter">Khusus Hunter</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-6 font-bold">Informasi Akun</th>
                    <th className="p-6 font-bold">Universitas</th>
                    <th className="p-6 font-bold text-center">Saldo / Poin</th>
                    <th className="p-6 font-bold text-right">Tindakan Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList
                    .filter(u => {
                      // 1. Logika Filter Teks Pencarian
                      // 1. Logika Filter Teks Pencarian
                      const matchText = (u.nama_lengkap?.toLowerCase() || '').includes(searchPengguna.toLowerCase()) ||
                        (u.universitas?.toLowerCase() || '').includes(searchPengguna.toLowerCase()) ||
                        (u.email?.toLowerCase() || '').includes(searchPengguna.toLowerCase());

                      // 2. Logika Filter Dropdown Role (Klien = tidak punya data universitas)
                      const isKlien = !u.universitas;
                      const matchRole = filterRole === 'semua' ? true : filterRole === 'klien' ? isKlien : !isKlien;

                      return matchText && matchRole;
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center p-10 text-gray-400 italic">Data pengguna tidak ditemukan.</td>
                    </tr>
                  ) : (
                    usersList
                      .filter(u => {
                        const matchText = (u.nama_lengkap?.toLowerCase() || '').includes(searchPengguna.toLowerCase()) ||
                          (u.universitas?.toLowerCase() || '').includes(searchPengguna.toLowerCase());
                        const isKlien = !u.universitas;
                        const matchRole = filterRole === 'semua' ? true : filterRole === 'klien' ? isKlien : !isKlien;
                        return matchText && matchRole;
                      })
                      .map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                              {/* Baris Atas: Nama & Badge Role */}
                              <p className="font-bold text-gray-800 flex items-center gap-2">
                                {u.nama_lengkap || 'Tanpa Nama'}
                                {!u.universitas ? (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase font-black tracking-wider">Klien</span>
                                ) : (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md uppercase font-black tracking-wider">Hunter</span>
                                )}
                              </p>

                              {/* Baris Bawah: Email */}
                              <p className="text-xs text-gray-400 font-medium tracking-wide">
                                {u.email || 'Email tidak tersedia'}
                              </p>
                            </div>
                          </td>
                          <td className="p-6 text-sm text-gray-600 font-semibold">{u.universitas || '-'}</td>
                          <td className="p-6 text-center">
                            <span className={`font-mono font-black text-lg ${!u.universitas ? 'text-blue-600' : 'text-amber-600'}`}>
                              {u.total_poin || 0}
                            </span>
                            <span className="text-xs text-gray-400 ml-1 font-bold">{!u.universitas ? 'Koin' : 'Pts'}</span>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUserForNotif(u); // 'item' ini variabel user di map tabel lu
                                  setShowNotifModal(true);
                                }}
                                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors font-bold text-xs"
                                title="Kirim Notifikasi"
                              >
                                🔔 Notif
                              </button>
                              <button
                                onClick={() => handleTambahPoin(u.id, u.total_poin || 0, u.nama_lengkap)}
                                className="px-4 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-xl hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 shadow-sm"
                                title="Berikan Saldo Gratis / Tambah Poin"
                              >
                                <PlusCircle size={16} /> Top-Up
                              </button>
                              <button
                                onClick={() => handleHapusPengguna(u.id, u.nama_lengkap)}
                                className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                                title="Musnahkan Akun Ini"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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

        {/* --- TAB 6: LOKET PENCAIRAN (SNAPCASH) --- */}
        {activeTab === 'withdrawals' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              💸 Antrean Transfer SnapCash
            </h2>
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-6 font-bold">Tanggal & User</th>
                    <th className="p-6 font-bold">Tujuan Transfer</th>
                    <th className="p-6 font-bold">Nominal</th>
                    <th className="p-6 font-bold text-center">Status</th>
                    <th className="p-6 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawalsList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-10 text-gray-400 italic">Belum ada permintaan pencairan dana.</td>
                    </tr>
                  ) : (
                    withdrawalsList.map(w => (
                      <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-6">
                          <p className="text-xs text-gray-400 mb-1">{new Date(w.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{w.hunter_email}</p>
                        </td>
                        <td className="p-6">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md mb-1 inline-block ${w.metode_pencairan === 'DANA' ? 'bg-blue-100 text-blue-700' : w.metode_pencairan === 'GoPay' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {w.metode_pencairan}
                          </span>
                          <p className="font-mono font-bold text-gray-800">{w.nomor_tujuan}</p>
                        </td>
                        <td className="p-6 font-black text-green-500 text-lg">
                          Rp {w.jumlah_rupiah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-6 text-center">
                          {w.status === 'pending' && <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-full border border-amber-200">Pending</span>}
                          {w.status === 'success' && <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full border border-green-200">Selesai</span>}
                          {w.status === 'rejected' && <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full border border-red-200">Ditolak</span>}
                        </td>
                        <td className="p-6 text-right">
                          {w.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleSetujuiPencairan(w.id, w.hunter_id, w.hunter_email)} className="p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-all" title="Tandai Sudah Ditransfer">
                                <CheckCircle2 size={20} />
                              </button>
                              <button onClick={() => handleTolakPencairan(w.id, w.hunter_id, w.jumlah_rupiah)} className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Tolak & Refund Poin">
                                <XCircle size={20} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">- Selesai -</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}


                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL KIRIM NOTIFIKASI */}
        {showNotifModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Kirim Notifikasi</h3>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold uppercase">
                  {selectedUserForNotif?.role || 'USER'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Pesan ini akan masuk ke aplikasi <strong>{selectedUserForNotif?.nama_lengkap}</strong>.
              </p>

              <form onSubmit={handleKirimNotif}>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors outline-none text-sm mb-4 resize-none"
                  rows="4"
                  placeholder="Contoh: Selamat! Pencairan dana Rp 10.000 sudah dikirim ke DANA kamu."
                  required
                ></textarea>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNotifModal(false)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loadingNotif}
                    className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {loadingNotif ? 'Mengirim...' : 'Kirim Pesan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



      </div>
    </div>
  );
}