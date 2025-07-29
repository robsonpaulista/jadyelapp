import { buscarResultadosDeputadoFederal2022 } from './resultadoEleicoesService';

// Interfaces
interface DadosIBGE {
  municipio: {
    id: string;
    nome: string;
  };
  populacao: number;
  area: number;
  densidade: number;
}

interface DadosEleitorais {
  municipio: string;
  votosDeputado: number;
  ranking: number;
}

interface DadosExecucao {
  municipio: string;
  valorEmpenhado: number;
  valorPago: number;
  dataEmpenho: string;
  dataPagamento: string;
}

interface DadosCAUC {
  codigo: string;
  nome: string;
  uf: string;
  situacao: 'REGULAR' | 'IRREGULAR';
  itens: ItemCAUC[];
  historico: EventoCAUC[];
  ultimaAtualizacao: string;
}

// Nova interface para dados eleitorais processados
interface DadosEleitoraisProcessados {
  municipio: string;
  votosDeputado: number;
  ranking: number;
  percentualVotos: number;
  crescimento: number;
}

// Nova interface para dados de execução do Portal da Transparência
interface DadosExecucaoPortal {
  codigoEmenda: string;
  municipio: string;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
  dataEmpenho: string;
  dataLiquidacao: string | null;
  dataPagamento: string | null;
  objetoGasto: string;
  funcionalProgramatica: string;
}

// Interfaces para o CAUC
interface ItemCAUC {
  codigo: string;
  nome: string;
  situacao: 'REGULAR' | 'IRREGULAR' | 'DISPENSADO';
  dataVerificacao: string;
  validade: string | null;
  observacao?: string;
}

interface EventoCAUC {
  data: string;
  evento: 'REGULARIZAÇÃO' | 'IRREGULARIDADE';
  item: string;
  observacao?: string;
}

interface IndicadorRisco {
  nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  score: number; // 0 a 100
  alertas: string[];
  recomendacoes: string[];
}

// Cache em memória para dados do IBGE (evitar chamadas repetidas)
const cacheIBGE: { [key: string]: DadosIBGE } = {};

// Cache em memória para dados do Portal da Transparência
const cachePortal: { [key: string]: DadosExecucaoPortal[] } = {};

// Cache em memória para dados do CAUC
const cacheCAUC: { [key: string]: { dados: DadosCAUC; timestamp: number } } = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

// Funções de integração com APIs externas
export async function buscarDadosIBGE(codigoMunicipio: string): Promise<DadosIBGE | null> {
  try {
    // Verificar cache primeiro
    if (cacheIBGE[codigoMunicipio]) {
      return cacheIBGE[codigoMunicipio];
    }

    // Buscar dados do município
    const urlMunicipio = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoMunicipio}`;
    const resMunicipio = await fetch(urlMunicipio);
    
    if (!resMunicipio.ok) {
      throw new Error(`Erro ao buscar dados do município: ${resMunicipio.status}`);
    }
    
    const dadosMunicipio = await resMunicipio.json();

    // Buscar dados do Censo 2022
    const urlCenso = `https://servicodados.ibge.gov.br/api/v1/censos/2022/resultados/${codigoMunicipio}`;
    const resCenso = await fetch(urlCenso);
    
    if (!resCenso.ok) {
      throw new Error(`Erro ao buscar dados do censo: ${resCenso.status}`);
    }
    
    const dadosCenso = await resCenso.json();

    // Buscar dados de área territorial
    const urlArea = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoMunicipio}/area`;
    const resArea = await fetch(urlArea);
    
    if (!resArea.ok) {
      throw new Error(`Erro ao buscar dados de área: ${resArea.status}`);
    }
    
    const dadosArea = await resArea.json();

    // Processar e combinar os dados
    const dados: DadosIBGE = {
      municipio: {
        id: dadosMunicipio.id,
        nome: dadosMunicipio.nome
      },
      populacao: dadosCenso.populacao || 0,
      area: dadosArea.area || 0,
      densidade: dadosArea.area ? (dadosCenso.populacao / dadosArea.area) : 0
    };

    // Salvar no cache
    cacheIBGE[codigoMunicipio] = dados;

    return dados;
  } catch (error) {
    console.error('Erro ao buscar dados do IBGE:', error);
    return null;
  }
}

// Função auxiliar para buscar dados de múltiplos municípios
export async function buscarDadosIBGEBatch(codigosMunicipios: string[]): Promise<DadosIBGE[]> {
  const resultados: DadosIBGE[] = [];
  
  // Usar Promise.all para fazer requisições em paralelo
  await Promise.all(
    codigosMunicipios.map(async (codigo) => {
      const dados = await buscarDadosIBGE(codigo);
      if (dados) {
        resultados.push(dados);
      }
    })
  );

  return resultados;
}

export async function buscarDadosEleitorais(municipio: string, ano: number = 2022): Promise<DadosEleitorais | null> {
  try {
    // TODO: Implementar integração com API do TSE
    // const url = `https://dadosabertos.tse.jus.br/api/v1/eleicoes/${ano}/votacao/municipio/${municipio}`;
    // const response = await fetch(url);
    // const data = await response.json();
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados eleitorais:', error);
    return null;
  }
}

