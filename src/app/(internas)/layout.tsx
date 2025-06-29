import Navbar from '../../components/Navbar';
import { Toaster } from 'react-hot-toast';
import { Providers } from '../providers';
import AuthGuard from '@/components/auth/AuthGuard';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function InternasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RouteGuard>
        <div className="min-h-screen">
          <Navbar />
          <Providers>
            <div className="pt-14">
              {children}
            </div>
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
      </RouteGuard>
    </AuthGuard>
  );
} 