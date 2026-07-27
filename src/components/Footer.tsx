import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
        <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
          "Mewujudkan Generasi Rabbani Berakhlak Mulia & Berprestasi"
        </p>
        <div className="pt-3 max-w-xs mx-auto text-xs font-semibold text-slate-400 dark:text-zinc-500 tracking-wider uppercase">
          © 2026 SD IT Nurul Kautsar
        </div>
      </div>
    </footer>
  );
};

