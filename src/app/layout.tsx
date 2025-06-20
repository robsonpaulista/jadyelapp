import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import { disableConsoleLogging } from '@/lib/logger';

// Carregamento otimizado da fonte
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: {
    default: 'Portal de Aplicações',
    template: '%s | Portal de Aplicações'
  },
  description: 'Sistema de gerenciamento do Portal de Aplicações',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Desabilitar logs globalmente para proteção de dados
  if (typeof window !== 'undefined') {
    disableConsoleLogging();
  }
  
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body suppressHydrationWarning className={`${inter.className} antialiased bg-white`}>
        <div className="min-h-screen">
          <Providers>
            {children}
          </Providers>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 2000,
              style: {
                background: '#ffffff',
                color: '#333333',
                fontSize: '0.75rem',
                maxWidth: '280px',
                padding: '8px 12px',
                borderRadius: '6px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f0f0f0'
              },
              success: {
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#ffffff'
                }
              },
              error: {
                iconTheme: {
                  primary: '#f87171',
                  secondary: '#ffffff'
                }
              }
            }}
          />
        </div>
      </body>
    </html>
  );
} 