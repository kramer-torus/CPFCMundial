'use client';
import { useState } from 'react';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminPinModal({ onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const correct = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';
    if (pin === correct) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-navy border border-gold/30 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gold mb-2">Admin Access</h2>
        <p className="text-white/70 text-sm mb-4">Enter PIN to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false); }}
            className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-center text-2xl tracking-widest text-white mb-3 focus:outline-none focus:border-gold"
            placeholder="••••"
            autoFocus
          />
          {error && <p className="text-palace-red text-sm mb-3 text-center">Incorrect PIN. Try again.</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
