'use client';
import { useEffect } from 'react';

interface ConfirmSheetProps {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmSheet({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false }: ConfirmSheetProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70" onClick={onCancel}>
      <div
        className="w-full max-w-lg bg-bg-card border border-white/10 rounded-t-2xl p-6 pb-28 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-white/60 text-sm mb-6">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-ghost">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={`flex-1 font-bold py-3 px-5 rounded-xl transition-all active:scale-95 text-sm ${danger ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
