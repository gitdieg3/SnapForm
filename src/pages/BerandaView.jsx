import React, { useState, useEffect } from 'react';
import { ChevronRight, LayoutGrid, Search, CheckCircle2, LogOut, Check, Key, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function BerandaView({ setCurrentView, user }) {
  // --- STATE BARU ---
  const [menuAktif, setMenuAktif] = useState('beranda'); // Ngatur menu kiri
  const [riwayat, setRiwayat] = useState([]); // Nyimpen data riwayat
  
  const [campaigns, setCampaigns] = useState([]);
  const [poin, setPoin] = useState(0);
  const [loadingKlaim, setLoadingKlaim] = useState(false);
  const [formAktif, setFormAktif] = useState(null); 
  const [inputKodeValidasi, setInputKodeValidasi] = useState('');

  const namaHunter = user?.user_metadata?.nama_lengkap || 'Hunter';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Ambil Poin
    const { data: profile } = await supabase.from('profiles').select('total_poin').eq('id', user.id).maybeSingle();
    if (profile) setPoin(profile.total_poin);

    // 2. Ambil ID Kuesioner yang udah selesai (buat filter Beranda)
    const { data: subs } = await supabase.from('submissions').select('campaign_id').eq('hunter_id', user.id);
    const kuesionerSelesai = subs ? subs.map(s => s.campaign_id) : [];

    // 3. Ambil Campaign Aktif
    const { data: allCampaigns } = await supabase.from('campaigns').select('*').gt('target_responden', 0).order('created_at', { ascending: false });
    if (allCampaigns) {
      const kuesionerTersedia = allCampaigns.filter(c => !kuesionerSelesai.includes(c.id));
      setCampaigns(kuesionerTersedia);
    }

    // 4. JURUS BARU: Ambil Riwayat Lengkap (Join Table ke tabel Campaigns)
    const { data: riwayatData } = await supabase
      .from('submissions')
      .select(`
        created_at,
        campaigns (
          judul,
          reward_poin
        )
      `)
      .eq('hunter_id', user.id)
      .order('created_at', { ascending: false });
      
    if (riwayatData) setRiwayat(riwayatData);
  };

  const handleMulaiKerjakan = (campaignId, linkForm) => {
    setFormAktif(campaignId); 
    window.open(linkForm, '_blank'); 
  };

  const handleKlaimPoin = async (campaign) => {
    if (inputKodeValidasi !== campaign.kode_validasi) {
      alert("Kodenya salah bro! Cek lagi di akhir Google Form.");
      return;
    }

    setLoadingKlaim(true);

    const { error: errorSub } = await supabase.from('submissions').insert({
      campaign_id: campaign.id,
      hunter_id: user.id
    });

    if (errorSub) {
      alert("Gagal klaim: " + errorSub.message);
      setLoadingKlaim(false);
      return;
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      nama_lengkap: namaHunter,
      role_user: user?.user_metadata?.role_user || 'hunter',
      total_poin: poin + campaign.reward_poin
    });

    await supabase.from('campaigns').update({
      target_responden: campaign.target_responden - 1
    }).eq('id', campaign.id);

    alert(`Mantap! Kode Benar. Poin lu nambah +${campaign.reward_poin} 🚀`);
    
    setFormAktif(null);
    setInputKodeValidasi('');
    setLoadingKlaim(false);
    fetchData(); // Bakal narik data beranda dan riwayat yang terbaru
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
  };

  // Format tanggal biar enak dibaca
  const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-[#111111] flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif cursor-pointer" onClick={() => setCurrentView('landing')}>SnapForm.</h1>
          <div className="flex items-center gap-6">
            <div className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-bold text-sm shadow-sm border border-amber-200">
               {poin} Poin
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm uppercase">
              {namaHunter.charAt(0)}
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex gap-8">
        {/* --- MENU SAMPING BARU --- */}
        <div className="w-64 hidden md:block">
          <div className="sticky top-24 space-y-2">
            <button 
              onClick={() => setMenuAktif('beranda')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${menuAktif === 'beranda' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-5 h-5 shrink-0" /> Beranda
            </button>
            <button 
              onClick={() => setMenuAktif('riwayat')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${menuAktif === 'riwayat' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" /> Riwayat Saya
            </button>
            
            <div className="mt-8 p-5 bg-[#111111] rounded-2xl text-white">
              <h4 className="font-bold mb-2">Akses Photobooth</h4>
              <p className="text-sm text-gray-400 mb-4">Kumpulkan 50 poin untuk sesi foto gratis.</p>
              <div className="w-full bg-gray-700 h-2 rounded-full mb-2">
                <div className="bg-amber-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((poin / 50) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-right text-gray-400">{poin} / 50 Poin</p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {/* --- HEADER DINAMIS (Berubah sesuai menu yg diklik) --- */}
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

          {/* --- KONDISI IF/ELSE: TAMPILIN LAYAR BERANDA ATAU RIWAYAT --- */}
          {menuAktif === 'beranda' ? (
            <>
              {/* Ini layar Beranda asli lu */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Cari topik kuesioner..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-sm outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.length === 0 ? (
                  <p className="text-gray-400 italic">Kamu sudah menyelesaikan semua kuesioner yang tersedia!</p>
                ) : (
                  campaigns.map((item) => (
                    <div key={item.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">Sisa Kuota: {item.target_responden}</span>
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
                  ))
                )}
              </div>
            </>
          ) : (
            /* --- INI LAYAR RIWAYATNYA --- */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {riwayat.length === 0 ? (
                <p className="text-gray-400 italic">Belum ada riwayat kuesioner yang diselesaikan.</p>
              ) : (
                riwayat.map((item, index) => (
                  <div key={index} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      {/* Badge status selesai warna hijau */}
                      <span className="text-xs font-bold px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Selesai
                      </span>
                      <span className="text-sm font-bold text-gray-400">+{item.campaigns?.reward_poin} Poin</span>
                    </div>
                    {/* Judul ditarik dari tabel lain pakai Join Table */}
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
    </div>
  );
}