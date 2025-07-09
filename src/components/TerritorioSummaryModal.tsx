'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, Users, MapPin } from 'lucide-react';

interface ProjecaoMunicipio {
  municipio: string;
  liderancasAtuais: number;
  votacao2022: number;
  expectativa2026: number;
  crescimento: number;
  eleitores: number;
  alcance: number;
}

interface ResultadoEleicao {
  municipio: string;
  nomeUrnaCandidato: string;
  quantidadeVotosNominais: string;
  partido: string;
}

interface TerritorioSummaryModalProps {
  territorio: string | null;
  municipios: string[];
  dadosProjecao: ProjecaoMunicipio[];
  dadosEleicoes2022: ResultadoEleicao[];
  onClose: () => void;
}

export default function TerritorioSummaryModal({ 
  territorio, 
  municipios, 
  dadosProjecao, 
  dadosEleicoes2022, 
  onClose 
}: TerritorioSummaryModalProps) {
  console.log('TerritorioSummaryModal renderizado:', { territorio, municipios: municipios.length, dadosProjecao: dadosProjecao.length, dadosEleicoes2022: dadosEleicoes2022.length });
  
  const [summaryData, setSummaryData] = useState<{
    totalMunicipios: number;
    totalVotacao2022: number;
    totalExpectativa2026: number;
    crescimentoMedio: number;
    totalLiderancas: number;
    topCandidatos: Array<{
      nome: string;
      partido: string;
      votos: number;
      municipios: string[];
    }>;
  } | null>(null);

  useEffect(() => {
    if (!territorio || municipios.length === 0) return;

    // Normalizar nomes para comparação
    const normalizeString = (str: string): string => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
    };

    // Filtrar dados de projeção para o território
    const projecoesTerritorio = dadosProjecao.filter(p => 
      municipios.some(m => normalizeString(m) === normalizeString(p.municipio))
    );

    // Calcular totais
    const totalVotacao2022 = projecoesTerritorio.reduce((sum, p) => sum + p.votacao2022, 0);
    const totalExpectativa2026 = projecoesTerritorio.reduce((sum, p) => sum + p.expectativa2026, 0);
    const totalLiderancas = projecoesTerritorio.reduce((sum, p) => sum + p.liderancasAtuais, 0);
    const crescimentoMedio = projecoesTerritorio.length > 0 
      ? projecoesTerritorio.reduce((sum, p) => sum + p.crescimento, 0) / projecoesTerritorio.length 
      : 0;

    // Agregar candidatos por nome e partido
    const candidatosMap = new Map<string, {
      nome: string;
      partido: string;
      votos: number;
      municipios: Set<string>;
    }>();

    dadosEleicoes2022.forEach(eleicao => {
      if (municipios.some(m => normalizeString(m) === normalizeString(eleicao.municipio))) {
        const key = `${eleicao.nomeUrnaCandidato}-${eleicao.partido}`;
        const votos = parseInt(eleicao.quantidadeVotosNominais) || 0;
        
        if (candidatosMap.has(key)) {
          const existing = candidatosMap.get(key)!;
          existing.votos += votos;
          existing.municipios.add(eleicao.municipio);
        } else {
          candidatosMap.set(key, {
            nome: eleicao.nomeUrnaCandidato,
            partido: eleicao.partido,
            votos: votos,
            municipios: new Set([eleicao.municipio])
          });
        }
      }
    });

    // Top 5 candidatos no território
    const topCandidatos = Array.from(candidatosMap.values())
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 5)
      .map(c => ({
        nome: c.nome,
        partido: c.partido,
        votos: c.votos,
        municipios: Array.from(c.municipios)
      }));

    setSummaryData({
      totalMunicipios: municipios.length,
      totalVotacao2022,
      totalExpectativa2026,
      crescimentoMedio,
      totalLiderancas,
      topCandidatos
    });
  }, [territorio, municipios, dadosProjecao, dadosEleicoes2022]);

  const formatNumber = (value: number): string => {
    return value.toLocaleString('pt-BR');
  };

  if (!territorio || !summaryData) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10000 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Resumo da Projeção 2026</h2>
            <p className="text-xs text-gray-600">{territorio}</p>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-gray-100 p-1 rounded-full transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Métricas gerais */}
        <div className="p-3 border-b">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-base font-semibold text-gray-800">{summaryData.totalMunicipios}</div>
              <div className="text-xs text-gray-600">Municípios</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-base font-semibold text-gray-800">{formatNumber(summaryData.totalLiderancas)}</div>
              <div className="text-xs text-gray-600">Lideranças</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-base font-semibold text-gray-800">{formatNumber(summaryData.totalVotacao2022)}</div>
              <div className="text-xs text-gray-600">Votos 2022</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-base font-semibold text-gray-800">{formatNumber(summaryData.totalExpectativa2026)}</div>
              <div className="text-xs text-gray-600">Expectativa 2026</div>
            </div>
          </div>
          
          <div className="text-center p-2 bg-green-50 rounded border border-green-200">
            <div className="text-base font-semibold text-green-700">
              +{summaryData.crescimentoMedio.toFixed(1)}%
            </div>
            <div className="text-xs text-green-600">Crescimento Médio</div>
          </div>
        </div>

        {/* Top 5 candidatos */}
        <div className="p-3">
          <h3 className="text-xs font-semibold mb-2 text-gray-700">Top 5 Candidatos em 2022</h3>
          <div className="space-y-1">
            {summaryData.topCandidatos.map((candidato, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">
                    {index + 1}º {candidato.nome}
                  </div>
                  <div className="text-xs text-gray-600">
                    {candidato.partido} • {candidato.municipios.length} mun.
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-xs font-semibold text-gray-800">{formatNumber(candidato.votos)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 