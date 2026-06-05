'use client';
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = 'https://cpfc-mundial.vercel.app';
    const text = `Join CPFCMundial — our CPFC 2026 World Cup draft game. Pick your nations, track your points, glory awaits. ${url}`;
    if (navigator.share) {
      await navigator.share({ title: 'CPFCMundial', text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-24 right-4 z-40 bg-gold text-navy font-bold rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      aria-label="Share"
    >
      {copied ? <Check size={22} /> : <Share2 size={22} />}
    </button>
  );
}
