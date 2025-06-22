import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Força runtime dinâmico para permitir uso de request.url
export const dynamic = 'force-dynamic';

// Configuração de timeout para produção (máximo 25 segundos)
export const maxDuration = 25;

interface Proposta {
  nuProposta: string;
  acao: string;
  nmPrograma: string;
  nmTipoObjeto: string;
  snPrincipal: string;
  municipio: string;
  vlProposta: number;
  vlGlobal: number;
  coSituacaoProposta: string;
  dsSituacaoProposta: string;
  dtCadastramento: string;
  coTipoProposta: string;
  dsTipoRecurso: string;
  vlPagar: number;
}

interface MunicipioLocal {
  nome: string;
  nome_normalizado: string;
  codigo_ibge: string;
  populacao: number;
}

const HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)",
  "Referer": "https://consultafns.saude.gov.br/",
};

// Cache simples em memória
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

function getFromCache(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Função para carregar municípios do arquivo local
function getMunicipiosFromLocal(): any[] {
  try {
    // Usar o arquivo limitespap.json que já tem os códigos IBGE corretos
    const filePath = path.join(process.cwd(), 'limitespap.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const limitesData: any[] = JSON.parse(fileContent);
    
    // Extrair municípios únicos com códigos IBGE corretos
    const municipiosMap = new Map();
    
    limitesData.forEach(item => {
      if (!municipiosMap.has(item.municipio)) {
        // Converter nome do município para formato adequado (primeira letra maiúscula)
        const nomeFormatado = item.municipio
          .toLowerCase()
          .split(' ')
          .map((palavra: string) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
          .join(' ')
          .replace(/\bDo\b/g, 'do')
          .replace(/\bDa\b/g, 'da')
          .replace(/\bDe\b/g, 'de')
          .replace(/\bDos\b/g, 'dos')
          .replace(/\bDas\b/g, 'das');
          
        municipiosMap.set(item.municipio, {
          coMunicipioIbge: item.ibge,
          noMunicipio: nomeFormatado
        });
      }
    });
    
    // Converter Map para Array e ordenar por nome
    return Array.from(municipiosMap.values()).sort((a, b) => 
      a.noMunicipio.localeCompare(b.noMunicipio, 'pt-BR')
    );
  } catch (error) {
    console.error('Erro ao carregar municípios do arquivo local:', error);
    return [];
  }
}

async function getPropostasByMunicipio(codigoIbge: string, nomeMunicipio: string, maxPages: number = 5): Promise<Proposta[]> {
  const cacheKey = `propostas-${codigoIbge}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  const propostas: Proposta[] = [];
  let page = 1;
  
  try {
    while (page <= maxPages) {
      const url = "https://consultafns.saude.gov.br/recursos/proposta/consultar";
      const params = new URLSearchParams({
        "ano": "2025",
        "sgUf": "PI",
        "coMunicipioIbge": codigoIbge,
        "count": "100",
        "page": page.toString(),
        "coEsfera": ""
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos por requisição
      
      const response = await fetch(`${url}?${params.toString()}`, { 
        headers: HEADERS,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Erro na consulta do município ${nomeMunicipio}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const propostasPage = data.resultado?.itensPagina || [];
      
      if (propostasPage.length === 0) {
        break; // Não tem mais propostas nessa página
      }
      
      // Adicionar o nome do município a cada proposta
      const propostasComMunicipio = propostasPage.map((p: any) => ({
        ...p,
        municipio: nomeMunicipio
      }));
      
      propostas.push(...propostasComMunicipio);
      
      page++;
      
      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Cache o resultado
    setCache(cacheKey, propostas);
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`Timeout na consulta do município ${nomeMunicipio}`);
    } else {
      console.error(`Erro ao buscar propostas para ${nomeMunicipio}:`, error);
    }
  }
  
  return propostas;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const municipioParam = searchParams.get('municipio');
    const limit = parseInt(searchParams.get('limit') || '50'); // Limitar municípios por padrão
    const onlyMunicipios = searchParams.get('only_municipios') === 'true';

    const municipios = getMunicipiosFromLocal();
    
    if (municipios.length === 0) {
      return NextResponse.json({ error: 'Não foi possível carregar a lista de municípios do arquivo local' }, { status: 500 });
    }

    // Se solicitar apenas a lista de municípios
    if (onlyMunicipios) {
      return NextResponse.json({
        municipios: municipios.map(m => m.noMunicipio).sort()
      });
    }

    let allPropostas: Proposta[] = [];

    if (municipioParam) {
      // Buscar apenas um município específico
      const municipioTarget = municipios.find(m => m.noMunicipio.toUpperCase() === municipioParam.toUpperCase());
      if (municipioTarget) {
        allPropostas = await getPropostasByMunicipio(municipioTarget.coMunicipioIbge, municipioTarget.noMunicipio);
      }
    } else {
      // Buscar apenas os primeiros X municípios ou usar cache geral
      const cacheKey = 'all-propostas';
      const cached = getFromCache(cacheKey);
      
      if (cached) {
        allPropostas = cached;
      } else {
        // Limitar municípios para evitar timeout
        const municipiosLimitados = municipios.slice(0, limit);
        const batchSize = 3; // Reduzir batch size
        
        for (let i = 0; i < municipiosLimitados.length; i += batchSize) {
          // Verificar se não estamos próximos do timeout
          if (Date.now() - startTime > 20000) { // 20 segundos
            console.log('Interrompendo busca devido ao tempo limite');
            break;
          }
          
          const batch = municipiosLimitados.slice(i, i + batchSize);
          const propostasBatch = await Promise.allSettled(
            batch.map(municipio => 
              getPropostasByMunicipio(municipio.coMunicipioIbge, municipio.noMunicipio, 3) // Máximo 3 páginas
            )
          );
          
          propostasBatch.forEach((result) => {
            if (result.status === 'fulfilled') {
              allPropostas.push(...result.value);
            }
          });
          
          // Pausa entre lotes
          if (i + batchSize < municipiosLimitados.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Cache o resultado
        setCache(cacheKey, allPropostas);
      }
    }
    
    // Ordenar propostas por data de cadastro (mais recentes primeiro)
    allPropostas.sort((a, b) => {
      const dateA = new Date(a.dtCadastramento).getTime();
      const dateB = new Date(b.dtCadastramento).getTime();
      return dateB - dateA;
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Consulta finalizada em ${responseTime}ms com ${allPropostas.length} propostas`);
    
    return NextResponse.json({
      propostas: allPropostas,
      municipios: municipios.map(m => m.noMunicipio).sort(),
      total_municipios: municipios.length,
      municipios_consultados: municipioParam ? 1 : limit
    });
  } catch (error: any) {
    console.error('Erro geral na API de consultar-tetos:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao buscar dados do FNS' },
      { status: 500 }
    );
  }
} 