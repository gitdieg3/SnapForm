import React from 'react';
import { ArrowRight, PlayCircle, List, Coins, Camera } from 'lucide-react';

export default function LandingView({ setCurrentView }) {
  // Fungsi Smooth Scroll (Racikan Mesin)
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Data Kuesioner (Desain Asli Lu - Aman & Rapi)
  const kuesionerData = [
    {
      id: 1, title: "Pengaruh E-Sports terhadap Prestasi Mahasiswa", target: "Mahasiswa Padang",
      points: 15, image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800", color: "bg-amber-100", span: "col-span-1 md:col-span-2 row-span-2"
    },
    {
      id: 2, title: "Survei Minat Kopi Susu Gula Aren", target: "Umum (18-25th)",
      points: 10, image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400", color: "bg-[#e8ecea]", span: "col-span-1 row-span-1"
    },
    {
      id: 3, title: "Kesehatan Mental Gen Z di Era Digital", target: "Gen Z",
      points: 20, image: "https://images.unsplash.com/photo-1621525408631-18c0c8cccd13?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", color: "bg-[#d5cdc4]", span: "col-span-1 row-span-1"
    },
    {
      id: 4, title: "Penggunaan AI untuk Skripsi", target: "Mahasiswa Akhir",
      points: 25, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800", color: "bg-[#4a5d4e]", textColor: "text-white", span: "col-span-1 md:col-span-2 row-span-1"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#111111] font-sans selection:bg-amber-200 selection:text-black flex flex-col">
      
      {/* NAVBAR (Ditambah efek Sticky & Smooth Scroll) */}
      <nav className="sticky top-0 z-50 bg-[#FDFCF8]/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between py-4 px-8 w-full">
        <div className="flex items-center gap-8 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold font-serif tracking-tighter cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              SnapForm.
            </h1>
            <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => scrollToSection('kuesioner')} className="hover:text-black transition-colors">Kuesioner</button>
              <button onClick={() => scrollToSection('cara-kerja')} className="hover:text-black transition-colors">Cara Kerja</button>
              <button onClick={() => scrollToSection('cara-kerja')} className="hover:text-black transition-colors">Photobooth</button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={() => setCurrentView('login')} className="hidden md:block hover:text-gray-600">Masuk</button>
            <button 
              onClick={() => setCurrentView('register')}
              className="bg-[#111111] text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              Daftar Sekarang <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>
      
      {/* HERO SECTION (Desain Melengkung Asli Lu) */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-20 pb-24 max-w-5xl mx-auto w-full">
        <h2 className="text-5xl md:text-7xl font-serif tracking-tight leading-[1.1] mb-6">
          Kumpulkan Data Skripsi,<br />
          <span className="font-sans font-bold">Tanpa Drama.</span>
        </h2>
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mb-10">
          Platform all-in-one untuk menyebarkan kuesioner Anda dengan cepat, atau kumpulkan poin dengan menjadi responden untuk akses Photobooth gratis.
        </p>
        <button 
          onClick={() => scrollToSection('kuesioner')}
          className="bg-[#111111] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl shadow-gray-200"
        >
          Mulai Cari Responden <ArrowRight size={20} />
        </button>

        {/* Simulasi Gambar Melengkung (Gallery) */}
        <div className="mt-20 w-full flex justify-center gap-4 overflow-hidden px-4">
          {[
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=300&h=400",
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=300&h=400",
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=300&h=400",
            "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=300&h=400"
          ].map((img, i) => (
            <div key={i} className={`w-48 h-64 md:w-64 md:h-80 rounded-2xl overflow-hidden shrink-0 shadow-lg ${i === 0 || i === 3 ? 'translate-y-8 opacity-60' : 'translate-y-0'} transition-all duration-500 hover:translate-y-0 hover:opacity-100`}>
              <img src={img} alt="Gallery" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </main>

      {/* BENTO GRID (Kuesioner Tersedia + Jebakan Login) */}
      <section id="kuesioner" className="w-full bg-[#FDFCF8] py-24 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 text-left">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">Tugas Kuesioner Hari Ini</h3>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">Selesaikan kuesioner di bawah ini, kumpulkan poinnya, dan tukarkan dengan sesi foto seru di booth kami.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {kuesionerData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setCurrentView('register')} // JEBAKAN BATMAN
                className={`${item.span} ${item.color} rounded-[2rem] overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-8`}
              >
                {item.image && (
                  <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 mix-blend-multiply" />
                )}
                <div className={`relative z-10 ${item.textColor || 'text-black'}`}>
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold mb-3">
                    {item.target}
                  </span>
                  <h4 className="text-2xl font-bold leading-tight max-w-xs">{item.title}</h4>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1"><span className="text-lg">+{item.points}</span> Poin</span>
                    <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-black transition-colors">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARA KERJA (Video & Penjelasan) */}
      <section id="cara-kerja" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Kiri: Penjelasan Step by Step */}
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Ubah Waktu Luang <br/>Jadi <span className="text-amber-500">Tiket Photobooth.</span></h2>
              <p className="text-gray-500 text-lg mb-10">Membantu sesama mahasiswa menyebarkan kuesioner kini ada harganya. Ikuti 3 langkah mudah ini.</p>
              
              <div className="space-y-8">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <List size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">1. Pilih & Kerjakan Kuesioner</h4>
                    <p className="text-gray-500 leading-relaxed">Buat akun gratis. Pilih kuesioner yang tersedia di Beranda, lalu isi Google Form-nya dengan jujur sampai selesai.</p>
                  </div>
                </div>

                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Coins size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">2. Klaim Poin Otomatis</h4>
                    <p className="text-gray-500 leading-relaxed">Masukkan kode validasi unik yang ada di akhir kuesioner. Sistem akan otomatis menambahkan saldo poin ke dompet akunmu.</p>
                  </div>
                </div>

                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">3. Tukar Tiket Photobooth</h4>
                    <p className="text-gray-500 leading-relaxed">Kumpulkan hingga 50 Poin. Tekan tombol Akses Photobooth untuk mendapatkan Kode QR yang bisa discan di mesin foto terdekat!</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setCurrentView('register')} 
                className="mt-10 bg-[#111111] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-800 transition-colors inline-flex items-center gap-3"
              >
                Daftar Akun Gratis <ArrowRight size={20} />
              </button>
            </div>

            {/* Kanan: Placeholder Video (Jebakan Login) */}
            <div 
              className="relative aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center group cursor-pointer" 
              onClick={() => setCurrentView('register')}
            >
              <img src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80" alt="Video Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
              <div className="relative z-10 w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 group-hover:bg-amber-500 transition-colors">
                <PlayCircle className="text-white w-10 h-10 ml-1" />
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <p className="text-white font-bold text-lg">Lihat Cara Kerja SnapForm (1 Menit)</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}