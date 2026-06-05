import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'CPFCMundial',
  description: 'Glad All Over the World — CPFC 2026 World Cup Draft Game',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CPFCMundial',
  },
};

export const viewport: Viewport = {
  themeColor: '#C4122E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="bg-navy text-white min-h-screen pb-20">
        <main className="max-w-lg mx-auto px-4 pt-4">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
