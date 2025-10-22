import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';
import path from 'path';
import { 
  ResultadoEleicaoCompleto, 
  ResultadoEleicaoRegistro, 
  FiltroResultadoEleicao,
  ApiResponseResultadoEleicao 
} from '@/types/resultadoEleicoes';

// Cache para otimização
let dadosCache: ResultadoEleicaoCompleto | null = null;
let ultimaLeitura = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Carregar dados do arquivo JSON
 */
function carregarDados(): ResultadoEleicaoCompleto {
  const now = Date.now();
  
  // Verificar se temos cache válido
  if (dadosCache && (now - ultimaLeitura) < CACHE_DURATION) {
    return dadosCache;
  }
  
  const filePath = path.join(process.cwd(), 'public', 'resultados-eleitorais.json');
  
  if (!fs.existsSync(filePath)) {
    // Dados de demonstração se o arquivo não existir
    return {
      metadata: {
        arquivo: 'demo',
        dataProcessamento: new Date().toISOString(),
        totalRegistros: 3,
        colunas: ['municipio', 'candidato', 'partido', 'cargo', 'votos', 'ano'],
        versao: '1.0'
      },
      resultados: [
        {
          municipio: 'TERESINA',
          candidato: 'JOÃO DA SILVA',
          partido: 'PARTIDO A',
          cargo: 'DEPUTADO FEDERAL',
          votos: 15000,
          ano: 2022
        },
        {
          municipio: 'PARNAÍBA',
          candidato: 'MARIA SANTOS',
          partido: 'PARTIDO B',
          cargo: 'DEPUTADO ESTADUAL',
          votos: 8500,
          ano: 2022
        },
        {
          municipio: 'PICOS',
          candidato: 'PEDRO OLIVEIRA',
          partido: 'PARTIDO C',
          cargo: 'DEPUTADO FEDERAL',
          votos: 5200,
          ano: 2022
        }
      ]
    };
  }
  
  try {
    const conteudo = fs.readFileSync(filePath, 'utf8');
    dadosCache = JSON.parse(conteudo);
    ultimaLeitura = now;
    
    return dadosCache!;
  } catch (error) {
    console.error('Erro ao ler arquivo de resultados eleitorais:', error);
    throw new Error('Erro ao carregar dados eleitorais');
  }
}

/**
 * Aplicar filtros aos dados
 */
function aplicarFiltros(
  dados: ResultadoEleicaoRegistro[], 
  filtros: FiltroResultadoEleicao
): ResultadoEleicaoRegistro[] {
  let resultado = [...dados];
  
  // Filtro por município
  if (filtros.municipio) {
    const municipioBusca = filtros.municipio.toLowerCase();
    resultado = resultado.filter(item => {
      const municipioItem = item.municipio?.toString().toLowerCase() || '';
      return municipioItem.includes(municipioBusca);
    });
  }
  
  // Filtro por cargo
  if (filtros.cargo) {
    const cargoBusca = filtros.cargo.toLowerCase();
    resultado = resultado.filter(item => {
      const cargoItem = item.cargo?.toString().toLowerCase() || '';
      return cargoItem.includes(cargoBusca);
    });
  }
  
  // Filtro por ano
  if (filtros.ano) {
    resultado = resultado.filter(item => {
      const anoItem = Number(item['ano de eleicao'] || item.ano);
      return anoItem === filtros.ano;
    });
  }
  
  // Filtro por turno
  if (filtros.turno) {
    resultado = resultado.filter(item => {
      const turnoItem = Number(item.turno);
      return turnoItem === filtros.turno;
    });
  }
  
  // Filtro por partido
  if (filtros.partido) {
    const partidoBusca = filtros.partido.toLowerCase();
    resultado = resultado.filter(item => {
      const partidoItem = item.partido?.toString().toLowerCase() || '';
      return partidoItem.includes(partidoBusca);
    });
  }
  
  // Filtro por zona
  if (filtros.zona) {
    resultado = resultado.filter(item => {
      const zonaItem = Number(item.zona);
      return zonaItem === filtros.zona;
    });
  }
  
  return resultado;
}

