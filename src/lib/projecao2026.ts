import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Configuração do cliente Google Sheets
const auth = new JWT({
  email: 'conexaoprojecao2026@conexaoprojecao2026.iam.gserviceaccount.com',
  key: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDydOo1A4iX3iJB\nNjecFv2eKcPlnrNSg2auZnkIsn8XpNykSZIkV8afwTvGZFixgsxP9GXSA1h03Wv6\nvhSjBs7modbOCzigX70TvlvZwKp7DNq8wzqBPdyrKThyQ9ihPdjZaijh+yyIIqDe\niE0u+H7PzJYpx1vzsmO8JUuQgbduQhElc2gq8leOknfMit3Mb49jSIcA3Z1ECxWW\npR/03tfIpB8oFVcb4f8WenNe3c1HGusSknbZtXO8xW9jO5YxZLd/HLNTygCtX6s5\ntBvFm4KwpbAqvpltpP/xEWxt+hcaezCjsXVkuBh4Qt9/FsYSCng6iODcItY0z0EF\nzD5K4nDjAgMBAAECggEABwPTS5cKFTFz9poN0CzUHVw3qEWdX5ugqsFulWNWDQY+\nl1xE57CdymfUsGqdLFRMpVrnX++r2ARuCDJcC37Pbq8rtV4avyfLTdkZ9DoVqfts\nZWi/9mxRSFHS1G+FGDPfZHmkrCvQaodB9fOl9ArJidPxW6JtKnxfVAVqOHNLA4bE\nZ/NwKTDYpYFdKWpQEAQ13detqmq/w1fBJ7unIryyc00T2S9thrjvdC4ECQb9iktC\nM2XBqvS17PwFja+wgvyYOodq7c4FPce+o47NqS4GU+oPtju8Qpf+AYoCZl+Fhz+v\nVbmC6vS97a7HoNVs2Px9c+/0OSLbqeoSO0u+m0zkqQKBgQD9xM2Aiys8SiA56Mae\nWrfldUYURGvf5kDLRGf/6aj+lXsaRBLcHgBbzDA98BIngPzP1JFcw3oQ4Qj10V+G\nnqwd++oXJh6KgCh8bamVegJjOCbmzMx6zSFBIOfjsXHTpR3IbTvashEZ4jSDrIj4\nxgROOsAy+43Vpi9MG2oYhJJzWQKBgQD0lqZ5h3miGBglQgGoUw5VP9Gvrg4ImV80\nrSu/zAxxWwG2E8nFP7+jAS+9ie3Lt9VzHLUyBbWysKFgvremLLUPcujJyA9FsLGl\np4GkBakqXqIqGzadfcK8d//Hjdoo8Al3Da9S8eHxDOdST77JKyvXADOVuJA2v8JL\n/fDAwloqmwKBgQDCzMQDnNE/opdCXNG61WC9H10ASdWVNice4hADftZfN1gcPY1M\nsysLTJ7rrNICyR1IXKCJWPTm6Bf8uxBdQohVK//ybSycnOx3N6cqO1KB36TdHvEI\ng1a3rA7V1mzOTr2iEVgU9QPznpU5TsSGU1sSwj6v5DJogv1jqteyonHZYQKBgQCO\ncg6SSKw2EwI88Kw2c+itDXX5cs0JhQlFjHUmRpgYjH/6opuoHPBm5pH/OQ0cz/uo\nBtggQeMIJoZV6bzbMr5gOPQKUFFUrQtJBr0h4Yob+vFGxIKSRmPbj6ePeLXNkb5x\nb67kB6smz/UIoxjh4BqwJJXmZI7Y0+U8jLBiEs6gcQKBgQDIxY205hrWieSuHghT\nT2GZg4zKN5A+egJiIwww8XLe+LbyVhDgQb/JghBUF4EQO2EN1ZkxLZhdm2DTZfqK\njKOKMHNQcSp/lN9PkRNISNPIVJndcCVaWMGb294gg5Qol56NJ9feo+HZ7oRovzY4\nvDgS1cgwLUv2915RTN0GNE6ndg==\n-----END PRIVATE KEY-----\n',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Função para obter dados da planilha
export async function getProjecaoVotos() {
  try {
    console.log('=== INICIANDO API DE PROJEÇÃO DE VOTOS ===');
    console.log('ID da planilha configurado:', process.env.PROJECAO_SHEET_ID);
    console.log('Nome da aba configurada:', 'VOTAÇÃO FINAL');
    console.log('Colunas configuradas:', 'A,C,E,I,Q');

    // Verificar se o ID da planilha está configurado
    if (!process.env.PROJECAO_SHEET_ID) {
      throw new Error('ID da planilha não configurado');
    }

    // Listar abas disponíveis
    console.log('Listando abas da planilha...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.PROJECAO_SHEET_ID,
    });

    const sheetsList = spreadsheet.data.sheets || [];
    const availableSheets = sheetsList.map(sheet => sheet.properties?.title || '').filter(Boolean);
    console.log('Abas encontradas:', availableSheets);

    // Verificar se a aba existe
    const sheetName = 'VOTAÇÃO FINAL';
    if (!availableSheets.includes(sheetName)) {
      throw new Error(`A aba "${sheetName}" não foi encontrada na planilha. Abas disponíveis: ${availableSheets.join(', ')}`);
    }

    // Construir o range para buscar todas as colunas
    const range = `${sheetName}!A1:Q`;
    console.log('Range a ser usado:', range);

    // Obter dados da planilha
    console.log('Tentando obter dados da planilha:', {
      sheetId: process.env.PROJECAO_SHEET_ID,
      range
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.PROJECAO_SHEET_ID,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('Nenhum dado encontrado na planilha');
    }

    console.log('Dados obtidos com sucesso. Número de linhas:', rows.length);

    // Processar os dados
    const headers = rows[0];
    console.log('Headers exatos da planilha:', headers);
    console.log('Primeira linha de dados:', rows[1]);

    // Encontrar o índice da coluna de votos pelo nome correto
    const votosColumnIndex = headers.findIndex(header => header === 'Expectativa de Votos 2026');
    console.log('Índice da coluna de votos:', votosColumnIndex);
    console.log('Nome da coluna de votos:', headers[votosColumnIndex]);

    const data = rows.slice(1).map(row => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || '';
      });
      return record;
    });

    // Calcular totais e médias
    const totalVotos = data.reduce((sum, row) => {
      const votosStr = row['Expectativa de Votos 2026'] || '0';
      // Tratar valores com formato de milhar (ex: "2,000" -> 2000)
      const votos = parseInt(votosStr.replace(/,(\d{3})/g, '$1').replace(/\./g, '').replace(/,/g, ''), 10) || 0;
      console.log('Processando votos para total:', {
        municipio: row['Município'],
        lideranca: row['Liderança'],
        votosStr,
        votos
      });
      return sum + votos;
    }, 0);

    console.log('Total de votos calculado:', totalVotos);

    const totalMunicipios = data.length;
    const mediaVotos = Math.round(totalVotos / totalMunicipios);

    // Encontrar lideranças atuais
    const liderancas = data.reduce((acc, row) => {
      const candidato = row['Liderança'];
      const votosStr = row['Expectativa de Votos 2026'] || '0';
      const votos = parseInt(votosStr.replace(/,(\d{3})/g, '$1').replace(/\./g, '').replace(/,/g, ''), 10) || 0;
      if (!acc[candidato] || votos > acc[candidato]) {
        acc[candidato] = votos;
      }
      return acc;
    }, {} as Record<string, number>);

    const liderancasOrdenadas = Object.entries(liderancas)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([candidato, votos]) => ({ candidato, votos }));

    // Preparar dados para a tabela
    const tabelaDados = data.map(row => {
      const votosStr = row['Expectativa de Votos 2026'] || '0';
      // Tratar valores com formato de milhar (ex: "2,000" -> 2000)
      const votosProcessado = parseInt(votosStr.replace(/,(\d{3})/g, '$1').replace(/\./g, '').replace(/,/g, ''), 10) || 0;
      
      console.log('Processando linha:', {
        municipio: row['Município'],
        lideranca: row['Liderança'],
        votosStr,
        votosProcessado
      });

      const item = {
        municipio: row['Município'],
        lideranca: row['Liderança'],
        liderancaAtual: row['Liderança Atual?']?.toLowerCase() === 'sim',
        cargo2024: row['Cargo 2024'],
        votos: votosProcessado,
        percentual: parseFloat(row['Percentual'] || '0'),
        tendencia: row['Tendência'] || '',
        projecao: votosProcessado
      };
      
      return item;
    });

    // Log do item específico do Prefeito Guilherme Maia
    const prefeitoGuilherme = tabelaDados.find(item => 
      item.municipio === 'WALL FERRAZ' && item.lideranca === 'Prefeito Guilherme Maia'
    );
    console.log('Dados do Prefeito Guilherme Maia:', prefeitoGuilherme);

    console.log('Exemplo de dados processados:', tabelaDados[0]);
    console.log('Dados processados com sucesso. Número de registros:', data.length);
    console.log('Retornando', data.length, 'itens de projeção obtidos com sucesso da API');

    return {
      totalVotos,
      totalMunicipios,
      mediaVotos,
      liderancas: liderancasOrdenadas,
      tabelaDados
    };
  } catch (error) {
    console.error('Erro ao obter dados da planilha:', error);
    throw error;
  }
} 