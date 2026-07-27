import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AspirationForm } from '../components/AspirationForm';

export const PublicPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors font-sans">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <AspirationForm />
      </main>
      <Footer />
    </div>
  );
};