/**
 * Calcular estatísticas dos dados
 */
function calcularEstatisticas(dados: ResultadoEleicaoRegistro[]): any {
  const totalVotos = dados.reduce((sum, item) => {
    const votos = Number(item['votos nominais'] || item.votos || 0);
    return sum + votos;
  }, 0);
  
  const municipios = new Set(dados.map(item => item.municipio?.toString()).filter(Boolean));
  const cargos = new Set(dados.map(item => item.cargo?.toString()).filter(Boolean));
  const anos = new Set(dados.map(item => Number(item['ano de eleicao'] || item.ano)).filter(Boolean));
  const partidos = new Set(dados.map(item => item.partido?.toString()).filter(Boolean));
  
  return {
    totalRegistros: dados.length,
    totalVotos,
    totalMunicipios: municipios.size,
    cargosDisponiveis: Array.from(cargos).sort(),
    anosDisponiveis: Array.from(anos).sort(),
    partidosDisponiveis: Array.from(partidos).sort()
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extrair filtros da query string
    const filtros: FiltroResultadoEleicao = {
      municipio: searchParams.get('municipio') || undefined,
      cargo: searchParams.get('cargo') || undefined,
      ano: searchParams.get('ano') ? Number(searchParams.get('ano')) : undefined,
      turno: searchParams.get('turno') ? Number(searchParams.get('turno')) : undefined,
      partido: searchParams.get('partido') || undefined,
      zona: searchParams.get('zona') ? Number(searchParams.get('zona')) : undefined,
      limite: searchParams.get('limite') ? Number(searchParams.get('limite')) : 1000,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0
    };
    
    // Carregar dados
    const dadosCompletos = carregarDados();
    
    // Aplicar filtros
    let dadosFiltrados = aplicarFiltros(dadosCompletos.resultados, filtros);
    
    // Aplicar paginação
    const totalFiltrados = dadosFiltrados.length;
    const offset = filtros.offset || 0;
    const limite = Math.min(filtros.limite || 1000, 50000); // Máximo 50000 registros por vez
    
    dadosFiltrados = dadosFiltrados.slice(offset, offset + limite);
    
    // Calcular estatísticas
    const estatisticas = calcularEstatisticas(dadosCompletos.resultados);
    estatisticas.totalFiltrados = totalFiltrados;
    
    const response: ApiResponseResultadoEleicao = {
      success: true,
      message: `${dadosFiltrados.length} registros encontrados`,
      data: dadosFiltrados,
      metadata: dadosCompletos.metadata,
      filtros,
      estatisticas
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Erro na API de resultados eleitorais:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        data: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      } as ApiResponseResultadoEleicao,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filtros: FiltroResultadoEleicao = body.filtros || {};
    
    // Mesmo processamento do GET, mas com filtros no body
    const dadosCompletos = carregarDados();
    let dadosFiltrados = aplicarFiltros(dadosCompletos.resultados, filtros);
    
    const totalFiltrados = dadosFiltrados.length;
    const offset = filtros.offset || 0;
    const limite = Math.min(filtros.limite || 1000, 50000);
    
    dadosFiltrados = dadosFiltrados.slice(offset, offset + limite);
    
    const estatisticas = calcularEstatisticas(dadosCompletos.resultados);
    estatisticas.totalFiltrados = totalFiltrados;
    
    const response: ApiResponseResultadoEleicao = {
      success: true,
      message: `${dadosFiltrados.length} registros encontrados via POST`,
      data: dadosFiltrados,
      metadata: dadosCompletos.metadata,
      filtros,
      estatisticas
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Erro na API POST de resultados eleitorais:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        data: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      } as ApiResponseResultadoEleicao,
      { status: 500 }
    );
  }
}
