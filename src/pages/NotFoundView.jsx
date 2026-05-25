import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundView({ setCurrentView }) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center text-center px-4 font-sans text-[#111111]">
      <h1 className="text-9xl font-serif font-bold tracking-tighter text-gray-200">
        404
      </h1>
      <h2 className="text-3xl font-bold mt-2 mb-4">Waduh, Kesasar Ya?</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Halaman yang kamu cari sepertinya udah ditarik, dihapus, atau memang nggak pernah ada di server kami.
      </p>
      
      <button 
        onClick={() => setCurrentView('landing')}
        className="bg-[#111111] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mx-auto shadow-xl shadow-black/10"
      >
        <ArrowLeft size={18} /> Balik ke Beranda
      </button>
    </div>
  );
}