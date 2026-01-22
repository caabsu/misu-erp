import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { DevTools } from '@/components/dev/dev-tools';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Misu ERP',
  description: 'Internal operations management for Misu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 pl-16 lg:pl-64">
              <div className="container mx-auto max-w-7xl p-6">{children}</div>
            </main>
          </div>
          <DevTools />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
