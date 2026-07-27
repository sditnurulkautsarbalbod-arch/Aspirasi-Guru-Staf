import React, { useState } from 'react';
import { apiRequest } from '../lib/api';
import { Send, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const AspirationForm: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const trimmedLength = message.trim().length;
  const rawLength = message.length;
  const maxLength = 5000;
  const minLength = 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const trimmed = message.trim();

    if (!trimmed) {
      setErrorText('Isi aspirasi tidak boleh hanya berisi spasi.');
      return;
    }

    if (trimmed.length < minLength) {
      setErrorText(`Isi aspirasi terlalu singkat. Minimal ${minLength} karakter.`);
      return;
    }

    if (rawLength > maxLength) {
      setErrorText(`Isi aspirasi melebihi batas ${maxLength} karakter.`);
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/aspirations', {
      method: 'POST',
      body: JSON.stringify({ message: trimmed }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsSubmitted(true);
      setMessage('');
    } else {
      setErrorText(res.error || 'Maaf, aspirasi belum dapat dikirim. Silakan coba kembali beberapa saat lagi.');
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setMessage('');
    setErrorText(null);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl text-center transition-all animate-fadeIn">
        <div className="w-16 h-16 mx-auto mb-6 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] font-semibold tracking-wider text-slate-600 dark:text-zinc-400 uppercase mb-4">
          Konfirmasi Penerimaan
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
          Terima Kasih Atas Masukan Anda
        </h2>

        <p className="text-base text-slate-600 dark:text-zinc-300 mb-6 max-w-lg mx-auto">
          Aspirasi Anda telah tercatat dengan aman dan anonim dalam data evaluasi internal SD IT Nurul Kautsar.
        </p>

        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-xl mx-auto bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-700/40">
          Setiap masukan, kritik, saran, maupun apresiasi dikaji secara langsung oleh kepala sekolah dan wakil kepala sekolah bidang kurikulum untuk perbaikan berkelanjutan.
        </p>

        <button
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Kirim Aspirasi Baru</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-6 sm:my-10 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden transition-all backdrop-blur-sm">
      {/* Top Header Banner */}
      <div className="p-6 sm:p-10 border-b border-slate-200/80 dark:border-zinc-800 bg-linear-to-b from-slate-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          Kotak Aspirasi Guru & Staf
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed mb-6">
          Sampaikan pertanyaan, kritik, saran, apresiasi, atau umpan balik mengenai kondisi dan profesionalisme rekan kerja untuk keberlanjutan dan kualitas lingkungan kerja SD IT Nurul Kautsar.
        </p>

        <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-3 text-xs font-medium text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Sistem menjamin kerahasiaan penuh. Identitas perangkat & pengirim tidak pernah direkam.</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6">
        {errorText && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200 text-xs sm:text-sm font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Isi Aspirasi / Umpan Balik <span className="text-red-500">*</span>
            </label>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              Kerahasiaan Terjamin
            </span>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tuliskan pertanyaan, aspirasi, kritik, saran, apresiasi, atau umpan balik Anda di sini secara bebas dan bertanggung jawab..."
            rows={8}
            disabled={isSubmitting}
            maxLength={maxLength}
            className="w-full p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-400 dark:focus:border-zinc-600 transition-all resize-y min-h-[180px] disabled:opacity-60 font-sans"
          ></textarea>

          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-zinc-400">
            <span>Batas minimal: 10 karakter</span>
            <span className={`font-semibold ${rawLength > maxLength ? 'text-red-600' : ''}`}>
              {rawLength} / {maxLength}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || trimmedLength < minLength || rawLength > maxLength}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-slate-100 dark:text-slate-900 font-semibold text-xs tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>MENGIRIM...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
