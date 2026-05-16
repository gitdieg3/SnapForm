import React, { useState } from 'react';
import LandingView from './pages/LandingView';
import RegisterView from './pages/RegisterView';
import BerandaView from './pages/BerandaView';
import DashboardKlien from './pages/DashboardKlien'; // Wajib import ini

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [sessionData, setSessionData] = useState(null);

  // FUNGSI PINTAR: Ngarahin user sesuai jabatannya dari Supabase
  const handleLoginSuccess = (user) => {
    setSessionData(user);
    // Ambil data jabatan yang disimpen pas dia daftar
    const role = user.user_metadata?.role_user;
    
    if (role === 'klien') {
      setCurrentView('dashboard_klien');
    } else {
      setCurrentView('beranda');
    }
  };

  return (
    <>
      {currentView === 'landing' && <LandingView setCurrentView={setCurrentView} />}
      
      {currentView === 'register' && (
        <RegisterView 
          setCurrentView={setCurrentView} 
          onLoginSuccess={handleLoginSuccess} // Kirim fungsi pintar ini ke form
        />
      )}
      
      {currentView === 'beranda' && (
        <BerandaView setCurrentView={setCurrentView} user={sessionData} />
      )}

      {currentView === 'dashboard_klien' && (
        <DashboardKlien setCurrentView={setCurrentView} user={sessionData} />
      )}
    </>
  );
}