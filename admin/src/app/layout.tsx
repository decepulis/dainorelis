import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Dainorėlis admin',
  description: 'Song database for the Dainorėlis app',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt">
      <body>{children}</body>
    </html>
  );
}
