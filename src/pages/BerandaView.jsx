import React, { useState, useEffect } from 'react';
import { ChevronRight, LayoutGrid, Search, CheckCircle2, LogOut, Check, Key, Calendar, Ticket, X, User, Phone, BookOpen, Building2, ShieldCheck, Crown, Clock, XCircle, Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function BerandaView({ setCurrentView, user }) {
  const [menuAktif, setMenuAktif] = useState('beranda');
  const [riwayat, setRiwayat] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [poin, setPoin] = useState(0);
  const [loadingKlaim, setLoadingKlaim] = useState(false);
  const [formAktif, setFormAktif] = useState(null);
  const [inputKodeValidasi, setInputKodeValidasi] = useState('');
  const [inputBuktiNim, setInputBuktiNim] = useState('');

  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [showModalVoucher, setShowModalVoucher] = useState(false);
  const [kodeVoucherAktif, setKodeVoucherAktif] = useState('');
  const [isPhotoboothActive, setIsPhotoboothActive] = useState(true);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loadingProfil, setLoadingProfil] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeader, setLoadingLeader] = useState(false);

  const [kampusList, setKampusList] = useState([]);
  const [formProfil, setFormProfil] = useState({
    no_wa: '', nim: '', universitas: '', jurusan: ''
  });
  
  // ✅ DITAMBAHKAN poin_to_rupiah DEFAULT 50
  const [systemSettings, setSystemSettings] = useState({
    is_photobooth_active: false,
    is_cash_active: true,
    min_cash_withdrawal: 10000,
    poin_to_rupiah: 50 
  });

  const [showModalCash, setShowModalCash] = useState(false);
  const [loadingTarik, setLoadingTarik] = useState(false);
  const [formCash, setFormCash] = useState({
    metode: 'DANA',
    nomor: ''
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const namaHunter = user?.user_metadata?.nama_lengkap || 'Hunter';

  useEffect(() => {
    fetchData();
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) setSystemSettings(data);
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10); 

    if (data) {
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const handleOpenNotif = async () => {
    setShowNotifDropdown(!showNotifDropdown);

    if (!showNotifDropdown && unreadCount > 0) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(0); 
    }
  };

  const fetchData = async () => {
    const { data: kmp } = await supabase.from('master_kampus').select('*').order('nama_kampus');
    if (kmp) setKampusList(kmp);

    let userKampus = '';
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

    if (profile) {
      setPoin(profile.total_poin || 0);
      userKampus = profile.universitas || '';
      setFormProfil({
        no_wa: profile.no_wa || '',
        nim: profile.nim || '',
        universitas: userKampus,
        jurusan: profile.jurusan || ''
      });

      if (profile.no_wa && profile.nim && profile.universitas) {
        setIsProfileComplete(true);
      }
    }

    const { data: subs } = await supabase.from('submissions').select('campaign_id').eq('hunter_id', user.id);
    const kuesionerSelesai = subs ? subs.map(s => s.campaign_id) : [];

    const { data: allCampaigns } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });

    if (allCampaigns) {
      const kuesionerTersedia = allCampaigns.filter(c => {
        const belumDikerjakan = !kuesionerSelesai.includes(c.id);
        const belumPenuh = (c.terisi || 0) < c.target_responden;

        const bersihkanString = (str) => str ? str.toString().toLowerCase().replace(/\s+/g, '') : '';

        const targetKampus = bersihkanString(c.target_universitas || 'Semua Kampus');
        const kampusHunter = bersihkanString(userKampus);

        const cocokSamaKampus =
          targetKampus === 'semuakampus' ||
          targetKampus === kampusHunter;

        return belumDikerjakan && belumPenuh && cocokSamaKampus;
      });
      setCampaigns(kuesionerTersedia);
    }

    const { data: riwayatData } = await supabase
      .from('submissions')
      .select(`created_at, status, campaigns (judul, reward_poin)`)
      .eq('hunter_id', user.id)
      .order('created_at', { ascending: false });

    if (riwayatData) setRiwayat(riwayatData);

    const { data: setting } = await supabase.from('platform_settings').select('is_active').eq('id', 'photobooth_status').maybeSingle();
    if (setting) setIsPhotoboothActive(setting.is_active);
    
    setLoadingLeader(true);
    const { data: leaderData } = await supabase
      .from('profiles')
      .select('nama_lengkap, total_poin')
      .order('total_poin', { ascending: false })
      .limit(5);

    if (leaderData) setLeaderboard(leaderData);
    setLoadingLeader(false);
  };

  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    setLoadingProfil(true);

    const { data: cekNimBentro } = await supabase
      .from('profiles')
      .select('id')
      .eq('nim', formProfil.nim)
      .neq('id', user.id) 
      .maybeSingle();

    if (cekNimBentro) {
      toast.error("Gagal! NIM ini sudah terdaftar di akun lain. Dilarang menggunakan akun ganda.");
      setLoadingProfil(false);
      return; 
    }

    const { data: cekProfil } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    let errorSimpan;

    if (cekProfil) {
      const { error } = await supabase.from('profiles').update({
        no_wa: formProfil.no_wa,
        nim: formProfil.nim,
        universitas: formProfil.universitas,
        jurusan: formProfil.jurusan,
        email: user.email 
      }).eq('id', user.id);
      errorSimpan = error;
    } else {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        nama_lengkap: user?.user_metadata?.nama_lengkap || 'Hunter Baru',
        email: user.email, 
        total_poin: 0,
        no_wa: formProfil.no_wa,
        nim: formProfil.nim,
        universitas: formProfil.universitas,
        jurusan: formProfil.jurusan
      });
      errorSimpan = error;
    }

    if (errorSimpan) {
      toast.error("Gagal menyimpan profil: " + errorSimpan.message);
    } else {
      toast.success("Profil berhasil diamankan! Sistem siap menampung poin.");
      setIsProfileComplete(true);
      setShowProfileModal(false);
      fetchData(); 
    }
    setLoadingProfil(false);
  };

  const handleMulaiKerjakan = (campaignId, linkForm) => {
    setFormAktif(campaignId);
    setInputBuktiNim(formProfil.nim);
    window.open(linkForm, '_blank');
  };

  const handleKlaimPoin = async (campaign) => {
    if (inputKodeValidasi !== campaign.kode_validasi) {
      toast.error("Kodenya salah bro! Cek lagi di akhir Google Form.");
      return;
    }

    if (!inputBuktiNim) {
      toast.error("Wajib isi NIM sebagai bukti pengerjaan!");
      return;
    }
    
    if (inputBuktiNim !== formProfil.nim) {
      toast.error(`Akses Ditolak! NIM harus sesuai dengan profil terdaftar: ${formProfil.nim}`);
      return;
    }

    setLoadingKlaim(true);

    const { error: errorSub } = await supabase.from('submissions').insert({
      campaign_id: campaign.id,
      hunter_id: user.id,
      bukti_nim: inputBuktiNim
    });

    if (errorSub) {
      toast.error("Gagal mengirim bukti: " + errorSub.message);
      setLoadingKlaim(false);
      return;
    }

    toast.success(`Kuesioner terkirim! Menunggu verifikasi dari Klien ⏳`);
    setFormAktif(null);
    setInputKodeValidasi('');
    setInputBuktiNim(''); 
    setLoadingKlaim(false);
    fetchData();
  };

  const handleTukarPhotobooth = async () => {
    if (!isProfileComplete) {
      toast.error("Lengkapi data diri kamu dulu sebelum menukar tiket!");
      setShowProfileModal(true);
      return;
    }

    if (!systemSettings.is_photobooth_active) {
      toast.error("Mesin sedang perbaikan, coba lagi nanti!");
      return;
    }

    setLoadingVoucher(true);

    const karakter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let kodeAcak = '';
    for (let i = 0; i < 6; i++) {
      kodeAcak += karakter.charAt(Math.floor(Math.random() * karakter.length));
    }
    const kodeFinal = `SNAP-${kodeAcak}`;

    const { data: isBerhasil, error } = await supabase.rpc('tukar_tiket_photobooth', {
      p_hunter_id: user.id,
      p_kode_voucher: kodeFinal
    });

    if (error || !isBerhasil) {
      toast.error("Gagal menukar tiket. Pastikan poinmu cukup!");
      setLoadingVoucher(false);
      return;
    }

    setPoin(poin - 50);
    setKodeVoucherAktif(kodeFinal);
    setShowModalVoucher(true);
    setLoadingVoucher(false);

    toast.success("Tiket Photobooth berhasil dicetak!");
  };

  const handleTarikTunai = async (e) => {
    e.preventDefault();

    // ✅ RUMUS DIUBAH AGAR DINAMIS
    const nilaiKonversi = systemSettings.poin_to_rupiah || 50;
    const nominalRupiah = poin * nilaiKonversi;

    if (nominalRupiah < systemSettings.min_cash_withdrawal) {
      toast.error(`Saldo belum mencapai Rp ${systemSettings.min_cash_withdrawal.toLocaleString('id-ID')}`);
      return;
    }

    if (!formCash.nomor) {
      toast.error("Nomor tujuan wajib diisi!");
      return;
    }

    setLoadingTarik(true);

    const { error: errInsert } = await supabase.from('cash_withdrawals').insert({
      hunter_id: user.id,
      hunter_email: user.email,
      jumlah_rupiah: nominalRupiah,
      metode_pencairan: formCash.metode,
      nomor_tujuan: formCash.nomor,
      status: 'pending'
    });

    if (errInsert) {
      toast.error("Gagal mengajukan pencairan: " + errInsert.message);
      setLoadingTarik(false);
      return;
    }

    const { error: errUpdate } = await supabase
      .from('profiles')
      .update({ total_poin: 0 })
      .eq('id', user.id);

    if (errUpdate) {
      toast.error("Gagal memotong poin, hubungi Admin.");
    } else {
      setPoin(0);
      setShowModalCash(false);
      setFormCash({ metode: 'DANA', nomor: '' }); 
      toast.success("Pengajuan berhasil! Dana akan ditransfer oleh Admin 1x24 Jam.");
    }

    setLoadingTarik(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
    toast.success("Berhasil keluar.");
  };

  const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-[#111111] flex flex-col relative">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif cursor-pointer" onClick={() => setCurrentView('landing')}>SnapForm.</h1>
          <div className="flex items-center gap-6">
            <div className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-bold text-sm shadow-sm border border-amber-200">
              {poin} Poin
            </div>

            <div className="relative">
              <button
                onClick={handleOpenNotif}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Notifikasi</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">
                        Belum ada pesan dari Admin.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border-b border-gray-50 text-sm ${notif.is_read ? 'bg-white' : 'bg-blue-50/50'}`}>
                          <p className="text-gray-800">{notif.pesan}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5 font-semibold">
                            {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              onClick={() => setShowProfileModal(true)}
              className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm uppercase cursor-pointer hover:bg-amber-500 hover:text-black transition-colors relative"
              title="Lengkapi Profil Anda"
            >
              {namaHunter.charAt(0)}
              {!isProfileComplete && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
              )}
            </div>

            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex gap-8">
        <div className="w-64 hidden md:block">
          <div className="sticky top-24 space-y-2">
            <button onClick={() => setMenuAktif('beranda')} className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${menuAktif === 'beranda' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50'}`}>
              <LayoutGrid className="w-5 h-5 shrink-0" /> Beranda
            </button>
            <button onClick={() => setMenuAktif('riwayat')} className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${menuAktif === 'riwayat' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50'}`}>
              <CheckCircle2 className="w-5 h-5 shrink-0" /> Riwayat Saya
            </button>

            <div className="mt-8 p-5 bg-[#111111] rounded-2xl text-white shadow-lg relative overflow-hidden">
              {!isProfileComplete && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                  <ShieldCheck className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs font-bold mb-3">Lengkapi profil untuk mengaktifkan fitur hadiah.</p>
                  <button onClick={() => setShowProfileModal(true)} className="text-[10px] bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400">Lengkapi Sekarang</button>
                </div>
              )}

              {systemSettings.is_cash_active && (
                <div className={`pb-4 ${systemSettings.is_photobooth_active ? 'border-b border-gray-800 mb-5' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💰</span>
                    <h4 className="font-bold text-white">Dompet SnapCash</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">Tarik tunai uang jajan minimal Rp {systemSettings.min_cash_withdrawal.toLocaleString('id-ID')}.</p>

                  <div className="flex justify-between items-end mb-4 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Saldo Rupiah</p>
                      <p className="text-2xl font-black text-green-400">
                        {/* ✅ RUMUS DIUBAH MENGGUNAKAN VARIABEL DINAMIS */}
                        Rp {((poin || 0) * (systemSettings.poin_to_rupiah || 50)).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-amber-400">{poin || 0} Pts</p>
                  </div>

                  <button
                    onClick={() => {
                      setFormCash({ ...formCash, nomor: formProfil.no_wa });
                      setShowModalCash(true);
                    }}
                    disabled={((poin || 0) * (systemSettings.poin_to_rupiah || 50)) < systemSettings.min_cash_withdrawal}
                    className="w-full py-3 rounded-xl bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition-colors disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {((poin || 0) * (systemSettings.poin_to_rupiah || 50)) < systemSettings.min_cash_withdrawal ? 'Saldo Belum Mencukupi' : 'Tarik Uang Tunai'}
                  </button>
                </div>
              )}

              {systemSettings.is_photobooth_active && (
                <div className={systemSettings.is_cash_active ? 'pt-2' : ''}>
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-white">Akses Photobooth</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">Tukarkan 50 poin dengan 1 tiket sesi foto gratis.</p>

                  <div className="w-full bg-gray-800 h-2.5 rounded-full mb-3 overflow-hidden">
                    <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min((poin / 50) * 100, 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                    <span className="text-xs font-bold text-amber-400">{poin} / 50 Poin</span>
                  </div>

                  <button
                    onClick={handleTukarPhotobooth}
                    disabled={loadingVoucher || poin < 50}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-sm hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    {loadingVoucher ? 'Memproses...' : poin < 50 ? 'Poin Belum Cukup' : 'Tukar 50 Poin'}
                  </button>
                </div>
              )}

              {!systemSettings.is_cash_active && !systemSettings.is_photobooth_active && (
                <div className="text-center py-8">
                  <ShieldCheck className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-semibold">Sistem penukaran hadiah sedang dibekukan / dalam perbaikan.</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm">Top 5 Hunters</h4>
              </div>

              {loadingLeader ? (
                <p className="text-xs text-center text-gray-400">Memuat radar...</p>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-center text-gray-400">Belum ada data.</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((hunter, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-700 truncate max-w-[100px]" title={hunter.nama_lengkap || 'Anonymous'}>
                          {hunter.nama_lengkap || 'Anon'}
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-500 shrink-0">{hunter.total_poin || 0} Pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {menuAktif === 'beranda' ? `Halo, ${namaHunter}! 👋` : 'Riwayat Kuesioner 📜'}
            </h2>
            <p className="text-gray-500">
              {menuAktif === 'beranda'
                ? `Ada ${campaigns.length} kuesioner rilis menunggu untuk diisi.`
                : `Kamu sudah berhasil mengumpulkan koin dari ${riwayat.length} kuesioner.`}
            </p>
          </div>

          {menuAktif === 'beranda' ? (
            <>
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Cari topik kuesioner..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-sm outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.length === 0 ? (
                  <p className="text-gray-400 italic">Kamu sudah menyelesaikan semua kuesioner yang tersedia!</p>
                ) : (
                  campaigns.map((item) => {
                    const sisaKuota = item.target_responden - (item.terisi || 0);
                    return (
                      <div key={item.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col hover:border-amber-200 transition-colors">
                        <div className="flex flex-col gap-3 mb-4">
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 w-fit ${item.target_universitas && item.target_universitas !== 'Semua Kampus' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                              <Building2 size={12} /> {item.target_universitas || 'Semua Kampus'}
                            </span>

                            <span className="text-sm font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
                              +{item.reward_poin} Pts
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-500 w-fit bg-gray-50 px-2 py-1 rounded-md">
                            Sisa Kuota: {sisaKuota}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-6 leading-snug">{item.judul}</h3>

                        <div className="mt-auto space-y-3">
                          {formAktif !== item.id ? (
                            <button onClick={() => handleMulaiKerjakan(item.id, item.link_form)} className="w-full bg-[#111111] text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2">
                              Mulai Kerjakan <ChevronRight className="w-4 h-4 shrink-0" />
                            </button>
                          ) : (
                            <div className="space-y-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                              <p className="text-xs text-amber-800 text-center font-bold mb-1">Masukkan Kode Validasi dari Google Form</p>
                              <div className="relative">
                                <Key className="absolute top-2.5 left-3 text-amber-500 w-4 h-4 shrink-0" />
                                <input type="text" value={inputKodeValidasi} onChange={(e) => setInputKodeValidasi(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-amber-200 outline-none focus:border-amber-500 text-sm" placeholder="Ketik kode di sini..." />
                              </div>
                              <div className="relative mt-3">
                                <User className="absolute top-2.5 left-3 text-amber-500 w-4 h-4 shrink-0" />
                                <input
                                  type="text"
                                  value={inputBuktiNim}
                                  onChange={(e) => setInputBuktiNim(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-amber-200 outline-none focus:border-amber-500 text-sm"
                                  placeholder="Ketik NIM kamu sebagai bukti..."
                                />
                              </div>
                              <button onClick={() => handleKlaimPoin(item)} disabled={loadingKlaim || !inputKodeValidasi} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors flex justify-center items-center gap-2 shadow-md shadow-amber-200 disabled:opacity-50">
                                {loadingKlaim ? 'Memproses...' : <><Check className="w-5 h-5 shrink-0" /> Klaim {item.reward_poin} Poin Saya</>}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {riwayat.length === 0 ? (
                <p className="text-gray-400 italic">Belum ada riwayat kuesioner yang diselesaikan.</p>
              ) : (
                riwayat.map((item, index) => (
                  <div key={index} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      {item.status === 'pending' ? (
                        <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1 shadow-sm">
                          <Clock size={12} /> Menunggu ACC Klien
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="text-xs font-bold px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center gap-1 shadow-sm">
                          <XCircle size={12} /> Bukti Ditolak
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle2 size={12} /> Poin Masuk
                        </span>
                      )}

                      <span className={`text-sm font-bold ${item.status === 'rejected' ? 'text-gray-300 line-through' : 'text-amber-500'}`}>
                        +{item.campaigns?.reward_poin} Poin
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-6 text-gray-800 leading-snug">{item.campaigns?.judul}</h3>
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-400 font-medium">
                      <Calendar size={16} /> Diselesaikan pada {formatTanggal(item.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black bg-gray-100 p-2 rounded-full transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Lengkapi Profil</h2>
                <p className="text-xs text-gray-500">Data ini dibutuhkan untuk keamanan dan verifikasi tiket.</p>
              </div>
            </div>

            <form onSubmit={handleSimpanProfil} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">NIM / Nomor Induk Siswa <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute top-3 left-3 text-gray-400" size={16} />
                  <input type="text" value={formProfil.nim} onChange={(e) => setFormProfil({ ...formProfil, nim: e.target.value })} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-amber-500 bg-gray-50 focus:bg-white" placeholder="Contoh: 21010920..." required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nomor WhatsApp Aktif <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 text-gray-400" size={16} />
                  <input type="tel" value={formProfil.no_wa} onChange={(e) => setFormProfil({ ...formProfil, no_wa: e.target.value })} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-amber-500 bg-gray-50 focus:bg-white" placeholder="08123456..." required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Universitas Resmi <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute top-3 left-3 text-gray-400" size={16} />
                  <select
                    value={formProfil.universitas}
                    onChange={(e) => setFormProfil({ ...formProfil, universitas: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-amber-500 bg-gray-50 focus:bg-white appearance-none cursor-pointer font-bold"
                    required
                  >
                    <option value="" disabled>Pilih Kampus Kamu...</option>
                    {kampusList.map(k => (
                      <option key={k.id} value={k.nama_kampus}>{k.nama_kampus}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Fakultas & Jurusan</label>
                <div className="relative">
                  <BookOpen className="absolute top-3 left-3 text-gray-400" size={16} />
                  <input type="text" value={formProfil.jurusan} onChange={(e) => setFormProfil({ ...formProfil, jurusan: e.target.value })} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-amber-500 bg-gray-50 focus:bg-white" placeholder="Teknik Informatika..." />
                </div>
              </div>

              <button type="submit" disabled={loadingProfil} className="w-full mt-4 py-3.5 bg-[#111111] text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                {loadingProfil ? 'Menyimpan...' : 'Simpan & Amankan Akun'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showModalVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 relative flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModalVoucher(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black bg-gray-100 p-2 rounded-full transition-colors">
              <X size={18} />
            </button>

            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Penukaran Berhasil!</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Ini adalah Tiket Digital kamu. Tunjukkan QR Code di bawah ini kepada petugas kasir Photobooth.
            </p>

            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300 mb-6 w-full flex flex-col items-center justify-center relative">
              <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white rounded-full"></div>
              <div className="absolute -right-3 top-1/2 w-6 h-6 bg-white rounded-full"></div>

              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4">
                <QRCodeSVG value={kodeVoucherAktif} size={160} level="H" />
              </div>
              <p className="font-mono font-bold text-2xl tracking-widest text-[#111111]">{kodeVoucherAktif}</p>
            </div>

            <button onClick={() => setShowModalVoucher(false)} className="w-full py-4 bg-[#111111] text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/20">
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}

      {showModalCash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModalCash(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black bg-gray-100 p-2 rounded-full transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl">💸</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Cairkan Uang Jajan</h2>
                {/* ✅ UI MODAL JUGA DIUBAH PAKE KONVERSI DINAMIS */}
                <p className="text-xs text-gray-500">Saldo saat ini: <strong className="text-green-600">Rp {(poin * (systemSettings.poin_to_rupiah || 50)).toLocaleString('id-ID')}</strong></p>
              </div>
            </div>

            <form onSubmit={handleTarikTunai} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Pilih Dompet Digital <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={formCash.metode}
                    onChange={(e) => setFormCash({ ...formCash, metode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-500 bg-gray-50 focus:bg-white appearance-none cursor-pointer font-bold"
                    required
                  >
                    <option value="DANA">🔵 DANA</option>
                    <option value="GoPay">🟢 GoPay</option>
                    <option value="OVO">🟣 OVO</option>
                    <option value="ShopeePay">🟠 ShopeePay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nomor E-Wallet Tujuan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 text-gray-400" size={16} />
                  <input
                    type="tel"
                    value={formCash.nomor}
                    onChange={(e) => setFormCash({ ...formCash, nomor: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-500 bg-gray-50 focus:bg-white font-mono"
                    placeholder="Contoh: 081234567890"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Pastikan nomor sudah benar. Seluruh saldo Anda akan ditarik dan diproses dalam 1x24 Jam.</p>
              </div>

              <button type="submit" disabled={loadingTarik} className="w-full mt-4 py-3.5 bg-green-500 text-black text-sm font-bold rounded-xl hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20">
                {loadingTarik ? 'Memproses Pengajuan...' : 'Ajukan Penarikan Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}