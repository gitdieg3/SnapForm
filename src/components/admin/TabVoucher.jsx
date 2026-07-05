import React, { useState } from 'react';
import { CheckCircle2, XCircle, Search, FileText, Filter } from 'lucide-react';

export default function TabVoucher({ 
  inputVoucher, 
  setInputVoucher, 
  voucherStatus, 
  setVoucherStatus, 
  handleValidasiVoucher,
  vouchersData = [] 
}) {
  const [searchHistory, setSearchHistory] = useState('');
  const [filterStatus, setFilterStatus] = useState('terpakai'); // Default nampilin yang sudah di-redeem

  // Filter Data Tabel
  const filteredVouchers = vouchersData.filter(v => {
    const matchCode = (v.kode_voucher || '').toLowerCase().includes(searchHistory.toLowerCase());
    const matchStatus = filterStatus === 'semua' ? true : v.status === filterStatus;
    return matchCode && matchStatus;
  });

  // Fungsi Cetak PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableRows = filteredVouchers.map((v, index) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace; font-weight: bold;">${v.kode_voucher}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-transform: uppercase; font-size: 12px;">${v.status}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${v.updated_at ? new Date(v.updated_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Validasi Tiket Photobooth</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h2 { margin-bottom: 5px; }
            p { color: #666; margin-bottom: 25px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f4f5f7; padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
          </style>
        </head>
        <body>
          <h2>LAPORAN RIWAYAT KLAIM VOUCHER</h2>
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">No</th>
                <th>Kode Voucher</th>
                <th>Status</th>
                <th>Tanggal Penukaran</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Tidak ada data data terkumpul</td></tr>'}
            </tbody>
          </table>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-in fade-in duration-300 w-full">
      {/* HEADER UTAMA */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-800 mb-1">Validasi Tiket Photobooth</h2>
        <p className="text-gray-500 text-sm">Ketik kode atau scan QR Code milik pengguna untuk memverifikasi keaslian voucher tiket.</p>
      </div>
      
      {/* STRUKTUR GRID: BAGI 3 KE SAMPING (1 Bagian Kiri, 2 Bagian Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= KOLOM KIRI (1/3 LEBAR) ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Panel Cek Voucher
            </label>
            <form onSubmit={handleValidasiVoucher} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="CONTOH: SNAP-A1B2C3"
                value={inputVoucher}
                onChange={(e) => { setInputVoucher(e.target.value.toUpperCase()); setVoucherStatus(null); }}
                className="w-full text-base font-mono tracking-widest px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-yellow-400 transition-colors uppercase bg-gray-50/50"
                required
              />
              <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md text-sm tracking-wide">
                Cek Voucher
              </button>
            </form>
          </div>

          {/* Notifikasi Status Hasil Cek ter-sarang di bawah Form */}
          {voucherStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <div className="text-xs"><span className="font-bold">Voucher VALID! 🎉</span> Sukses dicairkan. Silakan persilakan user masuk ke bilik foto.</div>
            </div>
          )}
          {voucherStatus === 'used' && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2">
              <XCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-xs"><span className="font-bold">Akses Ditolak!</span> Voucher digital ini sudah hangus atau pernah terpakai.</div>
            </div>
          )}
          {voucherStatus === 'invalid' && (
            <div className="bg-gray-100 border border-gray-300 text-gray-600 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2">
              <Search size={20} className="shrink-0 mt-0.5" />
              <div className="text-xs"><span className="font-bold">Kode Salah!</span> Periksa susunan karakter kode unik kembali.</div>
            </div>
          )}
        </div>

        {/* ================= KOLOM KANAN (2/3 LEBAR) ================= */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          
          {/* Header Tabel Mini */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">Log Aktivitas Penukaran</h3>
              <p className="text-[11px] text-gray-400">Daftar rekam jejak tiket digital terbitan sistem.</p>
            </div>
            
            <button 
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 transition-colors shadow-sm"
            >
              <FileText size={14} className="text-red-500" />
              PDF
            </button>
          </div>

          {/* Filter Toolbar Mini */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Cari kode kupon..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none transition-colors text-xs bg-gray-50/30"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-gray-200 shrink-0">
              <Filter size={12} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="outline-none text-xs bg-transparent font-bold text-gray-600 cursor-pointer"
              >
                <option value="semua">Semua</option>
                <option value="terpakai">Sudah Discan</option>
                <option value="aktif">Belum Dipakai</option>
              </select>
            </div>
          </div>

          {/* Konstruksi Tabel Ringkas */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 font-bold text-center w-12">No</th>
                  <th className="p-3 font-bold">Kode Kupon</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-6 text-gray-400 italic bg-gray-50/10">
                      Tidak ditemukan riwayat tiket.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v, index) => (
                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-center text-gray-400">{index + 1}</td>
                      <td className="p-3 font-mono font-bold text-gray-900 tracking-wide text-xs">{v.kode_voucher}</td>
                      <td className="p-3">
                        {v.status === 'terpakai' ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 font-bold rounded text-[10px]">Redeemed</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 font-bold rounded text-[10px]">Ready</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-gray-400 text-[11px]">
                        {v.updated_at 
                          ? new Date(v.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                          : '-'
                        }
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