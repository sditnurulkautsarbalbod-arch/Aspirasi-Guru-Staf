import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StatusBadge } from '../components/StatusBadge';
import { AspirationDetailModal } from '../components/AspirationDetailModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { AddUserModal, EditPasswordModal, EditUserModal } from '../components/UserManagementModal';
import { Aspiration, AspirationStatus, User, AspirationStats, PaginationInfo } from '../types';
import { apiRequest, downloadExcelFile } from '../lib/api';
import {
  RefreshCw,
  Search,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  Edit3,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Inbox,
  FileSpreadsheet,
  ChevronDown,
  CheckSquare,
  X,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'aspirations' | 'users'>('aspirations');

  // Aspirations State
  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [stats, setStats] = useState<AspirationStats>({ total: 0, baru: 0, ditinjau: 0, ditindaklanjuti: 0, selesai: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoadingAsp, setIsLoadingAsp] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [selectedAsp, setSelectedAsp] = useState<Aspiration | null>(null);
  const [selectedAspDisplayNumber, setSelectedAspDisplayNumber] = useState<number | undefined>(undefined);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [deleteAspId, setDeleteAspId] = useState<number | null>(null);
  const [isDeleteAspModalOpen, setIsDeleteAspModalOpen] = useState(false);
  const [isDeletingAsp, setIsDeletingAsp] = useState(false);

  // Bulk Delete State
  const [selectedAspIds, setSelectedAspIds] = useState<number[]>([]);
  const [bulkDeleteType, setBulkDeleteType] = useState<'selected' | 'all' | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // User Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [visiblePasswordUserIds, setVisiblePasswordUserIds] = useState<number[]>([]);

  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);

  const [editPassUser, setEditPassUser] = useState<{ id: number; name: string } | null>(null);
  const [isEditPassOpen, setIsEditPassOpen] = useState(false);

  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const togglePasswordVisibility = (userId: number) => {
    setVisiblePasswordUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleShowAllPasswords = () => {
    if (usersList.length > 0 && visiblePasswordUserIds.length === usersList.length) {
      setVisiblePasswordUserIds([]);
    } else {
      setVisiblePasswordUserIds(usersList.map((u) => u.id));
    }
  };

  // Fetch Aspirations
  const loadAspirations = useCallback(async (page = 1, showRefreshToast = false) => {
    setIsLoadingAsp(true);
    if (showRefreshToast) setIsRefreshing(true);

    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('limit', '20');
    if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());
    if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const res = await apiRequest<{ items: Aspiration[]; pagination: PaginationInfo; stats: AspirationStats }>(
      `/admin/aspirations?${queryParams.toString()}`
    );

    setIsLoadingAsp(false);
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

  // Fetch Users
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    const res = await apiRequest<User[]>('/admin/users');
    setIsLoadingUsers(false);

    if (res.success && res.data) {
      setUsersList(res.data);
    } else {
      showToast(res.error || 'Gagal memuat daftar pengguna', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'aspirations') {
      loadAspirations(currentPage);
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, currentPage, loadAspirations, loadUsers]);

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

  // Excel Export
  const handleExportExcel = async () => {
    showToast('Menyiapkan berkas Excel...', 'info');
    const ok = await downloadExcelFile();
    if (ok) {
      showToast('Berkas Excel berhasil diunduh', 'success');
    } else {
      showToast('Gagal mengunduh Excel', 'error');
    }
  };

  // Save Aspiration Detail
  const handleSaveAspiration = async (id: number, status: AspirationStatus, admin_note: string) => {
    const res = await apiRequest(`/admin/aspirations/${id}`, {
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

  // Delete Aspiration
  const handleConfirmDeleteAsp = async () => {
    if (!deleteAspId) return;
    setIsDeletingAsp(true);
    const res = await apiRequest(`/admin/aspirations/${deleteAspId}`, {
      method: 'DELETE',
    });
    setIsDeletingAsp(false);
    setIsDeleteAspModalOpen(false);

    if (res.success) {
      showToast('Aspirasi berhasil dihapus', 'success');
      setDeleteAspId(null);
      setSelectedAspIds((prev) => prev.filter((id) => id !== deleteAspId));
      loadAspirations(currentPage);
    } else {
      showToast(res.error || 'Gagal menghapus aspirasi', 'error');
    }
  };

  // Bulk Delete Handlers
  const handleToggleSelectOne = (id: number) => {
    setSelectedAspIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const currentPageIds = aspirations.map((a) => a.id);
    const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedAspIds.includes(id));

    if (allSelected) {
      setSelectedAspIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedAspIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteType) return;
    setIsBulkDeleting(true);

    const res = await apiRequest('/admin/aspirations/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({
        type: bulkDeleteType,
        ids: bulkDeleteType === 'selected' ? selectedAspIds : [],
      }),
    });

    setIsBulkDeleting(false);
    setIsBulkDeleteModalOpen(false);

    if (res.success) {
      showToast(res.message || 'Berhasil menghapus pesan aspirasi', 'success');
      setSelectedAspIds([]);
      setBulkDeleteType(null);
      setIsSelectionMode(false);
      loadAspirations(currentPage);
    } else {
      showToast(res.error || 'Gagal menghapus pesan aspirasi', 'error');
    }
  };

  // Delete User
  const handleConfirmDeleteUser = async () => {
    if (!deleteUserId) return;
    setIsDeletingUser(true);
    const res = await apiRequest(`/admin/users/${deleteUserId}`, {
      method: 'DELETE',
    });
    setIsDeletingUser(false);
    setIsDeleteUserModalOpen(false);

    if (res.success) {
      showToast(`Pengguna ${deleteUserName} berhasil dihapus`, 'success');
      setDeleteUserId(null);
      setDeleteUserName('');
      loadUsers();
    } else {
      showToast(res.error || 'Gagal menghapus pengguna', 'error');
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
              <span>Otoritas Sistem Utama</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Administrator: {user?.username}
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Panel pengelolaan arsip aspirasi & akses pengguna SD IT Nurul Kautsar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'aspirations') loadAspirations(currentPage, true);
                else loadUsers();
              }}
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

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800 pb-1">
          <button
            onClick={() => setActiveTab('aspirations')}
            className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'aspirations'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Arsip Aspirasi ({stats.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kelola Pengguna ({usersList.length || '3'})</span>
          </button>
        </div>

        {/* TAB 1: DATA ASPIRASI */}
        {activeTab === 'aspirations' && (
          <div className="space-y-4">
            {/* Search & Filter Controls */}
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
                  {/* Status Dropdown */}
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

                  {/* Start Date */}
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none font-sans"
                    title="Tanggal Mulai"
                  />

                  {/* End Date */}
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
            {isLoadingAsp ? (
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
                {/* Selection & Bulk Delete Bar */}
                {!isSelectionMode ? (
                  <div className="flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                      Total: {pagination?.total || aspirations.length} pesan aspirasi
                    </span>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsActionMenuOpen((prev) => !prev)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100/80 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200/80 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        <span>Opsi Penghapusan</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isActionMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isActionMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsActionMenuOpen(false)}
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-20 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setIsSelectionMode(true);
                                setIsActionMenuOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <CheckSquare className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">Pilih Pesan (Centang)</div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400">Pilih beberapa pesan untuk dihapus</div>
                              </div>
                            </button>

                            <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

                            <button
                              type="button"
                              onClick={() => {
                                setIsActionMenuOpen(false);
                                setBulkDeleteType('all');
                                setIsBulkDeleteModalOpen(true);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                              <div>
                                <div className="font-semibold text-red-600 dark:text-red-400">Hapus Semua</div>
                                <div className="text-[10px] text-red-500/80 dark:text-red-400/80">Kosongkan seluruh data aspirasi</div>
                              </div>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-red-50/40 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/50 rounded-2xl shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={
                            aspirations.length > 0 &&
                            aspirations.every((a) => selectedAspIds.includes(a.id))
                          }
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <span>Pilih Semua di Halaman Ini</span>
                      </label>
                      {selectedAspIds.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-xs font-extrabold border border-red-200 dark:border-red-800">
                          {selectedAspIds.length} Terpilih
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedAspIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setBulkDeleteType('selected');
                            setIsBulkDeleteModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Pesan Terpilih ({selectedAspIds.length})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedAspIds([]);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Batal Pilih</span>
                      </button>
                    </div>
                  </div>
                )}

                {aspirations.map((asp, index) => {
                  const displayNum = pagination?.total
                    ? pagination.total - ((pagination.page - 1) * pagination.limit + index)
                    : aspirations.length - index;
                  const isChecked = selectedAspIds.includes(asp.id);

                  return (
                    <div
                      key={asp.id}
                      className={`p-5 sm:p-6 bg-white dark:bg-zinc-900/90 border rounded-2xl transition-all hover:shadow-md space-y-3 ${
                        isSelectionMode && isChecked
                          ? 'border-red-300 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/10'
                          : 'border-slate-200/80 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                        <div className="flex items-center gap-3">
                          {isSelectionMode && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectOne(asp.id)}
                              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer animate-in fade-in duration-150"
                              title="Pilih aspirasi ini"
                            />
                          )}
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

                        <button
                          onClick={() => {
                            setDeleteAspId(asp.id);
                            setIsDeleteAspModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
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
          </div>
        )}

        {/* TAB 2: MANAJEMEN PENGGUNA */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-6 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Daftar Otoritas Pengguna Sistem
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Kelola akun Admin, Wakasek, dan Kepala Sekolah.
                </p>
              </div>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer select-none"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Pengguna</span>
              </button>
            </div>

            {isLoadingUsers ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Memuat daftar pengguna...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-950/80 border-b border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-6">USERNAME</th>
                        <th className="py-3.5 px-6">NAMA LENGKAP</th>
                        <th className="py-3.5 px-6">ROLE OTORITAS</th>
                        <th className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <span>PASSWORD</span>
                            <button
                              type="button"
                              onClick={toggleShowAllPasswords}
                              className="text-[10px] lowercase font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                              title={visiblePasswordUserIds.length === usersList.length ? 'Sembunyikan semua' : 'Tampilkan semua'}
                            >
                              {usersList.length > 0 && visiblePasswordUserIds.length === usersList.length ? (
                                <EyeOff className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-200" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </th>
                        <th className="py-3.5 px-6">STATUS</th>
                        <th className="py-3.5 px-6 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                            {u.username}
                            {u.is_super_admin && (
                              <span className="ml-2 text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase">
                                Admin Utama
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-800 dark:text-zinc-200 font-medium">
                            {u.name}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold tracking-wider text-slate-700 dark:text-zinc-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-zinc-200 select-all bg-slate-50 dark:bg-zinc-950/50 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                                {visiblePasswordUserIds.includes(u.id)
                                  ? u.password || '********'
                                  : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="p-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title={
                                  visiblePasswordUserIds.includes(u.id)
                                    ? 'Sembunyikan password'
                                    : 'Lihat password'
                                }
                              >
                                {visiblePasswordUserIds.includes(u.id) ? (
                                  <EyeOff className="w-3.5 h-3.5 text-slate-800 dark:text-zinc-200" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditUser(u);
                                  setIsEditUserOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                title="Edit Username, Nama, Role & Password"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Pengguna</span>
                              </button>

                              {!u.is_super_admin && (
                                <button
                                  onClick={() => {
                                    setDeleteUserId(u.id);
                                    setDeleteUserName(u.name);
                                    setIsDeleteUserModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      {/* Delete Aspiration Modal */}
      <ConfirmModal
        isOpen={isDeleteAspModalOpen}
        title="Hapus Aspirasi?"
        message="Apakah Anda yakin ingin menghapus aspirasi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Aspirasi"
        isDangerous={true}
        isLoading={isDeletingAsp}
        onConfirm={handleConfirmDeleteAsp}
        onCancel={() => setIsDeleteAspModalOpen(false)}
      />

      {/* Bulk Delete Aspiration Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title={
          bulkDeleteType === 'all'
            ? 'Konfirmasi Hapus ALL Pesan Aspirasi'
            : 'Konfirmasi Hapus Massal Aspirasi'
        }
        message={
          bulkDeleteType === 'all'
            ? 'PERINGATAN SANGAT PENTING: Apakah Anda benar-benar yakin ingin menghapus SELURUH pesan aspirasi yang ada di sistem? Semua data arsip aspirasi akan dihapus permanen dan tindakan ini tidak dapat dibatalkan.'
            : `Apakah Anda yakin ingin menghapus ${selectedAspIds.length} pesan aspirasi yang dipilih? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={bulkDeleteType === 'all' ? 'Ya, Hapus SEMUA' : 'Ya, Hapus Terpilih'}
        isDangerous={true}
        isLoading={isBulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => {
          setIsBulkDeleteModalOpen(false);
          setBulkDeleteType(null);
        }}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSuccess={loadUsers}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editUser}
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        onSuccess={loadUsers}
      />

      {/* Edit Password Modal */}
      <EditPasswordModal
        userId={editPassUser?.id || null}
        userName={editPassUser?.name || ''}
        isOpen={isEditPassOpen}
        onClose={() => setIsEditPassOpen(false)}
      />

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={isDeleteUserModalOpen}
        title="Hapus Pengguna?"
        message={`Apakah Anda yakin ingin menghapus pengguna "${deleteUserName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Pengguna"
        isDangerous={true}
        isLoading={isDeletingUser}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setIsDeleteUserModalOpen(false)}
      />

      <Footer />
    </div>
  );
};
