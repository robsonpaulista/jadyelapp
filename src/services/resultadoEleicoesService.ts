import { google } from 'googleapis';
import { logger } from '@/lib/logger';

interface ResultadoEleicao {
  uf: string;
  municipio: string;
  codigoCargo: string;
  cargo: string;
  numeroUrna: string;
  nomeCandidato: string;
  nomeUrnaCandidato: string;
  partido: string;
  coligacao: string;
  turno: string;
  situacao: string;
  dataUltimaTotalizacao: string;
  ue: string;
  sequencialCandidato: string;
  tipoDestinocaoVotos: string;
  sequencialEleicao: string;
  anoEleicao: string;
  regiao: string;
  percentualVotosValidos: string;
  quantidadeVotosNominais: string;
  quantidadeVotosConcorrentes: string;
}

// Configuração específica para a API de eleições-anteriores
const SHEET_ID = '1BNy6milP3bS_C2rOULMLHwLez9imCy_WUFkOhKvKW34';
const SHEET_NAME = 'votacao_candidato-municipio_202';
const CLIENT_EMAIL = 'eleicoes20222024@eleicoes20222024.iam.gserviceaccount.com';
const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCNdLKXRSs+6CvZ\nVghNKg5KGg2n68KBZiVtCW548Oh57QO/WN0d/UA49LNiAuEzvE2OQC+EfusVlYfV\nYB/wK103RVUwheml5X8nmjyKv4ktr3+atcAGITpB11owjIUSstwggfyg0T7zX07D\nYHnfebN2xgvRHqahwR3J2uq6C4ml0vyhTXU0rHwYRXYEPtj9d9H9To4YhNdIh8hN\nPAFLqCFS/id31D816brZ5D2SaGLWbQ2X4lWlXGGW28SJggZx9+4J/mvbHEcGVoqF\nUSyRWPhJGPG60RJm2omfxm6sWXVvH0opGE/CnRqbRbn1ELyMwAcSX36/8r7EIDeY\nPEG3Br7JAgMBAAECggEACDxEj4ED6QgsUV1sY02xAkhtBhs4Oj9fq27yoxDnf/24\nC6JZUT8mx4objXe8c74hR8hd29llx15qx5XulhV4OlkLgiUxuqpXUk9s+ej3zBSd\nGb0+Hj09/opSomPz9Wg7X5shwZ0dDJ8+XyqVPdkAhUg3dOfTbLRpDxDzPHyieWhu\niRQlnOwWT6tWfXLJpUA7Af6FfvQe/G181g0SlcxQ2jFBVDnuYsWR3TK5+mOVGaHo\nssELTlMqCPL06sROmPW8BWl9yaobW6GECDVZZJRinYjvHU5j94p2iIgcF80wIR1o\n6ukxQ6FCKZ3FroufUWOPH78Nq2cwea/HfxMfnHNX+QKBgQDDyhvHDTmSwH7s5ESu\nwrciozCws+bPgkP5r8yVysw1Pd8NSbMeO9IpqBbPbNl0EztjoXGQzbas0HAtOXmF\nS81gUgpgpUlEM0EPNBuveDLes2TamkEg6D6fhADFRgBMOKiCNiWYCLlZp6xndHkn\n3F6Qfdp9PaK5NawzrQ+J8IUb3QKBgQC49RKRqvDu7ZaNXcC5vhlVVE+dwV4xmtKi\nVHE47C8K4OGKmUMjaYoWuokVGq9XFJRN9v6aaep0QYGS1fkMWk9jzt2FJP2UxfEa\n/NhjThn56+IkD3Ppt1ej/q1MRzskBrCdUoRm9Lrww9TzEoC17wWcEMz4fNqUnFu2\n+IS71GXl3QKBgGCR3pOWlVAp/DDSAoKEbhn6jfiKM40kfmy4Zlt31LNqGguOz3dZ\nIDcFvoJ++N7E4aUpqz82CCVDBiF4WNUDZ4Bb1tyGihXGhg9+ry0kR0sLBvK/5OHb\nS5AYZtzmwxzVUWAwXuiXXPy4tFOu4ldj3Yy9VrgxX4Kk05QFh0WNScpNAoGBAJr0\nZ1w29KeX0XwaQa7bvumoOxOVv06bwUBSspDX/wmEIjE1+fOfJhuop9RQiPnRufYf\nqmq/tbc0clQMhBx/ROf/lcNInFKaC0dq8fcwpb6mis1fTONPwVMZuSKgwsGKAUms\nqlR/UGcKCkyjAcZqvC5mPPMp1w6OeKAwUTPz3HLZAoGAGn1+kBwPrDOKQ9aCB3gw\n/VSHntkoJTUXFOG2ZjzbSQQ8qwzXXiuN3MlPhEeHku6SRh3Kkgqlh4awE6huNuGR\nIjgHAL9s5EAHh+KRc+fk9tnM8SStHUqWe4DrEsOtCGoPf2mE7/DXfqHWdFFlPmMQ\nz5Zub5I9f2f2pFtVx+FZ+6c=\n-----END PRIVATE KEY-----\n';

