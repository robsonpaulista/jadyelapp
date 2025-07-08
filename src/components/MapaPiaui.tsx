import React, { useCallback, useState } from 'react';
import MapaPiauiSVG from './MapaPiauiSVG';

interface ProjecaoMunicipio {
  municipio: string;
  liderancasAtuais: number;
  votacao2022: number;
  expectativa2026: number;
  crescimento: number;
  eleitores: number;
  alcance: number;
}

interface MapaPiauiProps {
  projecoes: ProjecaoMunicipio[];
}

// Função para determinar a cor do município conforme o crescimento
function getCorCrescimento(crescimento: number): string {
  if (crescimento > 20) return '#004d00'; // Verde muito escuro: crescimento muito expressivo
  if (crescimento > 10) return '#00b300'; // Verde forte: crescimento expressivo  
  if (crescimento > 5) return '#33cc33'; // Verde médio: crescimento moderado
  if (crescimento > 0) return '#66ff66'; // Verde claro: crescimento leve
  if (crescimento === 0) return '#ffcc00'; // Amarelo: estável
  if (crescimento > -5) return '#ff9900'; // Laranja: queda leve
  if (crescimento > -10) return '#ff6600'; // Laranja escuro: queda moderada
  return '#cc0000'; // Vermelho: queda expressiva
}

// Mapeamento simplificado dos principais municípios
const municipiosSVG: { [key: string]: string } = {
  'teresina': 'TERESINA',
  'parnaiba': 'PARNAÍBA',
  'picos': 'PICOS',
  'floriano': 'FLORIANO',
  'piripiri': 'PIRIPIRI',
  'campomaior': 'CAMPO MAIOR',
  'barras': 'BARRAS',
  'uniao': 'UNIÃO',
  'altos': 'ALTOS',
  'josedefreitas': 'JOSÉ DE FREITAS',
  'esperantina': 'ESPERANTINA',
  'luiscorreia': 'LUÍS CORREIA',
  'piracuruca': 'PIRACURUCA',
  'batalha': 'BATALHA',
  'oeiras': 'OEIRAS',
  'saoraimundononato': 'SÃO RAIMUNDO NONATO',
  'bomjesus': 'BOM JESUS',
  'corrente': 'CORRENTE',
  'urucui': 'URUÇUÍ',
  'cocal': 'COCAL',
  'pedroii': 'PEDRO II',
  'aguabranca': 'ÁGUA BRANCA',
  'miguelalves': 'MIGUEL ALVES',
  'valencadopiaui': 'VALENÇA DO PIAUÍ',
  'regeneracao': 'REGENERAÇÃO'
};

// Função para obter nome do município pelo ID do SVG
function getNomeMunicipioPorId(idSVG: string): string | null {
  return municipiosSVG[idSVG] || null;
}

const MapaPiaui: React.FC<MapaPiauiProps> = ({ projecoes }) => {
  console.log('🗺️ MapaPiaui renderizado com', projecoes.length, 'projeções');

  // Função para colorir cada município usando IDs do SVG
  const getFill = useCallback((idSVG: string) => {
    const nomeMunicipio = getNomeMunicipioPorId(idSVG);
    
    if (!nomeMunicipio) {
      return '#e0e0e0'; // Cinza para IDs não mapeados
    }

    const projecao = projecoes.find(p => 
      p.municipio.toUpperCase().trim() === nomeMunicipio.trim()
    );

    if (!projecao) {
      return '#f5f5f5'; // Cinza claro para municípios sem dados
    }

    const cor = getCorCrescimento(projecao.crescimento);
    return cor;
  }, [projecoes]);

  // Função para obter dados do município para tooltips
  const getData = useCallback((idSVG: string) => {
    const nomeMunicipio = getNomeMunicipioPorId(idSVG);
    
    if (!nomeMunicipio) {
      return null;
    }

    const projecao = projecoes.find(p => 
      p.municipio.toUpperCase().trim() === nomeMunicipio.trim()
    );

    return projecao || null;
  }, [projecoes]);

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-center">Mapa de Projeção Eleitoral 2026</h3>
        
        {/* Status dos dados */}
        <div className="mb-4">
          {projecoes.length === 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm text-orange-700">
              <strong>⏳ Carregando dados...</strong> Aguardando informações da API
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
              <strong>✅ Dados carregados:</strong> {projecoes.length} municípios com projeções
            </div>
          )}
        </div>
        
        {/* Legenda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#004d00] rounded"></div>
            <span>Muito Alto (&gt;20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#00b300] rounded"></div>
            <span>Alto (10-20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#33cc33] rounded"></div>
            <span>Moderado (5-10%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#66ff66] rounded"></div>
            <span>Baixo (0-5%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#ffcc00] rounded"></div>
            <span>Estável (0%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#ff9900] rounded"></div>
            <span>Queda Leve (-5%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#ff6600] rounded"></div>
            <span>Queda Moderada (-10%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#cc0000] rounded"></div>
            <span>Queda Alta (&lt;-10%)</span>
          </div>
        </div>
        
        {/* Mapa SVG */}
        <div className="w-full overflow-auto relative">
          <MapaPiauiSVG 
            getFill={getFill} 
            getData={getData}
          />
        </div>
        
        {/* Resumo dos dados */}
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            {projecoes.length > 0 && (
              <>
                <span className="font-medium">{projecoes.length}</span> municípios mapeados • 
                <span className="font-medium"> {projecoes.filter(p => p.crescimento > 0).length}</span> em crescimento • 
                <span className="font-medium"> {projecoes.filter(p => p.crescimento < 0).length}</span> em queda
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaPiaui;
