import React from 'react';
import { Trash2 } from 'lucide-react';

export default function TabCampaigns({ campaignsList, handleHapusCampaign }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Moderasi Konten Kuesioner</h2>
      {campaignsList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200 max-w-md">
          <p className="text-gray-400 italic">Antrean platform kosong. Tidak ada kuesioner aktif.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaignsList.map(camp => (
            <div key={camp.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
              <div className="mb-4">
                <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md uppercase tracking-wider">ID: {camp.id}</span>
              </div>
              <h3 className="text-lg font-bold mb-3 line-clamp-2 leading-snug text-gray-800">{camp.judul}</h3>
              <p className="text-xs text-gray-500 mb-2 truncate">Klien: {camp.klien_email}</p>
              <div className="mb-6">
                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100 font-bold">
                  🎯 Target: {camp.target_universitas || 'Semua Kampus'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-600">{camp.terisi || 0}/{camp.target_responden} Terisi</span>
                <button
                  onClick={() => handleHapusCampaign(camp.id, camp.judul)}
                  className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2.5 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}