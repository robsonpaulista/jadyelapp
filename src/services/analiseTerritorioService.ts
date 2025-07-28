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
  municipio: string;
  situacao: 'REGULAR' | 'IRREGULAR' | 'PENDENTE';
  bloqueios: string[];
}

// Nova interface para dados eleitorais processados
interface DadosEleitoraisProcessados {
  municipio: string;
  votosDeputado: number;
  ranking: number;
  percentualVotos: number;
  crescimento: number;
}

// Cache em memória para dados do IBGE (evitar chamadas repetidas)
const cacheIBGE: { [key: string]: DadosIBGE } = {};

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
    // TODO: Implementar integração com Tesouro Transparente
    // const url = `https://apidadosabertos.tesouro.gov.br/cauc/municipios/${codigoMunicipio}`;
    // const response = await fetch(url);
    // const data = await response.json();
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados do CAUC:', error);
    return null;
  }
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