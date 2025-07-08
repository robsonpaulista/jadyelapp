import { google } from 'googleapis';
import { logger } from '@/lib/logger';

interface ProjecaoMunicipio {
  municipio: string;
  liderancasAtuais: number;
  votacao2022: number;
  expectativa2026: number;
  crescimento: number;
  eleitores: number;
  alcance: number;
}

// Dados mocados para teste rápido do mapa
const DADOS_MOCK: ProjecaoMunicipio[] = [
  { municipio: 'TERESINA', liderancasAtuais: 5, votacao2022: 125000, expectativa2026: 150000, crescimento: 20, eleitores: 650000, alcance: 23 },
  { municipio: 'PARNAÍBA', liderancasAtuais: 3, votacao2022: 45000, expectativa2026: 50000, crescimento: 11.1, eleitores: 120000, alcance: 41.7 },
  { municipio: 'PICOS', liderancasAtuais: 2, votacao2022: 25000, expectativa2026: 28000, crescimento: 12, eleitores: 85000, alcance: 32.9 },
  { municipio: 'FLORIANO', liderancasAtuais: 2, votacao2022: 22000, expectativa2026: 24000, crescimento: 9.1, eleitores: 75000, alcance: 32 },
  { municipio: 'PIRIPIRI', liderancasAtuais: 1, votacao2022: 18000, expectativa2026: 19000, crescimento: 5.6, eleitores: 45000, alcance: 42.2 },
  { municipio: 'CAMPO MAIOR', liderancasAtuais: 1, votacao2022: 15000, expectativa2026: 16000, crescimento: 6.7, eleitores: 40000, alcance: 40 },
  { municipio: 'BARRAS', liderancasAtuais: 1, votacao2022: 12000, expectativa2026: 13500, crescimento: 12.5, eleitores: 35000, alcance: 38.6 },
  { municipio: 'UNIÃO', liderancasAtuais: 1, votacao2022: 10000, expectativa2026: 11000, crescimento: 10, eleitores: 30000, alcance: 36.7 },
  { municipio: 'ALTOS', liderancasAtuais: 1, votacao2022: 8000, expectativa2026: 9000, crescimento: 12.5, eleitores: 28000, alcance: 32.1 },
  { municipio: 'JOSÉ DE FREITAS', liderancasAtuais: 1, votacao2022: 9000, expectativa2026: 9500, crescimento: 5.6, eleitores: 25000, alcance: 38 },
  { municipio: 'ESPERANTINA', liderancasAtuais: 1, votacao2022: 7500, expectativa2026: 8500, crescimento: 13.3, eleitores: 22000, alcance: 38.6 },
  { municipio: 'LUÍS CORREIA', liderancasAtuais: 1, votacao2022: 6000, expectativa2026: 6800, crescimento: 13.3, eleitores: 20000, alcance: 34 },
  { municipio: 'PIRACURUCA', liderancasAtuais: 1, votacao2022: 5500, expectativa2026: 6000, crescimento: 9.1, eleitores: 18000, alcance: 33.3 },
  { municipio: 'BATALHA', liderancasAtuais: 0, votacao2022: 4000, expectativa2026: 4200, crescimento: 5, eleitores: 15000, alcance: 28 },
  { municipio: 'OEIRAS', liderancasAtuais: 1, votacao2022: 8000, expectativa2026: 7500, crescimento: -6.25, eleitores: 25000, alcance: 30 },
  { municipio: 'SÃO RAIMUNDO NONATO', liderancasAtuais: 1, votacao2022: 6500, expectativa2026: 6000, crescimento: -7.7, eleitores: 22000, alcance: 27.3 },
  { municipio: 'BOM JESUS', liderancasAtuais: 1, votacao2022: 5000, expectativa2026: 4500, crescimento: -10, eleitores: 18000, alcance: 25 },
  { municipio: 'CORRENTE', liderancasAtuais: 0, votacao2022: 4500, expectativa2026: 3800, crescimento: -15.6, eleitores: 16000, alcance: 23.8 },
  { municipio: 'URUÇUÍ', liderancasAtuais: 1, votacao2022: 4000, expectativa2026: 4400, crescimento: 10, eleitores: 14000, alcance: 31.4 },
  { municipio: 'COCAL', liderancasAtuais: 1, votacao2022: 3500, expectativa2026: 3800, crescimento: 8.6, eleitores: 12000, alcance: 31.7 },
  { municipio: 'PEDRO II', liderancasAtuais: 1, votacao2022: 8500, expectativa2026: 9200, crescimento: 8.2, eleitores: 24000, alcance: 38.3 },
  { municipio: 'ÁGUA BRANCA', liderancasAtuais: 0, votacao2022: 2800, expectativa2026: 3000, crescimento: 7.1, eleitores: 10000, alcance: 30 },
  { municipio: 'MIGUEL ALVES', liderancasAtuais: 1, votacao2022: 2500, expectativa2026: 2700, crescimento: 8, eleitores: 9000, alcance: 30 },
  { municipio: 'VALENÇA DO PIAUÍ', liderancasAtuais: 1, votacao2022: 3000, expectativa2026: 3200, crescimento: 6.7, eleitores: 11000, alcance: 29.1 },
  { municipio: 'REGENERAÇÃO', liderancasAtuais: 1, votacao2022: 3200, expectativa2026: 3400, crescimento: 6.25, eleitores: 12000, alcance: 28.3 }
];

