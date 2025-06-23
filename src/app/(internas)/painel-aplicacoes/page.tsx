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
    <>
      <style jsx global>{`
        .bg-mobile-responsive {
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
        }
        
        @media (max-width: 768px) {
          .bg-mobile-responsive {
            background-size: cover !important;
            background-position: center top !important;
            background-attachment: scroll !important;
          }
        }
        
        @media (max-width: 480px) {
          .bg-mobile-responsive {
            background-size: 100% auto !important;
            background-position: center top !important;
          }
        }
      `}</style>
      
      <div 
        className="w-full h-screen bg-mobile-responsive"
        style={{
          position: 'fixed',
          top: '56px', // Altura da navbar
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/CAPA.png)',
          zIndex: 1
        }}
      >
      </div>
    </>
  );
} 