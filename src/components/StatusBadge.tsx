import React from 'react';
import { AspirationStatus } from '../types';

interface StatusBadgeProps {
  status: AspirationStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClasses = '';
  let label = status;
  let dotColor = '';

  switch (status) {
    case 'BARU':
      colorClasses = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50';
      dotColor = 'bg-amber-500';
      label = 'BARU';
      break;
    case 'DITINJAU':
      colorClasses = 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/50';
      dotColor = 'bg-sky-500';
      label = 'DITINJAU';
      break;
    case 'DITINDAKLANJUTI':
      colorClasses = 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/50';
      dotColor = 'bg-indigo-500';
      label = 'DITINDAKLANJUTI';
      break;
    case 'SELESAI':
      colorClasses = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50';
      dotColor = 'bg-emerald-500';
      label = 'SELESAI';
      break;
    default:
      colorClasses = 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700';
      dotColor = 'bg-slate-400';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-[10px] font-bold tracking-wider'
      : size === 'lg'
      ? 'px-3.5 py-1 text-xs font-bold tracking-wider'
      : 'px-3 py-0.5 text-[11px] font-bold tracking-wider';

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full select-none shadow-2xs ${colorClasses} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
