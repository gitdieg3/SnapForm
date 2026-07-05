import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Bell, PlusCircle, Trash2 } from 'lucide-react';

export default function TabUsers({ 
  usersList = [], 
  searchPengguna, setSearchPengguna, 
  filterRole, setFilterRole, 
  setSelectedUserForNotif, setShowNotifModal, 
  handleTambahPoin, handleHapusPengguna 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Logic Filtering yang disempurnakan
  const filteredUsers = usersList.filter(u => {
    const matchText = (u.nama_lengkap?.toLowerCase() || '').includes(searchPengguna.toLowerCase()) ||
                      (u.universitas?.toLowerCase() || '').includes(searchPengguna.toLowerCase()) ||
                      (u.email?.toLowerCase() || '').includes(searchPengguna.toLowerCase());
    const isKlien = !u.universitas;
    const matchRole = filterRole === 'semua' ? true : filterRole === 'klien' ? isKlien : !isKlien;
    return matchText && matchRole;
  });

  // 2. Logic Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="animate-in fade-in duration-300 w-full">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-800 mb-1">Manajemen Pengguna & Klien</h2>
        <p className="text-gray-500 text-sm">Kelola akun, hapus data (CRUD), atau berikan saldo gratis (Top-Up) Poin untuk Klien baru.</p>
      </div>

      {/* FILTER CONTROLLER BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari nama atau universitas..."
            value={searchPengguna}
            onChange={(e) => { setSearchPengguna(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none transition-colors text-xs bg-gray-50/30"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs">
            <Filter size={12} className="text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className="outline-none bg-transparent font-bold text-gray-700 cursor-pointer"
            >
              <option value="semua">Semua Role</option>
              <option value="klien">Khusus Klien</option>
              <option value="hunter">Khusus Hunter</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4 font-bold">Informasi Akun</th>
              <th className="p-4 font-bold">Universitas</th>
              <th className="p-4 font-bold text-center">Saldo / Poin</th>
              <th className="p-4 font-bold text-right">Tindakan Kontrol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {currentData.length === 0 ? (
              <tr><td colSpan="4" className="text-center p-12 text-gray-400 italic bg-gray-50/10">Data tidak ditemukan.</td></tr>
            ) : (
              currentData.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold text-gray-900 text-[13px]">{u.nama_lengkap || 'Tanpa Nama'}</p>
                      <p className="text-[11px] text-gray-400">{u.email || '-'}</p>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-600">{u.universitas || 'UMUM'}</td>
                  <td className="p-4 text-center">
                    <span className="font-black text-orange-500">{u.total_poin || 0}</span>
                    <span className="text-[10px] text-gray-400 ml-1">Pts</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedUserForNotif(u); setShowNotifModal(true); }} className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg font-bold text-[11px]">
                        <Bell size={12} /> Notif
                      </button>
                      <button onClick={() => handleTambahPoin(u.id, u.total_poin || 0, u.nama_lengkap)} className="flex items-center gap-1.5 bg-gray-900 text-white hover:bg-gray-800 px-3 py-2 rounded-lg font-bold text-[11px]">
                        <PlusCircle size={12} /> Top-Up
                      </button>
                      <button onClick={() => handleHapusPengguna(u.id, u.nama_lengkap)} className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION CONTROLLER[cite: 3] */}
        <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-gray-500 text-[11px] font-medium">Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} dari {filteredUsers.length} data.</p>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-50"><ChevronLeft size={14}/></button>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-50"><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}