import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Função para converter número com vírgula para inteiro
function converterNumero(valor: string): number {
  if (!valor) return 0;
  
  // Remove espaços
  const valorLimpo = valor.trim();
  
  // Verifica se tem vírgula
  const temVirgula = valorLimpo.includes(',');
  
  // Remove pontos dos milhares e substitui vírgula por ponto
  const numeroLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(numeroLimpo);
  
  // Se o número tem vírgula, multiplica por 1000
  if (temVirgula) {
    return numero * 1000;
  }
  
  return Math.round(numero);
}

export async function GET(req: any) {
  const debug = req.nextUrl?.searchParams?.get('debug');
  
  try {
    console.log('=== DEBUG - Iniciando busca de dados de lideranças ===');
    
    // Usar as mesmas credenciais da API que funciona
    const SHEET_ID = '1PI4N2BOkJZ2ByOCbhUxijzkW3fk1yWn4bYBgdL1Y_WA';
    const SHEET_NAME = 'VOTAÇÃO FINAL'; // Nome da aba para lideranças
    const CLIENT_EMAIL = 'eleicoes20222024@eleicoes20222024.iam.gserviceaccount.com';
    const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCNdLKXRSs+6CvZ\nVghNKg5KGg2n68KBZiVtCW548Oh57QO/WN0d/UA49LNiAuEzvE2OQC+EfusVlYfV\nYB/wK103RVUwheml5X8nmjyKv4ktr3+atcAGITpB11owjIUSstwggfyg0T7zX07D\nYHnfebN2xgvRHqahwR3J2uq6C4ml0vyhTXU0rHwYRXYEPtj9d9H9To4YhNdIh8hN\nPAFLqCFS/id31D816brZ5D2SaGLWbQ2X4lWlXGGW28SJggZx9+4J/mvbHEcGVoqF\nUSyRWPhJGPG60RJm2omfxm6sWXVvH0opGE/CnRqbRbn1ELyMwAcSX36/8r7EIDeY\nPEG3Br7JAgMBAAECggEACDxEj4ED6QgsUV1sY02xAkhtBhs4Oj9fq27yoxDnf/24\nC6JZUT8mx4objXe8c74hR8hd29llx15qx5XulhV4OlkLgiUxuqpXUk9s+ej3zBSd\nGb0+Hj09/opSomPz9Wg7X5shwZ0dDJ8+XyqVPdkAhUg3dOfTbLRpDxDzPHyieWhu\niRQlnOwWT6tWfXLJpUA7Af6FfvQe/G181g0SlcxQ2jFBVDnuYsWR3TK5+mOVGaHo\nssELTlMqCPL06sROmPW8BWl9yaobW6GECDVZZJRinYjvHU5j94p2iIgcF80wIR1o\n6ukxQ6FCKZ3FroufUWOPH78Nq2cwea/HfxMfnHNX+QKBgQDDyhvHDTmSwH7s5ESu\nwrciozCws+bPgkP5r8yVysw1Pd8NSbMeO9IpqBbPbNl0EztjoXGQzbas0HAtOXmF\nS81gUgpgpUlEM0EPNBuveDLes2TamkEg6D6fhADFRgBMOKiCNiWYCLlZp6xndHkn\n3F6Qfdp9PaK5NawzrQ+J8IUb3QKBgQC49RKRqvDu7ZaNXcC5vhlVVE+dwV4xmtKi\nVHE47C8K4OGKmUMjaYoWuokVGq9XFJRN9v6aaep0QYGS1fkMWk9jzt2FJP2UxfEa\n/NhjThn56+IkD3Ppt1ej/q1MRzskBrCdUoRm9Lrww9TzEoC17wWcEMz4fNqUnFu2\n+IS71GXl3QKBgGCR3pOWlVAp/DDSAoKEbhn6jfiKM40kfmy4Zlt31LNqGguOz3dZ\nIDcFvoJ++N7E4aUpqz82CCVDBiF4WNUDZ4Bb1tyGihXGhg9+ry0kR0sLBvK/5OHb\nS5AYZtzmwxzVUWAwXuiXXPy4tFOu4ldj3Yy9VrgxX4Kk05QFh0WNScpNAoGBAJr0\nZ1w29KeX0XwaQa7bvumoOxOVv06bwUBSspDX/wmEIjE1+fOfJhuop9RQiPnRufYf\nqmq/tbc0clQMhBx/ROf/lcNInFKaC0dq8fcwpb6mis1fTONPwVMZuSKgwsGKAUms\nqlR/UGcKCkyjAcZqvC5mPPMp1w6OeKAwUTPz3HLZAoGAGn1+kBwPrDOKQ9aCB3gw\n/VSHntkoJTUXFOG2ZjzbSQQ8qwzXXiuN3MlPhEeHku6SRh3Kkgqlh4awE6huNuGR\nIjgHAL9s5EAHh+KRc+fk9tnM8SStHUqWe4DrEsOtCGoPf2mE7/DXfqHWdFFlPmMQ\nz5Zub5I9f2f2pFtVx+FZ+6c=\n-----END PRIVATE KEY-----\n';

    console.log('Sheet ID:', SHEET_ID);
    console.log('Sheet Name:', SHEET_NAME);
    console.log('CLIENT_EMAIL:', CLIENT_EMAIL);
    console.log('PRIVATE_KEY exists:', !!PRIVATE_KEY);

    const auth = new google.auth.JWT(
      CLIENT_EMAIL,
      undefined,
      PRIVATE_KEY,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // Primeiro, vamos listar as abas disponíveis para debug
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    console.log('=== Abas disponíveis na planilha ===');
    const availableSheets = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];
    availableSheets.forEach((sheet) => {
      console.log('- ', sheet);
    });

    // Se for debug, retornar apenas as abas disponíveis
    if (debug === 'true') {
      return NextResponse.json({ 
        availableSheets,
        message: 'Abas disponíveis na planilha'
      });
    }
    
    // Tentar diferentes nomes de aba possíveis
    const possibleSheetNames = [
      'VOTAÇÃO FINAL',
      'Votação Final',
      'votacao_final',
      'Lideranças',
      'Liderancas',
      'liderancas',
      'LIDERANÇAS',
      'LIDERANCAS'
    ];

    let response;
    let sheetFound = false;
    let usedSheetName = '';

    for (const sheetName of possibleSheetNames) {
      try {
        console.log(`Tentando aba: "${sheetName}"`);
        response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!A:Z`, // Pegar todas as colunas
        });
        
        if (response.data.values && response.data.values.length > 0) {
          console.log(`Aba "${sheetName}" encontrada com ${response.data.values.length} linhas`);
          sheetFound = true;
          usedSheetName = sheetName;
          break;
        }
      } catch (error) {
        console.log(`Aba "${sheetName}" não encontrada`);
        continue;
      }
    }

    if (!sheetFound) {
      return NextResponse.json({ 
        error: 'Nenhuma aba de lideranças encontrada',
        availableSheets,
        triedSheets: possibleSheetNames
      }, { status: 404 });
    }

    const rows = response!.data.values || [];
    console.log('Total de linhas recebidas:', rows.length);

    // Mostrar estrutura dos dados para debug
    console.log('Estrutura das primeiras linhas:');
    console.log('Headers:', JSON.stringify(rows[0], null, 2));
    console.log('Primeira linha de dados:', JSON.stringify(rows[1], null, 2));
    
    // Encontrar o índice da coluna de expectativa de votos
    const headers = rows[0];
    const expectativaIndex = 16; // "Expectativa de Votos 2026"

    console.log('Headers da planilha:', JSON.stringify(headers, null, 2));
    
    // Pular a primeira linha (cabeçalho) e mapear os dados
    const data = rows.slice(1).map(row => {
      const votacao2022 = row[15] || '0';  // "Votação Final 2022" (índice 15)
      const cargo2024 = row[8] || '';      // "Cargo 2024" (índice 8)
      
      return {
        municipio: row[0] || '',           // "Município" (índice 0)
        lideranca: row[2] || '',           // "Liderança" (índice 2)
        liderancaAtual: row[4] || '',      // "Liderança Atual?" (índice 4)
        cargo2024,                         // "Cargo 2024"
        votacao2022: converterNumero(votacao2022).toString(),
        expectativa2026: converterNumero(row[expectativaIndex] || '0').toString()
      };
    });

    // Adicionar log para debug dos dados
    if (rows[1]) {
      console.log('Exemplo de linha processada com valores específicos:');
      console.log('Município:', rows[1][0]);
      console.log('Liderança:', rows[1][2]);
      console.log('Liderança Atual?:', rows[1][4]);
      console.log('Cargo 2024:', rows[1][8]);
      console.log('Votação Final 2022:', rows[1][15]);
      console.log('Expectativa 2026:', rows[1][16]);
    }
    console.log('Exemplo de registro processado:', JSON.stringify(data[0], null, 2));
    console.log('Processados', data.length, 'registros');

    return NextResponse.json({ 
      data,
      sheetUsed: usedSheetName,
      totalRecords: data.length
    });
  } catch (error: any) {
    console.error('=== ERRO DETALHADO ===');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    if (error.response) {
      console.error('Resposta da API:', error.response.data);
    }
    return NextResponse.json(
      { error: 'Erro ao buscar dados da planilha: ' + error.message },
      { status: 500 }
    );
  }
} 