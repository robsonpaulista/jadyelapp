import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ message = "Carregando...", size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${sizeClasses[size]}`}
          style={{
            animationDuration: '0.8s',
            animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
        {message && (
          <p className="mt-2 text-sm text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

// Componente de loading otimizado para páginas
export function PageLoading({ message = "Carregando página..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading message={message} size="lg" />
    </div>
  );
}

// Componente de loading otimizado para componentes
export function ComponentLoading({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loading message={message} size="md" />
    </div>
  );
} 