import React, { useState, useEffect } from 'react';
import { ChevronRight, LayoutGrid, Search, CheckCircle2, LogOut, Check, Key, Calendar, Ticket, X, User, Phone, BookOpen, Building2, ShieldCheck } from 'lucide-react';
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

  // --- STATE PHOTOBOOTH ---
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [showModalVoucher, setShowModalVoucher] = useState(false);
  const [kodeVoucherAktif, setKodeVoucherAktif] = useState('');
  const [isPhotoboothActive, setIsPhotoboothActive] = useState(true);

  // --- STATE PROFIL & KYC (KNOW YOUR CUSTOMER) ---
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loadingProfil, setLoadingProfil] = useState(false);

  // STATE KAMPUS DROPDOWN
  const [kampusList, setKampusList] = useState([]);
  const [formProfil, setFormProfil] = useState({
    no_wa: '', nim: '', universitas: '', jurusan: ''
  });

  const namaHunter = user?.user_metadata?.nama_lengkap || 'Hunter';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Tarik daftar kampus dari Admin
    const { data: kmp } = await supabase.from('master_kampus').select('*').order('nama_kampus');
    if (kmp) setKampusList(kmp);

    // 1. Tarik data profil dan cek kelengkapan data
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
      // 2. LOGIKA RADAR EKSKLUSIF (Filter Target Kampus)
      // 2. LOGIKA RADAR EKSKLUSIF (Filter Target Kampus)
      const kuesionerTersedia = allCampaigns.filter(c => {
        const belumDikerjakan = !kuesionerSelesai.includes(c.id);
        const belumPenuh = (c.terisi || 0) < c.target_responden;

        // Fungsi bantu buat ngebersihin spasi dan jadiin huruf kecil semua
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
      .select(`created_at, campaigns (judul, reward_poin)`)
      .eq('hunter_id', user.id)
      .order('created_at', { ascending: false });

    if (riwayatData) setRiwayat(riwayatData);

    const { data: setting } = await supabase.from('platform_settings').select('is_active').eq('id', 'photobooth_status').maybeSingle();
    if (setting) setIsPhotoboothActive(setting.is_active);
  };

  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    setLoadingProfil(true);

    const { error } = await supabase.from('profiles').update({
      no_wa: formProfil.no_wa,
      nim: formProfil.nim,
      universitas: formProfil.universitas,
      jurusan: formProfil.jurusan
    }).eq('id', user.id);

    if (error) {
      toast.error("Gagal menyimpan profil: " + error.message);
    } else {
      toast.success("Profil berhasil diperbarui! Keamanan akun meningkat.");
      setIsProfileComplete(true);
      setShowProfileModal(false);
      fetchData(); // Refresh data supaya form eksklusif kampusnya langsung nongol
    }
    setLoadingProfil(false);
  };

  const handleMulaiKerjakan = (campaignId, linkForm) => {
    setFormAktif(campaignId);
    window.open(linkForm, '_blank');
  };

  const handleKlaimPoin = async (campaign) => {
    if (inputKodeValidasi !== campaign.kode_validasi) {
      toast.error("Kodenya salah bro! Cek lagi di akhir Google Form.");
      return;
    }
    setLoadingKlaim(true);

    const { error: errorSub } = await supabase.from('submissions').insert({
      campaign_id: campaign.id, hunter_id: user.id
    });

    if (errorSub) {
      toast.error("Gagal klaim: " + errorSub.message);
      setLoadingKlaim(false); return;
    }

    await supabase.from('profiles').update({ total_poin: poin + campaign.reward_poin }).eq('id', user.id);
    const currentTerisi = campaign.terisi || 0;
    await supabase.from('campaigns').update({ terisi: currentTerisi + 1 }).eq('id', campaign.id);

    toast.success(`Mantap! Kode Benar. Poin lu nambah +${campaign.reward_poin} 🚀`);
    setFormAktif(null); setInputKodeValidasi(''); setLoadingKlaim(false); fetchData();
  };

  const handleTukarPhotobooth = async () => {
    if (!isProfileComplete) {
      toast.error("Lengkapi data diri kamu dulu sebelum menukar tiket!");
      setShowProfileModal(true);
      return;
    }

    if (!isPhotoboothActive) {
      toast.error("Mesin sedang perbaikan, coba lagi nanti!");
      return;
    }
    if (poin < 50) return;

    const konfirmasi = window.confirm("Tukar 50 poin kamu dengan Tiket Photobooth sekarang?");
    if (!konfirmasi) return;

    setLoadingVoucher(true);

    const karakter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let kodeAcak = '';
    for (let i = 0; i < 6; i++) {
      kodeAcak += karakter.charAt(Math.floor(Math.random() * karakter.length));
    }
    const kodeFinal = `SNAP-${kodeAcak}`;

    const sisaPoin = poin - 50;
    const { error: errPoin } = await supabase.from('profiles').update({ total_poin: sisaPoin }).eq('id', user.id);

    if (errPoin) {
      toast.error("Waduh, gagal motong poin!");
      setLoadingVoucher(false); return;
    }

    const { error: errVoucher } = await supabase.from('vouchers').insert({
      hunter_id: user.id, kode_voucher: kodeFinal, status: 'aktif'
    });

    if (errVoucher) {
      toast.error("Gagal bikin tiket!");
      setLoadingVoucher(false); return;
    }

    setPoin(sisaPoin); setKodeVoucherAktif(kodeFinal); setShowModalVoucher(true); setLoadingVoucher(false);
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

            {/* FOTO PROFIL BISA DIKLIK BUAT BUKA MODAL */}
            <div
              onClick={() => setShowProfileModal(true)}
              className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm uppercase cursor-pointer hover:bg-amber-500 hover:text-black transition-colors relative"
              title="Lengkapi Profil Anda"
            >
              {namaHunter.charAt(0)}
              {/* Notif Titik Merah Kalau Profil Belum Lengkap */}
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

            {/* UI BOX PHOTOBOOTH */}
            <div className="mt-8 p-5 bg-[#111111] rounded-2xl text-white shadow-lg relative overflow-hidden">
              {!isProfileComplete && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                  <ShieldCheck className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs font-bold mb-3">Lengkapi profil untuk mengaktifkan fitur ini.</p>
                  <button onClick={() => setShowProfileModal(true)} className="text-[10px] bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400">Lengkapi Sekarang</button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold">Akses Photobooth</h4>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">Tukarkan 50 poin dengan 1 tiket sesi foto gratis.</p>

              <div className="w-full bg-gray-800 h-2.5 rounded-full mb-3 overflow-hidden">
                <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min((poin / 50) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-bold text-amber-400">{poin} / 50 Poin</span>
              </div>

              {!isPhotoboothActive ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-800 text-gray-400 font-bold text-sm cursor-not-allowed border border-gray-700">
                  Mesin Sedang Perbaikan 🛠️
                </button>
              ) : poin < 50 ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-800 text-gray-500 font-bold text-sm cursor-not-allowed">
                  Poin Belum Cukup
                </button>
              ) : (
                <button
                  onClick={handleTukarPhotobooth}
                  disabled={loadingVoucher}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-sm hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all"
                >
                  {loadingVoucher ? 'Memproses...' : 'Tukar 50 Poin'}
                </button>
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
                      <div key={item.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">Sisa Kuota: {sisaKuota}</span>
                          <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">+{item.reward_poin} Poin</span>
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
                      <span className="text-xs font-bold px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Selesai
                      </span>
                      <span className="text-sm font-bold text-gray-400">+{item.campaigns?.reward_poin} Poin</span>
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

      {/* --- POP-UP MODAL PROFIL & KYC (DENGAN DROPDOWN KAMPUS) --- */}
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

              {/* DROPDOWN KAMPUS ESTETIK */}
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

      {/* --- POP-UP MODAL TIKET DIGITAL --- */}
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

    </div>
  );
}