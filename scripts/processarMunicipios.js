const fs = require('fs');
const path = require('path');

// Lê o arquivo de paths extraídos
const pathsFile = path.join(__dirname, '../src/components/paths-extraidos.txt');
const pathsContent = fs.readFileSync(pathsFile, 'utf-8');

// Extrai os paths usando regex
const pathRegex = /<path[^>]+id="([^"]+)"[^>]+d="([^"]+)"[^>]*\/>/g;
const municipios = [];
let match;

while ((match = pathRegex.exec(pathsContent)) !== null) {
  municipios.push({
    id: match[1],
    path: match[2]
  });
}

console.log(`Encontrados ${municipios.length} municípios`);

// Gera o componente React
const componentCode = `'use client';

import React, { useEffect, useRef } from 'react';

interface MapaPiauiSVGProps {
  getFill: (municipioId: string) => string;
}

const MapaPiauiSVG: React.FC<MapaPiauiSVGProps> = ({ getFill }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      const paths = svgRef.current.querySelectorAll('path');
      paths.forEach((path) => {
        const municipioId = path.id;
        if (municipioId) {
          const color = getFill(municipioId);
          path.setAttribute('fill', color);
        }
      });
    }
  }, [getFill]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200000 200000"
      className="w-full h-full"
      style={{ maxWidth: '800px', maxHeight: '600px' }}
    >
      ${municipios.map(municipio => 
        `<path
          id="${municipio.id}"
          className="municipio"
          d="${municipio.path}"
          fill="#ddd"
          stroke="#fff"
          strokeWidth="100"
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        />`
      ).join('\n      ')}
    </svg>
  );
};

export default MapaPiauiSVG;
`;

// Salva o componente
const componentPath = path.join(__dirname, '../src/components/MapaPiauiSVG.tsx');
fs.writeFileSync(componentPath, componentCode);

console.log(`Componente salvo em: ${componentPath}`);
console.log(`Municípios processados: ${municipios.length}`); 