/**
 * Tipos para dados de resultados eleitorais
 */

export interface ResultadoEleicaoMetadata {
  arquivo: string;
  dataProcessamento: string;
  totalRegistros: number;
  colunas: string[];
  versao: string;
}

export interface ResultadoEleicaoRegistro {
  [key: string]: string | number | null | undefined;
}

export interface ResultadoEleicaoCompleto {
  metadata: ResultadoEleicaoMetadata;
  resultados: ResultadoEleicaoRegistro[];
}

// Interfaces específicas para campos comuns em dados eleitorais
export interface CandidatoEleicao {
  nome?: string;
  numero?: number;
  partido?: string;
  coligacao?: string;
  votos?: number;
  percentual?: number;
  situacao?: string;
}

export interface MunicipioEleicao {
  municipio?: string;
  codigo_municipio?: number;
  zona?: number;
  secao?: number;
  eleitores_aptos?: number;
  comparecimento?: number;
  abstencoes?: number;
  votos_validos?: number;
  votos_brancos?: number;
  votos_nulos?: number;
}

export interface ResultadoPorCargo {
  cargo?: string;
  ano_eleicao?: number;
  turno?: number;
  candidatos?: CandidatoEleicao[];
  total_votos?: number;
  total_eleitores?: number;
}

// Filtros para consulta
export interface FiltroResultadoEleicao {
  municipio?: string;
  cargo?: string;
  ano?: number;
  turno?: number;
  partido?: string;
  zona?: number;
  limite?: number;
  offset?: number;
}

// Resposta da API
export interface ApiResponseResultadoEleicao {
  success: boolean;
  message: string;
  data: ResultadoEleicaoRegistro[];
  metadata?: ResultadoEleicaoMetadata;
  filtros?: FiltroResultadoEleicao;
  estatisticas?: {
    totalRegistros: number;
    totalFiltrados: number;
    totalVotos: number;
    totalMunicipios: number;
    cargosDisponiveis: string[];
    anosDisponiveis: number[];
    partidosDisponiveis: string[];
  };
}
