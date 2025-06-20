export interface ProjecaoData {
  municipio: string;
  lideranca: string;
  cargo2024: string;
  votosProjetados: number;
  votacao2022: number;
}

export interface ObraDemanda {
  municipio: string;
  bairro: string;
  tipo: string;
  descricao: string;
  status: string;
  previsaoEntrega: string;
  valorEstimado: number;
  fonte: string;
  solicitante: string;
  prioridade: string;
} 