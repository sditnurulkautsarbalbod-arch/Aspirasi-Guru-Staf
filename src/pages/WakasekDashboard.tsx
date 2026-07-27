import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StatusBadge } from '../components/StatusBadge';
import { AspirationDetailModal } from '../components/AspirationDetailModal';
import { Aspiration, AspirationStatus, AspirationStats, PaginationInfo } from '../types';
import { apiRequest, downloadExcelFile } from '../lib/api';
import {
  RefreshCw,
  Search,
  Eye,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FileSpreadsheet,
} from 'lucide-react';

export const WakasekDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [stats, setStats] = useState<AspirationStats>({ total: 0, baru: 0, ditinjau: 0, ditindaklanjuti: 0, selesai: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal State
  const [selectedAsp, setSelectedAsp] = useState<Aspiration | null>(null);
  const [selectedAspDisplayNumber, setSelectedAspDisplayNumber] = useState<number | undefined>(undefined);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadAspirations = useCallback(async (page = 1, showRefreshToast = false) => {
    setIsLoading(true);
    if (showRefreshToast) setIsRefreshing(true);

    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('limit', '20');
    if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());
    if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const res = await apiRequest<{ items: Aspiration[]; pagination: PaginationInfo; stats: AspirationStats }>(
      `/wakasek/aspirations?${queryParams.toString()}`
    );

    setIsLoading(false);
    setIsRefreshing(false);

    if (res.success && res.data) {
      setAspirations(res.data.items);
      setPagination(res.data.pagination);
      setStats(res.data.stats);
      setCurrentPage(res.data.pagination.page);
      if (showRefreshToast) showToast('Data aspirasi telah diperbarui', 'info');
    } else {
      showToast(res.error || 'Gagal memuat data aspirasi', 'error');
    }
  }, [searchQuery, statusFilter, startDate, endDate, showToast]);

  useEffect(() => {
    loadAspirations(currentPage);
  }, [currentPage, loadAspirations]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAspirations(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    loadAspirations(1);
  };

  const handleSaveAspiration = async (id: number, status: AspirationStatus, admin_note: string) => {
    const res = await apiRequest(`/wakasek/aspirations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_note }),
    });

    if (res.success) {
      showToast('Status & catatan berhasil disimpan', 'success');
      loadAspirations(currentPage);
      return true;
    } else {
      showToast(res.error || 'Gagal menyimpan perubahan', 'error');
      return false;
    }
  };

  // Excel Export
  const handleExportExcel = async () => {
    showToast('Menyiapkan berkas Excel...', 'info');
    const ok = await downloadExcelFile('/wakasek/aspirations/export');
    if (ok) {
      showToast('Berkas Excel berhasil diunduh', 'success');
    } else {
      showToast('Gagal mengunduh Excel', 'error');
    }
  };

  const formatDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Banner */}
        <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Otoritas Wakasek</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Dashboard Wakasek: {user?.name === 'Wakil Kepala Sekolah' ? 'Wakil Kepala Sekolah Bidang Kurikulum' : (user?.name || 'Wakil Kepala Sekolah Bidang Kurikulum')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl">
              Pantau aspirasi dan umpan balik guru serta staf untuk mendukung pengembangan profesional dan perbaikan lingkungan kerja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAspirations(currentPage, true)}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow disabled:opacity-60 select-none cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyegarkan...' : 'Segarkan Data'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 rounded-xl shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Total Aspirasi
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.total}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900/80 border border-amber-200/80 dark:border-amber-900/40 rounded-xl shadow-2xs space-y-1">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Status Baru
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.baru}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900/80 border border-sky-200/80 dark:border-sky-900/40 rounded-xl shadow-2xs space-y-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
              Ditinjau
            </span>
            <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
              {stats.ditinjau}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900/80 border border-indigo-200/80 dark:border-indigo-900/40 rounded-xl shadow-2xs space-y-1">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              Tindak Lanjut
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.ditindaklanjuti}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900/80 border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl shadow-2xs space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Selesai
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.selesai}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci aspirasi..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all font-sans"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none uppercase font-sans cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="BARU">BARU</option>
                <option value="DITINJAU">DITINJAU</option>
                <option value="DITINDAKLANJUTI">DITINDAKLANJUTI</option>
                <option value="SELESAI">SELESAI</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none font-sans"
                title="Tanggal Mulai"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none font-sans"
                title="Tanggal Akhir"
              />

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Cari
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Unduh Excel</span>
              </button>
            </div>
          </form>

          {(searchQuery || statusFilter !== 'ALL' || startDate || endDate) && (
            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-zinc-800 pt-2.5">
              <span className="text-xs font-medium">Filter Aktif Diterapkan</span>
              <button
                onClick={handleResetFilters}
                className="text-slate-900 dark:text-slate-100 hover:underline font-bold text-xs cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Aspirations List */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Memuat data aspirasi...</p>
          </div>
        ) : aspirations.length === 0 ? (
          <div className="p-12 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl text-center space-y-3 shadow-xs">
            <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Belum Ada Rekaman Aspirasi
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Belum terdapat aspirasi atau umpan balik yang masuk sesuai kriteria pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary Bar */}
            <div className="flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Total: {pagination?.total || aspirations.length} pesan aspirasi
              </span>
            </div>

            {aspirations.map((asp, index) => {
              const displayNum = pagination?.total
                ? pagination.total - ((pagination.page - 1) * pagination.limit + index)
                : aspirations.length - index;

              return (
                <div
                  key={asp.id}
                  className="p-5 sm:p-6 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl transition-all hover:shadow-md space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Aspirasi #{displayNum}
                      </span>
                      <StatusBadge status={asp.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateString(asp.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {asp.message}
                  </p>

                  {asp.admin_note && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                      <strong className="font-bold text-slate-900 dark:text-slate-100">Catatan Evaluasi:</strong> {asp.admin_note}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        setSelectedAsp(asp);
                        setSelectedAspDisplayNumber(displayNum);
                        setIsDetailOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Detail</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-slate-500 font-medium">
                  Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    {currentPage}
                  </span>

                  <button
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                    className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Aspiration Detail Modal */}
      <AspirationDetailModal
        aspiration={selectedAsp}
        displayNumber={selectedAspDisplayNumber}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSave={handleSaveAspiration}
      />

      <Footer />
    </div>
  );
};
