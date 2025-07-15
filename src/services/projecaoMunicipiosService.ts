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
      let crescimento = 0;
      
      // Se não há votação em 2022 mas há expectativa para 2026, considerar como crescimento de 100%
      if (municipio.votacao2022 === 0 && municipio.expectativa2026 > 0) {
        crescimento = 100; // Crescimento de 100% quando vai de 0 para algum valor
      }
      // Se há votação em 2022, calcular o crescimento percentual normal
      else if (municipio.votacao2022 > 0) {
        crescimento = ((municipio.expectativa2026 - municipio.votacao2022) / municipio.votacao2022) * 100;
      }
      // Se não há expectativa para 2026, crescimento é 0
      else {
        crescimento = 0;
      }
      
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
  } catch (error) {
    logger.error('Erro ao buscar projeções dos municípios:', error);
    throw error;
  }
} 