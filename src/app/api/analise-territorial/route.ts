import { NextResponse } from 'next/server';
import { 
  buscarDadosIBGEBatch, 
  processarDadosEleitoraisBatch,
  buscarDadosPortalTransparenciaBatch,
  calcularMetricasExecucao,
  buscarDadosCAUCBatch,
  calcularRisco
} from '@/services/analiseTerritorioService';

// Lista de municípios do Piauí para teste
const MUNICIPIOS_PIAUI = [
  '2200053', // Acauã
  '2200103', // Agricolândia
  '2200202', // Água Branca
  '2200251', // Alagoinha do Piauí
  '2200277', // Alegrete do Piauí
  // Adicionar mais municípios conforme necessário
];

// Lista simulada de códigos de emendas
const EMENDAS_TESTE = [
  '202420000001',
  '202420000002',
  '202420000003',
  '202420000004',
  '202420000005'
];

export async function GET() {
  try {
    // Buscar dados do IBGE, eleitorais, execução e CAUC em paralelo
    const [dadosIBGE, dadosEleitorais, dadosExecucao, dadosCAUC] = await Promise.all([
      buscarDadosIBGEBatch(MUNICIPIOS_PIAUI),
      processarDadosEleitoraisBatch(MUNICIPIOS_PIAUI.map(m => m.toString())),
      buscarDadosPortalTransparenciaBatch(EMENDAS_TESTE),
      buscarDadosCAUCBatch(MUNICIPIOS_PIAUI)
    ]);

    // Calcular métricas
    const populacaoTotal = dadosIBGE.reduce((acc, m) => acc + m.populacao, 0);
    const areaTotal = dadosIBGE.reduce((acc, m) => acc + m.area, 0);
    const densidadeMedia = populacaoTotal / areaTotal;

    // Calcular métricas eleitorais
    const votosTotal = dadosEleitorais.reduce((acc, m) => acc + m.votosDeputado, 0);
    const mediaVotosPorMunicipio = votosTotal / dadosEleitorais.length;

    // Calcular métricas de execução
    const todasEmendas = Object.values(dadosExecucao).flat();
    const metricasExecucao = calcularMetricasExecucao(todasEmendas);

    // Agrupar emendas por município
    const emendasPorMunicipio = todasEmendas.reduce((acc, emenda) => {
      if (!acc[emenda.municipio]) {
        acc[emenda.municipio] = [];
      }
      acc[emenda.municipio].push(emenda);
      return acc;
    }, {} as { [municipio: string]: typeof todasEmendas });

    // Calcular métricas de risco
    const municipiosIrregulares = Object.values(dadosCAUC).filter(m => m.situacao === 'IRREGULAR').length;
    const percentualIrregulares = (municipiosIrregulares / Object.keys(dadosCAUC).length) * 100;

    const mockData = {
      success: true,
      data: {
        municipios: dadosIBGE.map(m => {
          const dadosEleitoraisMunicipio = dadosEleitorais.find(
            e => e.municipio === m.municipio.nome
          );

          const emendasMunicipio = emendasPorMunicipio[m.municipio.nome] || [];
          const metricasMunicipio = calcularMetricasExecucao(emendasMunicipio);

          const dadosCAUCMunicipio = dadosCAUC[m.municipio.id];
          const indicadorRisco = dadosCAUCMunicipio ? calcularRisco(dadosCAUCMunicipio) : null;

          return {
            id: m.municipio.id,
            nome: m.municipio.nome,
            demografia: {
              populacao: m.populacao,
              densidade: m.densidade
            },
            politica: dadosEleitoraisMunicipio ? {
              votosDeputado: dadosEleitoraisMunicipio.votosDeputado,
              ranking: dadosEleitoraisMunicipio.ranking,
              percentualVotos: dadosEleitoraisMunicipio.percentualVotos,
              crescimento: dadosEleitoraisMunicipio.crescimento
            } : null,
            emendas: {
              valorTotal: metricasMunicipio.valorTotal,
              valorPerCapita: m.populacao > 0 ? metricasMunicipio.valorTotal / m.populacao : 0,
              percentualPago: metricasMunicipio.percentualPago,
              quantidadeEmendas: emendasMunicipio.length,
              tempoMedioExecucao: metricasMunicipio.tempoMedioExecucao
            },
            risco: indicadorRisco ? {
              nivel: indicadorRisco.nivel,
              score: indicadorRisco.score,
              alertas: indicadorRisco.alertas,
              situacaoCAUC: dadosCAUCMunicipio.situacao,
              ultimaAtualizacao: dadosCAUCMunicipio.ultimaAtualizacao
            } : null
          };
        }),
        metricas: {
          cobertura: {
            municipiosAtendidos: dadosIBGE.length,
            percentualMunicipios: (dadosIBGE.length / MUNICIPIOS_PIAUI.length) * 100,
            populacaoAtingida: populacaoTotal,
            percentualPopulacao: 100 // Será calculado em relação ao total do estado depois
          },
          politica: {
            totalVotos: votosTotal,
            mediaVotosPorMunicipio,
            municipiosComVotos: dadosEleitorais.length,
            percentualMunicipiosComVotos: (dadosEleitorais.length / MUNICIPIOS_PIAUI.length) * 100
          },
          investimento: {
            valorTotalEmendas: metricasExecucao.valorTotal,
            mediaPerCapita: populacaoTotal > 0 ? metricasExecucao.valorTotal / populacaoTotal : 0,
            indiceConcentracao: 0.45 // TODO: Calcular índice de Gini
          },
          execucao: {
            percentualEmpenhado: metricasExecucao.percentualEmpenhado,
            percentualLiquidado: metricasExecucao.percentualLiquidado,
            percentualPago: metricasExecucao.percentualPago,
            tempoMedioExecucao: metricasExecucao.tempoMedioExecucao
          },
          risco: {
            municipiosIrregulares,
            percentualIrregulares,
            valorEmRisco: metricasExecucao.valorTotal * (percentualIrregulares / 100),
            tempoMedioRegularizacao: 15 // TODO: Calcular média real
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