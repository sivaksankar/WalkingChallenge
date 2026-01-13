// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import AuthCodeHandler from './components/AuthCodeHandler';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthCodeHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}