async function getSheetsClient() {
  const auth = new google.auth.JWT(
    CLIENT_EMAIL,
    undefined,
    PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );
  return google.sheets({ version: 'v4', auth });
}

export async function buscarResultadosPorCidade(cidade: string) {
  try {
    const sheets = await getSheetsClient();
    const range = `${SHEET_NAME}!A:Z`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });
    
    const data = response.data.values;
    
    if (!data || data.length < 2) {
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filtra as linhas pela cidade especificada
    const resultados = rows
      .filter(row => row[1]?.toUpperCase() === cidade.toUpperCase())
      .map(row => ({
        uf: row[0] || '',
        municipio: row[1] || '',
        codigoCargo: row[2] || '',
        cargo: row[3] || '',
        numeroUrna: row[4] || '',
        nomeCandidato: row[5] || '',
        nomeUrnaCandidato: row[6] || '',
        partido: row[7] || '',
        coligacao: row[8] || '',
        turno: row[9] || '',
        situacao: row[10] || '',
        dataUltimaTotalizacao: row[11] || '',
        ue: row[12] || '',
        sequencialCandidato: row[13] || '',
        tipoDestinocaoVotos: row[14] || '',
        sequencialEleicao: row[15] || '',
        anoEleicao: row[16] || '',
        regiao: row[17] || '',
        percentualVotosValidos: row[18] || '',
        quantidadeVotosNominais: row[19] || '',
        quantidadeVotosConcorrentes: row[20] || ''
      })) as ResultadoEleicao[];

    return resultados;
  } catch (error) {
    logger.error('Erro ao buscar resultados por cidade:', error);
    throw error;
  }
}

export async function buscarResultadosDeputadoFederal2022() {
  try {
    const sheets = await getSheetsClient();
    const range = `${SHEET_NAME}!A:Z`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });
    
    const data = response.data.values;
    
    if (!data || data.length < 2) {
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filtra apenas dados de Deputado Federal 2022
    const resultados = rows
      .filter(row => {
        const cargo = row[3]?.toLowerCase() || '';
        const ano = row[16] || '';
        return cargo.includes('federal') && ano === '2022';
      })
      .map(row => ({
        uf: row[0] || '',
        municipio: row[1] || '',
        codigoCargo: row[2] || '',
        cargo: row[3] || '',
        numeroUrna: row[4] || '',
        nomeCandidato: row[5] || '',
        nomeUrnaCandidato: row[6] || '',
        partido: row[7] || '',
        coligacao: row[8] || '',
        turno: row[9] || '',
        situacao: row[10] || '',
        dataUltimaTotalizacao: row[11] || '',
        ue: row[12] || '',
        sequencialCandidato: row[13] || '',
        tipoDestinocaoVotos: row[14] || '',
        sequencialEleicao: row[15] || '',
        anoEleicao: row[16] || '',
        regiao: row[17] || '',
        percentualVotosValidos: row[18] || '',
        quantidadeVotosNominais: row[19] || '',
        quantidadeVotosConcorrentes: row[20] || ''
      })) as ResultadoEleicao[];

    return resultados;
  } catch (error) {
    logger.error('Erro ao buscar resultados de Deputado Federal 2022:', error);
    throw error;
  }
} 

export async function buscarResultadosDeputadoEstadual2022() {
  try {
    const sheets = await getSheetsClient();
    const range = `${SHEET_NAME}!A:Z`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });
    
    const data = response.data.values;
    
    if (!data || data.length < 2) {
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filtra apenas dados de Deputado Estadual 2022
    const resultados = rows
      .filter(row => {
        const cargo = row[3]?.toLowerCase() || '';
        const ano = row[16] || '';
        return cargo.includes('estadual') && ano === '2022';
      })
      .map(row => ({
        uf: row[0] || '',
        municipio: row[1] || '',
        codigoCargo: row[2] || '',
        cargo: row[3] || '',
        numeroUrna: row[4] || '',
        nomeCandidato: row[5] || '',
        nomeUrnaCandidato: row[6] || '',
        partido: row[7] || '',
        coligacao: row[8] || '',
        turno: row[9] || '',
        situacao: row[10] || '',
        dataUltimaTotalizacao: row[11] || '',
        ue: row[12] || '',
        sequencialCandidato: row[13] || '',
        tipoDestinocaoVotos: row[14] || '',
        sequencialEleicao: row[15] || '',
        anoEleicao: row[16] || '',
        regiao: row[17] || '',
        percentualVotosValidos: row[18] || '',
        quantidadeVotosNominais: row[19] || '',
        quantidadeVotosConcorrentes: row[20] || ''
      })) as ResultadoEleicao[];

    return resultados;
  } catch (error) {
    logger.error('Erro ao buscar resultados de Deputado Estadual 2022:', error);
    throw error;
  }
} 