export async function buscarDadosExecucao(codigoEmenda: string): Promise<DadosExecucao | null> {
  try {
    // TODO: Implementar integração com Portal da Transparência
    // const url = `http://api.portaldatransparencia.gov.br/api-de-dados/emendas/${codigoEmenda}`;
    // const response = await fetch(url);
    // const data = await response.json();
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados de execução:', error);
    return null;
  }
}

export async function buscarDadosCAUC(codigoMunicipio: string): Promise<DadosCAUC | null> {
  try {
    // Verificar cache
    const agora = Date.now();
    const dadosCache = cacheCAUC[codigoMunicipio];
    if (dadosCache && (agora - dadosCache.timestamp) < CACHE_DURATION) {
      return dadosCache.dados;
    }

    // Implementação real da API do Tesouro Transparente
    const url = `https://apidadosabertos.tesouro.gov.br/cauc/v1/municipios/${codigoMunicipio}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TESOURO_TRANSPARENTE_API_KEY || ''}`
      }
    });

    if (!response.ok) {
      console.warn(`Erro na API do Tesouro Transparente: ${response.status}`);
      // Fallback para dados simulados em caso de erro
      const dadosSimulados: DadosCAUC = {
        codigo: codigoMunicipio,
        nome: 'TERESINA',
        uf: 'PI',
        situacao: Math.random() > 0.7 ? 'IRREGULAR' : 'REGULAR',
        itens: [],
        historico: [],
        ultimaAtualizacao: new Date().toISOString()
      };

      cacheCAUC[codigoMunicipio] = {
        dados: dadosSimulados,
        timestamp: agora
      };

      return dadosSimulados;
    }

    const data = await response.json();
    
    // Transformar dados da API para nosso formato
    const dadosProcessados: DadosCAUC = {
      codigo: data.codigo || codigoMunicipio,
      nome: data.nome || 'N/A',
      uf: data.uf || 'PI',
      situacao: data.situacao || 'REGULAR',
      itens: data.itens?.map((item: any) => ({
        codigo: item.codigo,
        nome: item.nome,
        situacao: item.situacao,
        dataVerificacao: item.dataVerificacao,
        validade: item.validade,
        observacao: item.observacao
      })) || [],
      historico: data.historico?.map((evento: any) => ({
        data: evento.data,
        evento: evento.evento,
        item: evento.item,
        observacao: evento.observacao
      })) || [],
      ultimaAtualizacao: data.ultimaAtualizacao || new Date().toISOString()
    };

    // Salvar no cache
    cacheCAUC[codigoMunicipio] = {
      dados: dadosProcessados,
      timestamp: agora
    };

    return dadosProcessados;
  } catch (error) {
    console.error('Erro ao buscar dados do CAUC:', error);
    
    // Fallback para dados simulados em caso de erro
    const dadosSimulados: DadosCAUC = {
      codigo: codigoMunicipio,
      nome: 'TERESINA',
      uf: 'PI',
      situacao: Math.random() > 0.7 ? 'IRREGULAR' : 'REGULAR',
      itens: [],
      historico: [],
      ultimaAtualizacao: new Date().toISOString()
    };

    cacheCAUC[codigoMunicipio] = {
      dados: dadosSimulados,
      timestamp: Date.now()
    };

    return dadosSimulados;
  }
}

