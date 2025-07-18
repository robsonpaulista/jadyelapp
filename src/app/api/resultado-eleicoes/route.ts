import { NextRequest, NextResponse } from 'next/server';
import { buscarResultadosPorCidade, buscarResultadosDeputadoFederal2022, buscarResultadosDeputadoEstadual2022 } from '@/services/resultadoEleicoesService';

// Força runtime dinâmico para permitir uso de nextUrl.searchParams
export const dynamic = 'force-dynamic';

// Cache em memória para os dados de eleições
let cacheFederal2022: any = null;
let cacheEstadual2022: any = null;
let cacheTimestampFederal: number = 0;
let cacheTimestampEstadual: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Função para verificar se o cache ainda é válido
function isCacheValid(timestamp: number): boolean {
  return timestamp !== 0 && (Date.now() - timestamp) < CACHE_DURATION;
}

export async function GET(req: NextRequest) {
  const cidade = req.nextUrl.searchParams.get('cidade');
  const debug = req.nextUrl.searchParams.get('debug');
  const tipo = req.nextUrl.searchParams.get('tipo');
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';
  
  if (debug === 'true') {
    // Endpoint de debug para ver a estrutura da planilha
    try {
      const { google } = await import('googleapis');
      
      const SHEET_ID = '1BNy6milP3bS_C2rOULMLHwLez9imCy_WUFkOhKvKW34';
      const SHEET_NAME = 'votacao_candidato-municipio_202';
      const CLIENT_EMAIL = 'eleicoes20222024@eleicoes20222024.iam.gserviceaccount.com';
      const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCNdLKXRSs+6CvZ\nVghNKg5KGg2n68KBZiVtCW548Oh57QO/WN0d/UA49LNiAuEzvE2OQC+EfusVlYfV\nYB/wK103RVUwheml5X8nmjyKv4ktr3+atcAGITpB11owjIUSstwggfyg0T7zX07D\nYHnfebN2xgvRHqahwR3J2uq6C4ml0vyhTXU0rHwYRXYEPtj9d9H9To4YhNdIh8hN\nPAFLqCFS/id31D816brZ5D2SaGLWbQ2X4lWlXGGW28SJggZx9+4J/mvbHEcGVoqF\nUSyRWPhJGPG60RJm2omfxm6sWXVvH0opGE/CnRqbRbn1ELyMwAcSX36/8r7EIDeY\nPEG3Br7JAgMBAAECggEACDxEj4ED6QgsUV1sY02xAkhtBhs4Oj9fq27yoxDnf/24\nC6JZUT8mx4objXe8c74hR8hd29llx15qx5XulhV4OlkLgiUxuqpXUk9s+ej3zBSd\nGb0+Hj09/opSomPz9Wg7X5shwZ0dDJ8+XyqVPdkAhUg3dOfTbLRpDxDzPHyieWhu\niRQlnOwWT6tWfXLJpUA7Af6FfvQe/G181g0SlcxQ2jFBVDnuYsWR3TK5+mOVGaHo\nssELTlMqCPL06sROmPW8BWl9yaobW6GECDVZZJRinYjvHU5j94p2iIgcF80wIR1o\n6ukxQ6FCKZ3FroufUWOPH78Nq2cwea/HfxMfnHNX+QKBgQDDyhvHDTmSwH7s5ESu\nwrciozCws+bPgkP5r8yVysw1Pd8NSbMeO9IpqBbPbNl0EztjoXGQzbas0HAtOXmF\nS81gUgpgpUlEM0EPNBuveDLes2TamkEg6D6fhADFRgBMOKiCNiWYCLlZp6xndHkn\n3F6Qfdp9PaK5NawzrQ+J8IUb3QKBgQC49RKRqvDu7ZaNXcC5vhlVVE+dwV4xmtKi\nVHE47C8K4OGKmUMjaYoWuokVGq9XFJRN9v6aaep0QYGS1fkMWk9jzt2FJP2UxfEa\n/NhjThn56+IkD3Ppt1ej/q1MRzskBrCdUoRm9Lrww9TzEoC17wWcEMz4fNqUnFu2\n+IS71GXl3QKBgGCR3pOWlVAp/DDSAoKEbhn6jfiKM40kfmy4Zlt31LNqGguOz3dZ\nIDcFvoJ++N7E4aUpqz82CCVDBiF4WNUDZ4Bb1tyGihXGhg9+ry0kR0sLBvK/5OHb\nS5AYZtzmwxzVUWAwXuiXXPy4tFOu4ldj3Yy9VrgxX4Kk05QFh0WNScpNAoGBAJr0\nZ1w29KeX0XwaQa7bvumoOxOVv06bwUBSspDX/wmEIjE1+fOfJhuop9RQiPnRufYf\nqmq/tbc0clQMhBx/ROf/lcNInFKaC0dq8fcwpb6mis1fTONPwVMZuSKgwsGKAUms\nqlR/UGcKCkyjAcZqvC5mPPMp1w6OeKAwUTPz3HLZAoGAGn1+kBwPrDOKQ9aCB3gw\n/VSHntkoJTUXFOG2ZjzbSQQ8qwzXXiuN3MlPhEeHku6SRh3Kkgqlh4awE6huNuGR\nIjgHAL9s5EAHh+KRc+fk9tnM8SStHUqWe4DrEsOtCGoPf2mE7/DXfqHWdFFlPmMQ\nz5Zub5I9f2f2pFtVx+FZ+6c=\n-----END PRIVATE KEY-----\n';
      
      const auth = new google.auth.JWT(
        CLIENT_EMAIL,
        undefined,
        PRIVATE_KEY,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );
      
      const sheets = google.sheets({ version: 'v4', auth });
      const range = `${SHEET_NAME}!A:Z`;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range,
      });
      
      const data = response.data.values;
      
      if (!data || data.length < 2) {
        return NextResponse.json({ error: 'Nenhum dado encontrado na planilha' }, { status: 404 });
      }
      
      const headers = data[0];
      const rows = data.slice(1, 6); // Primeiras 5 linhas
      
      return NextResponse.json({
        headers: headers,
        sampleData: rows,
        totalRows: data.length - 1
      });
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao buscar dados da planilha.' }, { status: 500 });
    }
  }

  // Endpoint para buscar dados de Deputado Federal 2022 para todos os municípios
  if (tipo === 'deputado_federal_2022') {
    try {
      // Verificar cache primeiro
      if (!forceRefresh && isCacheValid(cacheTimestampFederal)) {
        console.log('=== Retornando dados federais do cache ===');
        return NextResponse.json({ 
          resultados: cacheFederal2022,
          fromCache: true,
          cacheAge: Math.round((Date.now() - cacheTimestampFederal) / 1000) + 's'
        });
      }

      console.log('=== Buscando dados federais da API ===');
      const resultados = await buscarResultadosDeputadoFederal2022();
      
      // Atualizar cache
      cacheFederal2022 = resultados;
      cacheTimestampFederal = Date.now();
      
      return NextResponse.json({ 
        resultados,
        fromCache: false
      });
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao buscar dados de Deputado Federal 2022.' }, { status: 500 });
    }
  }

  // Endpoint para buscar dados de Deputado Estadual 2022 para todos os municípios
  if (tipo === 'deputado_estadual_2022') {
    try {
      // Verificar cache primeiro
      if (!forceRefresh && isCacheValid(cacheTimestampEstadual)) {
        console.log('=== Retornando dados estaduais do cache ===');
        return NextResponse.json({ 
          resultados: cacheEstadual2022,
          fromCache: true,
          cacheAge: Math.round((Date.now() - cacheTimestampEstadual) / 1000) + 's'
        });
      }

      console.log('=== Buscando dados estaduais da API ===');
      const resultados = await buscarResultadosDeputadoEstadual2022();
      
      // Atualizar cache
      cacheEstadual2022 = resultados;
      cacheTimestampEstadual = Date.now();
      
      return NextResponse.json({ 
        resultados,
        fromCache: false
      });
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao buscar dados de Deputado Estadual 2022.' }, { status: 500 });
    }
  }
  
  if (!cidade) {
    return NextResponse.json({ error: 'Cidade não informada' }, { status: 400 });
  }
  
  try {
    const resultados = await buscarResultadosPorCidade(cidade);
    return NextResponse.json({ resultados });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dados da planilha.' }, { status: 500 });
  }
} 