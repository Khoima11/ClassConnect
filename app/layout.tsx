import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClassConnect',
  description: 'Media integrasi informasi siswa, guru, orang tua, dan madrasah',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1e3a5f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
