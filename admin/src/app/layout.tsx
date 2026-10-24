import type { Metadata, Viewport } from 'next';

import { brandFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dainorėlis admin',
  description: 'Song database for the Dainorėlis app',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#508062' },
    { media: '(prefers-color-scheme: dark)', color: '#53745e' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" className={brandFont.variable}>
      <body>{children}</body>
    </html>
  );
}
