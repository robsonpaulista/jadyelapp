import React from 'react';
import './loading.css';

interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = 'Carregando...', className = '' }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Spinner animado */}
      <div className="relative w-12 h-12">
        {/* Círculo base */}
        <div className="absolute inset-0 border-3 border-gray-100 rounded-full"></div>
        {/* Círculo animado */}
        <div className="absolute inset-0 border-3 border-blue-500 rounded-full loading-spin border-t-transparent"></div>
        {/* Círculo interno pulsante */}
        <div className="absolute inset-2 bg-blue-50 rounded-full loading-pulse"></div>
      </div>
      
      {/* Mensagem de loading com animação suave */}
      <div className="mt-3 text-sm text-gray-600 loading-pulse font-medium">
        {message}
      </div>
    </div>
  );
}

export function LoadingOverlay({ message, className = '' }: LoadingProps) {
  return (
    <div className="fixed inset-0 bg-white/80 loading-blur-in z-50 flex items-center justify-center">
      <Loading message={message} className={className} />
    </div>
  );
}

export function LoadingCard({ message, className = '' }: LoadingProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <Loading message={message} className={className} />
    </div>
  );
} 