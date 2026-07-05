import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TabWithdrawals({ withdrawalsList, handleSetujuiPencairan, handleTolakPencairan }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
        💸 Antrean Transfer SnapCash
      </h2>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="p-6 font-bold">Tanggal & User</th>
              <th className="p-6 font-bold">Tujuan Transfer</th>
              <th className="p-6 font-bold">Nominal</th>
              <th className="p-6 font-bold text-center">Status</th>
              <th className="p-6 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {withdrawalsList.length === 0 ? (
              <tr><td colSpan="5" className="text-center p-10 text-gray-400 italic">Belum ada permintaan pencairan dana.</td></tr>
            ) : (
              withdrawalsList.map(w => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-6">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(w.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{w.hunter_email}</p>
                  </td>
                  <td className="p-6">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md mb-1 inline-block ${w.metode_pencairan === 'DANA' ? 'bg-blue-100 text-blue-700' : w.metode_pencairan === 'GoPay' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {w.metode_pencairan}
                    </span>
                    <p className="font-mono font-bold text-gray-800">{w.nomor_tujuan}</p>
                  </td>
                  <td className="p-6 font-black text-green-500 text-lg">
                    Rp {w.jumlah_rupiah.toLocaleString('id-ID')}
                  </td>
                  <td className="p-6 text-center">
                    {w.status === 'pending' && <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-full border border-amber-200">Pending</span>}
                    {w.status === 'success' && <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full border border-green-200">Selesai</span>}
                    {w.status === 'rejected' && <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full border border-red-200">Ditolak</span>}
                  </td>
                  <td className="p-6 text-right">
                    {w.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleSetujuiPencairan(w.id, w.hunter_id, w.hunter_email)} className="p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-all" title="Tandai Sudah Ditransfer">
                          <CheckCircle2 size={20} />
                        </button>
                        <button onClick={() => handleTolakPencairan(w.id, w.hunter_id, w.jumlah_rupiah)} className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Tolak & Refund Poin">
                          <XCircle size={20} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">- Selesai -</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}