// Configurações da planilha
const SHEET_ID = '1PI4N2BOkJZ2ByOCbhUxijzkW3fk1yWn4bYBgdL1Y_WA';
const SHEET_NAME = 'VOTAÇÃO FINAL';
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

export async function buscarProjecoesMunicipios() {
  try {
    logger.info('=== USANDO DADOS MOCK PARA TESTE RÁPIDO DO MAPA ===');
    
    // Retorna dados mock para teste imediato
    logger.info(`Retornando ${DADOS_MOCK.length} municípios mock para teste`);
    return DADOS_MOCK;

    // Código original comentado para teste
    /*
    logger.info('=== DEBUG - Iniciando busca de dados de projeções ===');
    logger.info(`Sheet ID: ${SHEET_ID}`);
    logger.info(`Sheet Name: ${SHEET_NAME}`);
    logger.info(`CLIENT_EMAIL: ${CLIENT_EMAIL}`);
    logger.info(`PRIVATE_KEY exists: ${!!PRIVATE_KEY}`);

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:U`,
    });

    const data = response.data.values;
    if (!data || data.length < 2) {
      logger.warn('Dados insuficientes na planilha');
      return [];
    }

    const headers = data[0];
    logger.info('Headers da planilha:', headers);

    const rows = data.slice(1);
    logger.info(`Total de linhas recebidas: ${rows.length}`);

    // Criar um mapa para consolidar os dados por município
    const municipiosMap = new Map<string, ProjecaoMunicipio>();

    rows.forEach((row, index) => {
      try {
        const municipio = row[0] || ''; // Município
        if (!municipio) return;

        const liderancaAtual = (row[4] || '').toUpperCase() === 'SIM' ? 1 : 0; // Liderança Atual?
        const votacao2022 = row[15] ? parseInt(String(row[15]).replace(/[^0-9]/g, '')) || 0 : 0; // Votação Final 2022
        const expectativa2026 = row[17] ? parseInt(String(row[17]).replace(/[^0-9]/g, '')) || 0 : 0; // Total Expectativa de Votos 2026
        const eleitores = row[7] ? parseInt(String(row[7]).replace(/[^0-9]/g, '')) || 0 : 0; // Total Votos Eleição 2020

        // Se o município já existe no mapa, atualiza os valores
        if (municipiosMap.has(municipio)) {
          const atual = municipiosMap.get(municipio)!;
          municipiosMap.set(municipio, {
            municipio,
            liderancasAtuais: atual.liderancasAtuais + liderancaAtual,
            votacao2022: atual.votacao2022 + votacao2022,
            expectativa2026: atual.expectativa2026 + expectativa2026,
            eleitores: Math.max(atual.eleitores, eleitores), // Usa o maior valor de eleitores
            crescimento: 0, // Será calculado depois
            alcance: 0 // Será calculado depois
          });
        } else {
          // Se é a primeira ocorrência do município
          municipiosMap.set(municipio, {
            municipio,
            liderancasAtuais: liderancaAtual,
            votacao2022,
            expectativa2026,
            eleitores,
            crescimento: 0, // Será calculado depois
            alcance: 0 // Será calculado depois
          });
        }

        if (index === 0) {
          logger.info('Exemplo de linha processada com valores específicos:', {
            Município: municipio,
            'Liderança Atual?': row[4],
            'Votação Final 2022': row[15],
            'Total Expectativa de Votos 2026': row[17],
            'Total Votos Eleição 2020': row[7],
          });
        }
      } catch (error) {
        logger.error(`Erro ao processar linha ${index + 2}:`, error);
      }
    });

    // Calcular crescimento e alcance para cada município consolidado
    const projecoes = Array.from(municipiosMap.values()).map(municipio => {
      const crescimento = municipio.votacao2022 > 0 
        ? ((municipio.expectativa2026 - municipio.votacao2022) / municipio.votacao2022) * 100 
        : 0;
      const alcance = municipio.eleitores > 0 
        ? (municipio.expectativa2026 / municipio.eleitores) * 100 
        : 0;

      return {
        ...municipio,
        crescimento,
        alcance
      };
    });

    logger.info(`Processados ${projecoes.length} municípios únicos`);
    return projecoes;
    */
  } catch (error) {
    logger.error('Erro ao buscar projeções dos municípios:', error);
    throw error;
  }
} 