'use client';

import React, { useEffect } from 'react';

export default function ApplicationsDashboard() {
  useEffect(() => {
    // Garante que não há scroll na página
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Limpa ao desmontar
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div 
      className="w-full h-screen"
      style={{
        position: 'fixed',
        top: '56px', // Altura da navbar
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/CAPA.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        zIndex: 1
      }}
    >
    </div>
  );
} 