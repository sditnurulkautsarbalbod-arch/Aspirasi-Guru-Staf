import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#121212] px-4 font-sans">
      <div className="max-w-md w-full p-8 sm:p-10 bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#121212] dark:border-[#FAF9F6] text-center space-y-5">
        <div className="w-12 h-12 border border-[#121212] dark:border-[#FAF9F6] text-[#121212] dark:text-[#FAF9F6] flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="font-serif-display text-5xl font-normal text-[#121212] dark:text-[#FAF9F6]">404</h1>
          <h2 className="font-editorial text-xl italic text-[#121212] dark:text-[#FAF9F6]">
            Halaman Tidak Ditemukan
          </h2>
        </div>
        <p className="font-editorial text-sm italic text-[#707070] dark:text-[#A0A0A0] leading-relaxed">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#121212] hover:bg-[#333] dark:bg-[#FAF9F6] dark:hover:bg-[#E5E4E0] text-[#FAF9F6] dark:text-[#121212] text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
