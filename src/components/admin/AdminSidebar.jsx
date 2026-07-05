import React from 'react';
import { 
  LayoutDashboard, Building2, Ticket, Users, 
  ShieldAlert, Banknote, LogOut 
} from 'lucide-react';

export default function AdminSidebar({ activeTab, setActiveTab, handleLogout }) {
  const menus = [
    { id: 'overview', icon: LayoutDashboard, label: 'Statistik Pusat' },
    { id: 'voucher', icon: Ticket, label: 'Kasir Photobooth' },
    { id: 'users', icon: Users, label: 'Data Pengguna' },
    { id: 'campaigns', icon: ShieldAlert, label: 'Moderasi Kuesioner' },
    { id: 'withdrawals', icon: Banknote, label: 'Loket Pencairan' },
    { id: 'kampus', icon: Building2, label: 'Master Kampus' },
  ];

  return (
    <div className="w-24 h-[calc(100vh-2rem)] bg-[#FACC15] m-4 rounded-[2rem] flex flex-col items-center py-8 shadow-lg shadow-yellow-500/20 fixed z-20">
      {/* Logo Garis Minimalis */}
      <div className="mb-12 flex flex-col items-center gap-1.5 cursor-pointer">
        <div className="w-8 h-1 bg-gray-900 rounded-full"></div>
        <div className="w-8 h-1 bg-gray-900 rounded-full"></div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center gap-6 mt-4">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive = activeTab === menu.id;
          return (
            <button
              key={menu.id}
              onClick={() => setActiveTab(menu.id)}
              title={menu.label}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gray-900 text-[#FACC15] shadow-md' 
                  : 'text-gray-900 hover:bg-black/10'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>

      <button 
        onClick={handleLogout}
        title="Keluar Admin"
        className="p-3 mt-4 text-gray-900 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
      >
        <LogOut size={24} />
      </button>
    </div>
  );
}