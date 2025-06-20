import limitesMac from '../../limitesmac.json';

export interface LimiteMac {
  uf: string;
  ibge: string | number;
  municipio: string;
  valor: number;
  cnes: string | number;
  nome_fantasia: string;
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

export function getLimiteMacByMunicipio(nomeMunicipio: string): LimiteMac | undefined {
  const nomeNormalizado = normalizeString(nomeMunicipio);
  return (limitesMac as LimiteMac[]).find(l => normalizeString(l.municipio) === nomeNormalizado);
}

export function getAllLimitesMac(): LimiteMac[] {
  return limitesMac as LimiteMac[];
} 