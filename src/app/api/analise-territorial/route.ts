import { NextResponse } from 'next/server';
import { buscarDadosIBGEBatch } from '@/services/analiseTerritorioService';

// Lista de municípios do Piauí para teste
const MUNICIPIOS_PIAUI = [
  '2200053', // Acauã
  '2200103', // Agricolândia
  '2200202', // Água Branca
  '2200251', // Alagoinha do Piauí
  '2200277', // Alegrete do Piauí
  // Adicionar mais municípios conforme necessário
];

export async function GET() {
  try {
    // Buscar dados do IBGE para os municípios do Piauí
    const dadosIBGE = await buscarDadosIBGEBatch(MUNICIPIOS_PIAUI);

    // Calcular métricas
    const populacaoTotal = dadosIBGE.reduce((acc, m) => acc + m.populacao, 0);
    const areaTotal = dadosIBGE.reduce((acc, m) => acc + m.area, 0);
    const densidadeMedia = populacaoTotal / areaTotal;

    const mockData = {
      success: true,
      data: {
        municipios: dadosIBGE.map(m => ({
          id: m.municipio.id,
          nome: m.municipio.nome,
          demografia: {
            populacao: m.populacao,
            densidade: m.densidade
          },
          emendas: {
            valorTotal: 0, // Será preenchido com dados reais depois
            valorPerCapita: 0,
            percentualPago: 0,
            quantidadeEmendas: 0
          }
        })),
        metricas: {
          cobertura: {
            municipiosAtendidos: dadosIBGE.length,
            percentualMunicipios: (dadosIBGE.length / MUNICIPIOS_PIAUI.length) * 100,
            populacaoAtingida: populacaoTotal,
            percentualPopulacao: 100 // Será calculado em relação ao total do estado depois
          },
          investimento: {
            valorTotalEmendas: 150000000,
            mediaPerCapita: 250.45,
            indiceConcentracao: 0.45
          },
          execucao: {
            percentualEmpenhado: 65.4,
            percentualPago: 45.2,
            tempoMedioExecucao: 120
          },
          baseEleitoral: {
            overlapTop30: 85.5,
            crescimentoNovasBases: 15.2
          }
        }
      }
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Erro na API de análise territorial:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 