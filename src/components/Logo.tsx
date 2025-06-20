import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ 
  size = 120, 
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo externo */}
      <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="4" />
      
      {/* Íris do olho */}
      <circle cx="100" cy="100" r="40" fill="#3B82F6" />
      
      {/* Pupila */}
      <circle cx="100" cy="100" r="20" fill="#1E40AF" />
      
      {/* Reflexo de luz */}
      <circle cx="85" cy="85" r="8" fill="white" />
      
      {/* Linhas de cílios estilizadas */}
      <path
        d="M30 100 L60 100"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M140 100 L170 100"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M100 30 L100 60"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M100 140 L100 170"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Linhas diagonais */}
      <path
        d="M50 50 L70 70"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M130 70 L150 50"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M50 150 L70 130"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M130 130 L150 150"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo; 