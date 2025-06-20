import { Toaster } from 'react-hot-toast';
import { Providers } from '../providers';

export default function PainelAplicacoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
} 