import React from 'react';
import { Users, ShieldAlert, Ticket, Camera, Wallet } from 'lucide-react';

export default function TabOverview({ stats, systemSettings, handleToggleSetting }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-3xl font-black text-gray-800">Selamat Datang, Tuan CEO! 👑</h2>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Total Pengguna</p>
            <p className="text-5xl font-black text-gray-800">{stats.users}</p>
          </div>
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Total Kuesioner</p>
            <p className="text-5xl font-black text-gray-800">{stats.campaigns}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-amber-400 p-6 rounded-3xl shadow-sm text-gray-900">
            <p className="font-bold text-sm uppercase tracking-wider mb-2">Tiket Photobooth Terbit</p>
            <p className="text-5xl font-black">{stats.vouchers}</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">Kendali Sistem</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Camera size={20}/></div>
            <div>
              <p className="font-bold text-gray-800">🎟️ Akses Photobooth</p>
              <p className="text-xs text-gray-500">Aktifkan untuk penukaran tiket sesi foto gratis.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={systemSettings.is_photobooth_active} onChange={(e) => handleToggleSetting('is_photobooth_active', e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Wallet size={20}/></div>
            <div>
              <p className="font-bold text-gray-800">💰 Dompet SnapCash</p>
              <p className="text-xs text-gray-500">Aktifkan untuk fitur tarik tunai (Rp 10.000).</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={systemSettings.is_cash_active} onChange={(e) => handleToggleSetting('is_cash_active', e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>
    </div>
  );
}