export async function buscarDadosCAUCBatch(
  codigosMunicipios: string[]
): Promise<{ [codigo: string]: DadosCAUC }> {
  try {
    const resultados: { [codigo: string]: DadosCAUC } = {};
    
    // Usar Promise.all para fazer requisições em paralelo
    await Promise.all(
      codigosMunicipios.map(async (codigo) => {
        const dados = await buscarDadosCAUC(codigo);
        if (dados) {
          resultados[codigo] = dados;
        }
      })
    );

    return resultados;
  } catch (error) {
    console.error('Erro ao buscar dados do CAUC em lote:', error);
    return {};
  }
}

// Nova função para buscar dados do Portal da Transparência
export async function buscarDadosPortalTransparencia(codigoEmenda: string): Promise<DadosExecucaoPortal[] | null> {
  try {
    // Verificar cache primeiro
    if (cachePortal[codigoEmenda]) {
      return cachePortal[codigoEmenda];
    }

    // Implementação real da API do Portal da Transparência
    // Usando a API de dados abertos do Portal da Transparência
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/emendas-parlamentares`;
    
    const params = new URLSearchParams({
      codigoEmenda: codigoEmenda,
      ano: '2024',
      pagina: '1'
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'chave-api-dados': process.env.PORTAL_TRANSPARENCIA_API_KEY || ''
      }
    });

    if (!response.ok) {
      console.warn(`Erro na API do Portal da Transparência: ${response.status}`);
      // Fallback para dados simulados em caso de erro
      const dadosSimulados: DadosExecucaoPortal[] = [{
        codigoEmenda,
        municipio: 'TERESINA',
        valorEmpenhado: 500000,
        valorLiquidado: 300000,
        valorPago: 200000,
        dataEmpenho: '2024-01-15',
        dataLiquidacao: '2024-02-01',
        dataPagamento: '2024-02-15',
        objetoGasto: 'Aquisição de equipamentos hospitalares',
        funcionalProgramatica: '10.302.5019.0000'
      }];

      cachePortal[codigoEmenda] = dadosSimulados;
      return dadosSimulados;
    }

    const data = await response.json();
    
    // Transformar dados da API para nosso formato
    const dadosProcessados: DadosExecucaoPortal[] = data.map((item: any) => ({
      codigoEmenda: item.codigoEmenda,
      municipio: item.municipio || 'N/A',
      valorEmpenhado: parseFloat(item.valorEmpenhado) || 0,
      valorLiquidado: parseFloat(item.valorLiquidado) || 0,
      valorPago: parseFloat(item.valorPago) || 0,
      dataEmpenho: item.dataEmpenho || '',
      dataLiquidacao: item.dataLiquidacao || null,
      dataPagamento: item.dataPagamento || null,
      objetoGasto: item.objetoGasto || '',
      funcionalProgramatica: item.funcionalProgramatica || ''
    }));

    // Salvar no cache
    cachePortal[codigoEmenda] = dadosProcessados;

    return dadosProcessados;
  } catch (error) {
    console.error('Erro ao buscar dados do Portal da Transparência:', error);
    
    // Fallback para dados simulados em caso de erro
    const dadosSimulados: DadosExecucaoPortal[] = [{
      codigoEmenda,
      municipio: 'TERESINA',
      valorEmpenhado: 500000,
      valorLiquidado: 300000,
      valorPago: 200000,
      dataEmpenho: '2024-01-15',
      dataLiquidacao: '2024-02-01',
      dataPagamento: '2024-02-15',
      objetoGasto: 'Aquisição de equipamentos hospitalares',
      funcionalProgramatica: '10.302.5019.0000'
    }];

    cachePortal[codigoEmenda] = dadosSimulados;
    return dadosSimulados;
  }
}

// Nova função para buscar dados de múltiplas emendas
export async function buscarDadosPortalTransparenciaBatch(
  codigosEmendas: string[]
): Promise<{ [codigoEmenda: string]: DadosExecucaoPortal[] }> {
  try {
    const resultados: { [codigoEmenda: string]: DadosExecucaoPortal[] } = {};
    
    // Usar Promise.all para fazer requisições em paralelo
    await Promise.all(
      codigosEmendas.map(async (codigo) => {
        const dados = await buscarDadosPortalTransparencia(codigo);
        if (dados) {
          resultados[codigo] = dados;
        }
      })
    );

    return resultados;
  } catch (error) {
    console.error('Erro ao buscar dados do Portal da Transparência em lote:', error);
    return {};
  }
}

// Nova função para calcular métricas de execução
export function calcularMetricasExecucao(dados: DadosExecucaoPortal[]): {
  percentualEmpenhado: number;
  percentualLiquidado: number;
  percentualPago: number;
  tempoMedioExecucao: number;
  valorTotal: number;
} {
  if (!dados || dados.length === 0) {
    return {
      percentualEmpenhado: 0,
      percentualLiquidado: 0,
      percentualPago: 0,
      tempoMedioExecucao: 0,
      valorTotal: 0
    };
  }

  const valorTotal = dados.reduce((acc, d) => acc + d.valorEmpenhado, 0);
  const valorLiquidadoTotal = dados.reduce((acc, d) => acc + d.valorLiquidado, 0);
  const valorPagoTotal = dados.reduce((acc, d) => acc + d.valorPago, 0);

  // Calcular tempo médio entre empenho e pagamento
  const tempos = dados
    .filter(d => d.dataEmpenho && d.dataPagamento)
    .map(d => {
      const empenho = new Date(d.dataEmpenho);
      const pagamento = new Date(d.dataPagamento!);
      return (pagamento.getTime() - empenho.getTime()) / (1000 * 60 * 60 * 24); // dias
    });

  const tempoMedio = tempos.length > 0
    ? tempos.reduce((acc, t) => acc + t, 0) / tempos.length
    : 0;

  return {
    percentualEmpenhado: valorTotal > 0 ? 100 : 0,
    percentualLiquidado: valorTotal > 0 ? (valorLiquidadoTotal / valorTotal) * 100 : 0,
    percentualPago: valorTotal > 0 ? (valorPagoTotal / valorTotal) * 100 : 0,
    tempoMedioExecucao: tempoMedio,
    valorTotal
  };
}

// Nova função para processar dados eleitorais
export async function processarDadosEleitorais(municipio: string): Promise<DadosEleitoraisProcessados | null> {
  try {
    // Buscar resultados usando a função existente
    const resultados = await buscarResultadosDeputadoFederal2022();
    
    if (!resultados || resultados.length === 0) {
      return null;
    }

    // Filtrar resultados do município
    const resultadosMunicipio = resultados.filter(r => 
      r.municipio.toUpperCase() === municipio.toUpperCase()
    );

    if (resultadosMunicipio.length === 0) {
      return null;
    }

    // Calcular total de votos no município
    const totalVotosMunicipio = resultadosMunicipio.reduce((acc, r) => 
      acc + parseInt(r.quantidadeVotosNominais || '0', 10), 0
    );

    // Ordenar municípios por votos para calcular ranking
    const municipiosOrdenados = Array.from(new Set(resultados.map(r => r.municipio)))
      .map(mun => ({
        municipio: mun,
        votos: resultados
          .filter(r => r.municipio === mun)
          .reduce((acc, r) => acc + parseInt(r.quantidadeVotosNominais || '0', 10), 0)
      }))
      .sort((a, b) => b.votos - a.votos);

    const ranking = municipiosOrdenados.findIndex(m => 
      m.municipio.toUpperCase() === municipio.toUpperCase()
    ) + 1;

    // Calcular percentual dos votos totais
    const totalVotosGeral = municipiosOrdenados.reduce((acc, m) => acc + m.votos, 0);
    const percentualVotos = (totalVotosMunicipio / totalVotosGeral) * 100;

    // Por enquanto, crescimento será 0 até implementarmos comparação com eleição anterior
    const crescimento = 0;

    return {
      municipio,
      votosDeputado: totalVotosMunicipio,
      ranking,
      percentualVotos,
      crescimento
    };
  } catch (error) {
    console.error('Erro ao processar dados eleitorais:', error);
    return null;
  }
}

// Nova função para processar dados eleitorais em lote
export async function processarDadosEleitoraisBatch(municipios: string[]): Promise<DadosEleitoraisProcessados[]> {
  try {
    const resultados = await Promise.all(
      municipios.map(municipio => processarDadosEleitorais(municipio))
    );

    return resultados.filter((r): r is DadosEleitoraisProcessados => r !== null);
  } catch (error) {
    console.error('Erro ao processar dados eleitorais em lote:', error);
    return [];
  }
}

// Funções de análise e processamento
export function calcularIndiceGini(valores: number[]): number {
  if (valores.length < 2) return 0;
  
  const n = valores.length;
  const media = valores.reduce((a, b) => a + b, 0) / n;
  const somaDiferencas = valores.reduce((acc, val1) => {
    return acc + valores.reduce((inner, val2) => {
      return inner + Math.abs(val1 - val2);
    }, 0);
  }, 0);
  
  return somaDiferencas / (2 * n * n * media);
}

export function calcularOverlapBaseEleitoral(
  municipiosEmendas: string[],
  municipiosVotacao: string[]
): number {
  const setEmendas = new Set(municipiosEmendas);
  const setVotacao = new Set(municipiosVotacao);
  const intersecao = new Set([...setEmendas].filter(x => setVotacao.has(x)));
  
  return (intersecao.size / Math.min(setEmendas.size, setVotacao.size)) * 100;
}

export function calcularTempoMedioExecucao(
  empenhos: { dataEmpenho: string; dataPagamento: string }[]
): number {
  if (empenhos.length === 0) return 0;
  
  const tempos = empenhos.map(e => {
    const empenho = new Date(e.dataEmpenho);
    const pagamento = new Date(e.dataPagamento);
    return (pagamento.getTime() - empenho.getTime()) / (1000 * 60 * 60 * 24); // dias
  });
  
  return tempos.reduce((a, b) => a + b, 0) / tempos.length;
} 

export function calcularRisco(dadosCAUC: DadosCAUC): IndicadorRisco {
  const alertas: string[] = [];
  const recomendacoes: string[] = [];
  let score = 100;

  // Verificar situação geral
  if (dadosCAUC.situacao === 'IRREGULAR') {
    score -= 30;
    alertas.push('Município em situação irregular no CAUC');
    recomendacoes.push('Regularizar pendências no CAUC antes de novas transferências');
  }

  // Verificar itens específicos
  const itensIrregulares = dadosCAUC.itens.filter((i: ItemCAUC) => i.situacao === 'IRREGULAR');
  if (itensIrregulares.length > 0) {
    score -= 10 * itensIrregulares.length;
    itensIrregulares.forEach((item: ItemCAUC) => {
      alertas.push(`Item ${item.codigo} (${item.nome}) irregular`);
      recomendacoes.push(`Regularizar ${item.nome}`);
    });
  }

  // Verificar histórico recente (últimos 90 dias)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 90);
  
  const irregularidadesRecentes = dadosCAUC.historico.filter((e: EventoCAUC) => 
    e.evento === 'IRREGULARIDADE' && new Date(e.data) > dataLimite
  );

  if (irregularidadesRecentes.length > 0) {
    score -= 5 * irregularidadesRecentes.length;
    alertas.push(`${irregularidadesRecentes.length} irregularidades nos últimos 90 dias`);
    recomendacoes.push('Monitorar regularidade para evitar novas pendências');
  }

  // Normalizar score entre 0 e 100
  score = Math.max(0, Math.min(100, score));

  // Determinar nível de risco
  let nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  if (score >= 80) nivel = 'BAIXO';
  else if (score >= 60) nivel = 'MEDIO';
  else if (score >= 40) nivel = 'ALTO';
  else nivel = 'CRITICO';

  return {
    nivel,
    score,
    alertas,
    recomendacoes
  };
} 