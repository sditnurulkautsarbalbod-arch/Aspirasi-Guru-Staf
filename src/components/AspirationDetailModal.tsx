import React, { useState, useEffect } from 'react';
import { Aspiration, AspirationStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { X, Calendar, Clock, MessageSquare, FileText, Save, Loader2 } from 'lucide-react';

interface AspirationDetailModalProps {
  aspiration: Aspiration | null;
  displayNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, status: AspirationStatus, admin_note: string) => Promise<boolean>;
}

export const AspirationDetailModal: React.FC<AspirationDetailModalProps> = ({
  aspiration,
  displayNumber,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AspirationStatus>('BARU');
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (aspiration) {
      setSelectedStatus(aspiration.status);
      setAdminNote(aspiration.admin_note || '');
    }
  }, [aspiration]);

  if (!isOpen || !aspiration) return null;

  const formatDateIndonesian = (dateStr: string) => {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateFormatted, timeFormatted };
  };

  const { dateFormatted, timeFormatted } = formatDateIndonesian(aspiration.created_at);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await onSave(aspiration.id, selectedStatus, adminNote.trim());
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  const statusOptions: { value: AspirationStatus; label: string }[] = [
    { value: 'BARU', label: 'BARU' },
    { value: 'DITINJAU', label: 'DITINJAU' },
    { value: 'DITINDAKLANJUTI', label: 'DITINDAKLANJUTI' },
    { value: 'SELESAI', label: 'SELESAI' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Aspirasi Rekaman #{displayNumber ?? aspiration.id}
              </h2>
              <StatusBadge status={aspiration.status} size="sm" />
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {dateFormatted}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                pukul {timeFormatted} WITA
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Aspiration Message Box */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Isi Naskah Aspirasi / Umpan Balik</span>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
              {aspiration.message}
            </div>
          </div>

          {/* Tindak Lanjut Form */}
          <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Evaluasi & Tindak Lanjut Pengelola</span>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
                Ubah Status Progres
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statusOptions.map((opt) => (
                  <label key={opt.value} className="cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      value={opt.value}
                      checked={selectedStatus === opt.value}
                      onChange={() => setSelectedStatus(opt.value)}
                      className="sr-only peer"
                    />
                    <div className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-center text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all peer-checked:bg-slate-900 peer-checked:text-slate-100 dark:peer-checked:bg-slate-100 dark:peer-checked:text-slate-900 peer-checked:border-slate-900 dark:peer-checked:border-slate-100 shadow-2xs">
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Admin Note Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                Catatan Internal Tindak Lanjut
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Tuliskan catatan evaluasi / keputusan pimpinan di sini..."
                rows={4}
                disabled={isSaving}
                className="w-full p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-all font-sans"
              ></textarea>

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 font-semibold text-xs tracking-wide flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 select-none cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Evaluasi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
