import React from 'react';
import { Trash2, Building2, Plus } from 'lucide-react';

export default function TabKampus({ 
  kampusList, 
  inputKampus, 
  setInputKampus, 
  handleAddKampus, 
  handleDeleteKampus 
}) {
  return (
    <div className="animate-in fade-in duration-300 w-full">
      
      {/* HEADER UTAMA */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-800 mb-1">Database Universitas Resmi</h2>
        <p className="text-gray-500 text-sm">Kelola daftar nama kampus resmi yang berhak berpartisipasi di dalam platform.</p>
      </div>

      {/* STRUKTUR GRID: BAGI 3 KE SAMPING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= KOLOM KIRI: FORM INPUT (1/3 LEBAR) ================= */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-gray-400" />
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
              Tambah Kampus Baru
            </label>
          </div>
          
          <form onSubmit={handleAddKampus} className="flex flex-col gap-3">
            <input
              type="text"
              value={inputKampus}
              onChange={(e) => setInputKampus(e.target.value)}
              placeholder="CONTOH: UNP, UI, ITB"
              className="w-full text-sm font-bold uppercase px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-yellow-400 transition-colors bg-gray-50/50 placeholder:normal-case placeholder:font-normal"
              required
            />
            <button 
              type="submit" 
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md text-sm tracking-wide flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Insert Database
            </button>
          </form>
        </div>

        {/* ================= KOLOM KANAN: TABEL DATA (2/3 LEBAR) ================= */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          
          {/* Header Ringkas Tabel */}
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-800">Daftar Kampus Terdaftar</h3>
            <p className="text-[11px] text-gray-400">Total internal: <span className="font-bold text-gray-700">{kampusList.length} Universitas</span></p>
          </div>

          {/* Konstruksi Tabel Proporsional Tanpa Banyak Space Terbuang */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 font-bold text-center w-16">No</th>
                  <th className="p-3.5 font-bold">Nama Kode Universitas</th>
                  <th className="p-3.5 font-bold text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {kampusList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center p-8 text-gray-400 italic bg-gray-50/10">
                      Belum ada data kampus yang didaftarkan ke sistem.
                    </td>
                  </tr>
                ) : (
                  kampusList.map((k, index) => (
                    <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 text-center font-medium text-gray-400">{index + 1}</td>
                      <td className="p-3.5 font-black text-gray-800 text-sm tracking-wide uppercase">
                        {k.nama_kampus}
                      </td>
                      <td className="p-3.5 text-right">
                        <button 
                          onClick={() => handleDeleteKampus(k.id, k.nama_kampus)} 
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors inline-flex items-center justify-center shadow-sm border border-red-100"
                          title={`Hapus ${k.nama_kampus}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}