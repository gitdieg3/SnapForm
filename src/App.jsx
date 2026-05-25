import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import LandingView from './pages/LandingView';
import RegisterView from './pages/RegisterView';
import BerandaView from './pages/BerandaView';
import DashboardKlien from './pages/DashboardKlien';
import NotFoundView from './pages/NotFoundView'; // <-- Wajib import ini buat halaman 404
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [sessionData, setSessionData] = useState(null);

  // FUNGSI PINTAR: Ngarahin user sesuai jabatannya
  const handleLoginSuccess = (user) => {
    setSessionData(user);
    const role = user.user_metadata?.role_user;

    // --- PINTU RAHASIA ADMIN ---
    // Ganti "admin@snapform.com" dengan email pribadi yang lu pake buat daftar
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

      // --- TAMBAHAN ROUTE ADMIN ---
      case 'admin':
        return <AdminDashboard setCurrentView={setCurrentView} user={sessionData} />;

      default:
        return <NotFoundView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <>
      {/* Taruh Toaster di sini biar notifnya bisa muncul di semua halaman */}
      <Toaster position="top-center" reverseOrder={false} /> 
      {renderView()}
    </>
  );
}