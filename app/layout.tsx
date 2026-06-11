import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

export const metadata: Metadata = {
  metadataBase: new URL('https://cpfc-mundial.vercel.app'),
  title: 'CPFCMundial',
  description: 'Glad All Over the World — CPFC 2026 World Cup Draft Game',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CPFCMundial' },
  openGraph: {
    title: 'CPFCMundial',
    description: 'Glad All Over the World — our CPFC 2026 World Cup draft game. Pick your nations, track your points, glory awaits.',
    url: 'https://cpfc-mundial.vercel.app',
    siteName: 'CPFCMundial',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'CPFCMundial', description: 'Glad All Over the World — CPFC 2026 World Cup Draft Game' },
};

export const viewport: Viewport = {
  themeColor: '#C4122E', width: 'device-width', initialScale: 1, maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link rel="apple-touch-icon" href="/icons/icon.svg" /></head>
      <body className="bg-bg-base text-white min-h-screen">
        <Header />
        <main className="max-w-lg mx-auto px-4 pt-4 pb-24">{children}</main>
        <BottomNav />
        <div className="text-center text-white/15 text-[10px] pb-1">v5.1</div>
      </body>
    </html>
  );
}
