import React, { useState, useEffect } from 'react'; // <-- TAMBAHAN useEffect
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabaseClient'; // <-- WAJIB IMPORT SUPABASE BUAT CEK SESI

import LandingView from './pages/LandingView';
import RegisterView from './pages/RegisterView';
import BerandaView from './pages/BerandaView';
import DashboardKlien from './pages/DashboardKlien';
import NotFoundView from './pages/NotFoundView'; 
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [sessionData, setSessionData] = useState(null);

  // --- 🎥 CCTV SESI (ANTI-LOGOUT PAS REFRESH) ---
  useEffect(() => {
    // 1. Cek brankas sesi saat pertama kali web di-load atau di-refresh (F5)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Kalau ketemu sesinya, arahin ke halamannya pakai fungsi pintar lu
        handleLoginSuccess(session.user); 
      }
    });

    // 2. Pasang CCTV untuk memantau jika tiba-tiba token expired atau di-logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionData(session.user);
      } else {
        setSessionData(null);
        setCurrentView('landing'); // Tendang ke halaman depan kalau beneran logout
      }
    });

    // 3. Bersihkan CCTV kalau komponen dimatikan
    return () => subscription.unsubscribe();
  }, []);
  // ----------------------------------------------

  // FUNGSI PINTAR: Ngarahin user sesuai jabatannya
  const handleLoginSuccess = (user) => {
    setSessionData(user);
    const role = user.user_metadata?.role_user;

    // --- PINTU RAHASIA ADMIN ---
    if (user.email === 'admin@snapform.com') {
      setCurrentView('admin');
    } else if (role === 'klien') {
      setCurrentView('dashboard_klien');
    } else {
      setCurrentView('beranda');
    }
  };

  // FUNGSI RENDER
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView setCurrentView={setCurrentView} />;
      case 'register':
        return <RegisterView setCurrentView={setCurrentView} onLoginSuccess={handleLoginSuccess} defaultIsLogin={false} />;
      case 'login':
        return <RegisterView setCurrentView={setCurrentView} onLoginSuccess={handleLoginSuccess} defaultIsLogin={true} />;
      case 'beranda':
        return <BerandaView setCurrentView={setCurrentView} user={sessionData} />;
      case 'dashboard_klien':
        return <DashboardKlien setCurrentView={setCurrentView} user={sessionData} />;
      case 'admin':
        return <AdminDashboard setCurrentView={setCurrentView} user={sessionData} />;
      default:
        return <NotFoundView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} /> 
      {renderView()}
    </>
  );
}