import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Settings, GraduationCap, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'WAKASEK') return '/wakasek';
    if (user.role === 'KEPALA_SEKOLAH') return '/kepala-sekolah';
    return '/';
  };

  const isDashboardPage = location.pathname !== '/';

  return (
    <>
      {/* Top Editorial Metadata Strip removed per user selection */}

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Left: Brand */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  SD IT Nurul Kautsar
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mt-0.5 tracking-wide">
                Aspirasi & Umpan Balik Internal
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
              title={theme === 'light' ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang'}
              aria-label="Toggle tema"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {!isDashboardPage ? (
                  <button
                    onClick={() => navigate(getDashboardPath())}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 text-xs font-semibold tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                ) : (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/50 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                    <span>{user.name}</span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-red-500 hover:text-red-600 dark:hover:border-red-500/50 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Keluar dari sistem"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
                title="Login Pengelola"
                aria-label="Login Pengelola"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pengelola</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
};
