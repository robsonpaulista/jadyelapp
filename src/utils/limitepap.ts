import limitesPap from '../../limitespap.json';

export interface LimitePap {
  uf: string;
  ibge: string | number;
  municipio: string;
  valor: number;
  tipo: string;
}

// Função para normalizar texto (remover acentos e padronizar capitalização)
function normalizeString(str: string) {
  return (str || '')
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove tudo que não é letra, número ou espaço
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim();
}

export function getLimitePapByMunicipio(nomeMunicipio: string): LimitePap | undefined {
  const nomeNormalizado = normalizeString(nomeMunicipio);
  return (limitesPap as LimitePap[]).find(l => normalizeString(l.municipio) === nomeNormalizado);
}

export function getAllLimitesPap(): LimitePap[] {
  return limitesPap as LimitePap[];
} 