import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

// IMPORT ANAK KOMPONEN
import AdminSidebar from '../components/admin/AdminSidebar';
import TabOverview from '../components/admin/TabOverview';
import TabKampus from '../components/admin/TabKampus';
import TabVoucher from '../components/admin/TabVoucher';
import TabUsers from '../components/admin/TabUsers';
import TabCampaigns from '../components/admin/TabCampaigns';
import TabWithdrawals from '../components/admin/TabWithdrawals';

export default function AdminDashboard({ setCurrentView, user }) {
  const [activeTab, setActiveTab] = useState('overview');

  // States data statistik pusat
  const [stats, setStats] = useState({ users: 0, campaigns: 0, vouchers: 0 });
  const [usersList, setUsersList] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);

  // STATE MASTER KAMPUS
  const [kampusList, setKampusList] = useState([]);
  const [inputKampus, setInputKampus] = useState('');

  // State Saklar Kontrol Pembekuan Photobooth lama (Dipertahankan agar tidak break variabel)
  const [isPhotoboothActive, setIsPhotoboothActive] = useState(true);
  const [loadingSaklar, setLoadingSaklar] = useState(false);

  // State Fitur Kasir Photobooth
  const [inputVoucher, setInputVoucher] = useState('');
  const [voucherStatus, setVoucherStatus] = useState(null);

  // STATE ANTREAN PENCAIRAN
  const [withdrawalsList, setWithdrawalsList] = useState([]);
  
  // STATE PENCARIAN PENGGUNA
  const [searchPengguna, setSearchPengguna] = useState('');
  const [filterRole, setFilterRole] = useState('semua');

  // STATE MODAL NOTIFIKASI
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedUserForNotif, setSelectedUserForNotif] = useState(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [loadingNotif, setLoadingNotif] = useState(false);

  // State system settings saklar baru
  const [systemSettings, setSystemSettings] = useState({
    is_photobooth_active: false,
    is_cash_active: true,
    min_cash_withdrawal: 10000
  });

  useEffect(() => {
    fetchSemuaData();
    fetchSystemSettings();
  }, []);

  // FUNGSI HAPUS PENGGUNA (DIJAMIN ASLI 100%)
  const handleHapusPengguna = async (id, nama) => {
    const konfirmasi = window.confirm(`PERINGATAN! Yakin ingin memusnahkan akun ${nama} secara permanen dari sistem?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      toast.error("Gagal menghapus pengguna: " + error.message);
    } else {
      toast.success(`Akun ${nama} berhasil dihapus!`);
      fetchSemuaData();
    }
  };

  // FUNGSI FETCH SYSTEM SETTINGS (ASLI 100%)
  const fetchSystemSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) setSystemSettings(data);
    if (error) console.error("Error fetching settings:", error);
  };

  // FUNGSI TOGGLE SETTING SAKLAR (ASLI 100%)
  const handleToggleSetting = async (field, value) => {
    const newSettings = { ...systemSettings, [field]: value };
    setSystemSettings(newSettings);

    const { error } = await supabase
      .from('system_settings')
      .update({ [field]: value })
      .eq('id', 1);

    if (error) {
      alert("Gagal mengubah pengaturan sistem!");
      fetchSystemSettings();
    }
  };

  // FUNGSI FETCH DATA UTAMA (ASLI 100%)
  const fetchSemuaData = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) setUsersList(profiles);

      const { data: camps } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (camps) setCampaignsList(camps);

      const { count: vouchCount } = await supabase.from('vouchers').select('*', { count: 'exact', head: true });

      const { data: kmp } = await supabase.from('master_kampus').select('*').order('nama_kampus');
      if (kmp) setKampusList(kmp);

      const { data: wd } = await supabase
        .from('cash_withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      if (wd) setWithdrawalsList(wd);

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

  // FUNGSI TAMBAH KAMPUS (ASLI 100%)
  const handleAddKampus = async (e) => {
    e.preventDefault();
    if (!inputKampus.trim()) return;

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

  // FUNGSI HAPUS KAMPUS (ASLI 100%)
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

  // FUNGSI SAKLAR LAMA (TETAP DIJAGA AGAR TIDAK BREAK)
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

  // FUNGSI KIRIM NOTIFIKASI MANUAL (ASLI 100%)
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
      setNotifMessage('');
    }
    setLoadingNotif(false);
  };

  // FUNGSI KASIR VERIFIKASI VOUCHER (ASLI 100%)
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

  // FUNGSI TOP UP / TAMBAH POIN MANUAL + AUTO NOTIF (ASLI 100%)
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
      await supabase.from('notifications').insert([{
        user_id: userId,
        pesan: `🎉 Selamat! Admin baru saja menambahkan +${tambah} Poin/Koin ke akunmu.`
      }]);

      toast.success(`Berhasil menambahkan +${tambah} poin untuk ${nama}!`);
      fetchSemuaData();
    }
  };

  // FUNGSI TAKE DOWN CAMPAIGN (ASLI 100%)
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

  // FUNGSI ACC PENCAIRAN + AUTO NOTIF (ASLI 100%)
  const handleSetujuiPencairan = async (id, hunterId, namaEmail) => {
    const konfirmasi = window.confirm(`Pastikan Anda SUDAH mentransfer uang ke ${namaEmail}. Yakin tandai sebagai Selesai?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('cash_withdrawals').update({ status: 'success' }).eq('id', id);
    if (error) {
      toast.error("Gagal mengupdate status: " + error.message);
    } else {
      await supabase.from('notifications').insert([{
        user_id: hunterId,
        pesan: `💸 Hore! Penarikan dana SnapCash kamu telah berhasil ditransfer. Silakan cek saldo e-wallet kamu ya!`
      }]);

      toast.success("Pencairan berhasil diselesaikan!");
      fetchSemuaData();
    }
  };

  // FUNGSI TOLAK PENCAIRAN & REFUND + AUTO NOTIF (ASLI 100%)
  const handleTolakPencairan = async (id, hunterId, jumlahRupiah) => {
    const konfirmasi = window.confirm(`Tolak pencairan ini dan KEMBALIKAN poin ke akun Hunter?`);
    if (!konfirmasi) return;

    const poinRefund = jumlahRupiah / 50; 

    const { error: errUpdate } = await supabase.from('cash_withdrawals').update({ status: 'rejected' }).eq('id', id);
    if (errUpdate) {
      toast.error("Gagal menolak tagihan.");
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('total_poin').eq('id', hunterId).single();
    const currentPoin = profile?.total_poin || 0;

    await supabase.from('profiles').update({ total_poin: currentPoin + poinRefund }).eq('id', hunterId);

    await supabase.from('notifications').insert([{
      user_id: hunterId,
      pesan: `❌ Maaf, penarikan dana SnapCash ditolak. Saldo sebesar ${poinRefund} Pts telah dikembalikan ke dompetmu.`
    }]);

    toast.success(`Pencairan ditolak. ${poinRefund} Poin telah di-refund ke akun Hunter.`);
    fetchSemuaData();
  };

  // FUNGSI LOGOUT (ASLI 100%)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
    toast.success("Berhasil keluar dari Control Room");
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex font-sans text-gray-900">
      
      {/* SIDEBAR ADMIN */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
      
      {/* AREA MONITORING KONTEN UTAMA */}
      <div className="ml-32 flex-1 p-10 h-screen overflow-y-auto">
        
        {/* TOP BAR DESAIN MINIMALIS */}
        <div className="flex justify-end mb-10">
          <div className="bg-white px-6 py-2.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Admin Connected</span>
          </div>
        </div>

        {/* INTEGRASI KABEL DATA (PROPS) ANAK KOMPONEN */}
        {activeTab === 'overview' && (
          <TabOverview stats={stats} systemSettings={systemSettings} handleToggleSetting={handleToggleSetting} />
        )}
        
        {activeTab === 'kampus' && (
          <TabKampus kampusList={kampusList} inputKampus={inputKampus} setInputKampus={setInputKampus} handleAddKampus={handleAddKampus} handleDeleteKampus={handleDeleteKampus} />
        )}
        
        {activeTab === 'voucher' && (
        <TabVoucher 
            inputVoucher={inputVoucher} 
            setInputVoucher={setInputVoucher} 
            voucherStatus={voucherStatus} 
            setVoucherStatus={setVoucherStatus} 
            handleValidasiVoucher={handleValidasiVoucher} 
            vouchersData={campaignsList} // Opsional: Pastikan fetchSemuaData mengambil list dari tabel voucher ke state terpisah atau gunakan state penampung list voucher Anda
        />
        )}
        
        {activeTab === 'users' && (
          <TabUsers usersList={usersList} searchPengguna={searchPengguna} setSearchPengguna={setSearchPengguna} filterRole={filterRole} setFilterRole={setFilterRole} setSelectedUserForNotif={setSelectedUserForNotif} setShowNotifModal={setShowNotifModal} handleTambahPoin={handleTambahPoin} handleHabusPengguna={handleHapusPengguna} />
        )}
        
        {activeTab === 'campaigns' && (
          <TabCampaigns campaignsList={campaignsList} handleHapusCampaign={handleHapusCampaign} />
        )}
        
        {activeTab === 'withdrawals' && (
          <TabWithdrawals withdrawalsList={withdrawalsList} handleSetujuiPencairan={handleSetujuiPencairan} handleTolakPencairan={handleTolakPencairan} />
        )}
      </div>

      {/* MODAL KIRIM NOTIFIKASI MANUAL (ASLI 100%) */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Kirim Notifikasi</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-md font-black uppercase tracking-wider">
                {selectedUserForNotif?.universitas ? 'HUNTER' : 'KLIEN'}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Pesan ini akan masuk ke aplikasi <strong>{selectedUserForNotif?.nama_lengkap}</strong>.
            </p>

            <form onSubmit={handleKirimNotif}>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-yellow-400 transition-all outline-none text-sm mb-4 resize-none font-medium"
                rows="4"
                placeholder="Contoh: Selamat! Pencairan dana Rp 10.000 sudah dikirim ke DANA kamu."
                required
              ></textarea>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNotifModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingNotif}
                  className="px-5 py-2.5 text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-all disabled:opacity-50"
                >
                  {loadingNotif ? 'Mengirim...' : 'Kirim Pesan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}