'use client';
import { useState } from 'react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.origin;
    const text = `Join CPFCMundial — our CPFC World Cup draft game 🦅⚽ ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CPFCMundial', text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled share
    }
  }

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-24 right-4 z-40 bg-gold text-navy font-bold rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-xl active:scale-95 transition-transform"
      aria-label="Share app"
    >
      {copied ? '✓' : '📤'}
    </button>
  );
}
