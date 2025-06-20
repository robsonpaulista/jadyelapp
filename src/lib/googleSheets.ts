import { google } from 'googleapis';
import { ProjecaoData } from '@/types/projecao';

// Inicializar o cliente do Google Sheets
let sheets: any = null;

async function initializeSheets() {
  if (!sheets) {
    // Configurar credenciais diretamente
    const auth = new google.auth.JWT(
      process.env.OBRAS_SHEET_CLIENT_EMAIL,
      undefined,
      process.env.OBRAS_SHEET_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    sheets = google.sheets({ version: 'v4', auth });
  }
  return sheets;
}

// Função para testar a conexão com o Google Sheets
export async function testeConexao() {
  try {
    console.log('=== TESTANDO CONEXÃO COM GOOGLE SHEETS ===');
    console.log('Client Email:', process.env.OBRAS_SHEET_CLIENT_EMAIL);
    console.log('Project ID:', process.env.OBRAS_SHEET_PROJECT_ID);
    console.log('Private Key configurada:', process.env.OBRAS_SHEET_PRIVATE_KEY ? 'Sim' : 'Não');

    const sheets = await initializeSheets();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.OBRAS_SHEET_ID,
    });

    console.log('Conexão bem sucedida!');
    console.log('Informações da planilha:', {
      spreadsheetId: response.data.spreadsheetId,
      title: response.data.properties?.title,
      locale: response.data.properties?.locale,
      timeZone: response.data.properties?.timeZone,
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Erro ao testar conexão:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      stack: error?.stack
    });
    return { success: false, error };
  }
}

// Interface para o tipo sheet
interface SheetProperties {
  properties?: {
    title?: string;
  };
}

// Função para listar as abas da planilha
export async function listarAbas(sheetId?: string): Promise<string[]> {
  try {
    console.log('Listando abas da planilha...');
    const idToUse = sheetId || process.env.OBRAS_SHEET_ID;
    console.log('ID da planilha:', idToUse);
    
    const sheets = await initializeSheets();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: idToUse,
    });
    
    const abas = response.data.sheets?.map((sheet: SheetProperties) => sheet.properties?.title || '') || [];
    console.log('Abas encontradas:', abas);
    return abas;
  } catch (error) {
    console.error('Erro ao listar abas:', error);
    return [];
  }
}

// Função para obter dados da planilha
async function getSheetData(spreadsheetId: string, range: string) {
  const sheets = await initializeSheets();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      
  return response.data.values;
}

// Função para obter dados de projeção de votos
export async function getProjecaoVotos() {
  try {
    const sheetId = process.env.PROJECAO_SHEET_ID;
    const sheetName = process.env.PROJECAO_SHEET_NAME;
    const columns = process.env.PROJECAO_SHEET_COLUMNS?.split(',') || [];

    if (!sheetId || !sheetName || columns.length === 0) {
      throw new Error('Configuração da planilha incompleta');
    }

    console.log('=== INICIANDO API DE PROJEÇÃO DE VOTOS ===');
    console.log('ID da planilha configurado:', sheetId);
    console.log('Nome da aba configurada:', sheetName);
    console.log('Email da conta de serviço:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
    console.log('Colunas configuradas:', columns.join(','));

    // Primeiro, vamos listar as abas disponíveis
    const abas = await listarAbas();
    console.log('Abas disponíveis:', abas);

    // Verificar se a aba existe
    if (!abas.includes(sheetName)) {
      throw new Error(`A aba "${sheetName}" não foi encontrada na planilha. Abas disponíveis: ${abas.join(', ')}`);
    }

    // Usar o nome exato da aba sem codificação
    const range = `${sheetName}!A:Z`;

    console.log('Range a ser usado:', range);

    const data = await getSheetData(sheetId, range);
    if (!data) {
      throw new Error('Erro ao obter dados da planilha');
    }

    console.log('Dados obtidos com sucesso. Número de linhas:', data.length);

    const projecaoData: ProjecaoData[] = [];
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowData: Record<string, string> = {};

      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index] || '';
      });

      projecaoData.push({
        municipio: rowData[columns[0]] || '',
        lideranca: rowData[columns[1]] || '',
        cargo2024: rowData[columns[2]] || '',
        votosProjetados: parseInt(rowData[columns[3]] || '0'),
        votacao2022: parseInt(rowData[columns[4]] || '0'),
      });
    }

    console.log('Dados processados com sucesso. Número de registros:', projecaoData.length);
    return projecaoData;
  } catch (error) {
    console.error('Erro na API de projeção:', error);
    throw error;
  }
}

// Interface simples para qualquer dado da planilha
export interface ObraDemanda {
  'Coluna 1'?: string;
  'ID': string;
  'DATA DEMANDA': string;
  'STATUS': string;
  'SOLICITAÇÃO': string;
  'OBS STATUS': string;
  'MUNICIPIO': string;
  'LIDERANÇA': string;
  'LIDERANÇA URNA': string;
  'PAUTA': string;
  'AÇÃO/OBJETO': string;
  'NÍVEL ESPAÇO': string;
  'ESFERA': string;
  'VALOR ': string;
  'ÓRGAO ': string;
  'PREVISÃO': string;
  'USUÁRIO': string;
}

export async function getObrasDemandas(): Promise<ObraDemanda[]> {
  try {
    const sheetId = process.env.OBRAS_SHEET_ID;
    const sheetName = process.env.OBRAS_SHEET_NAME || 'Cadastro de demandas';

    if (!sheetId) {
      throw new Error('ID da planilha não configurado');
    }

    // Pegar todos os dados da planilha
    const data = await getSheetData(sheetId, `${sheetName}!A:Z`);

    if (!data || data.length <= 1) {
      throw new Error('Nenhum dado encontrado na planilha');
    }

    // Pegar os headers da primeira linha
    const headers = data[0] as string[];
    console.log('\nColunas na planilha:', headers);

    // Converter os dados em objetos usando os headers exatos da planilha
    const obras = data.slice(1).map((row: string[]) => {
      const obra: ObraDemanda = {
        'ID': '',
        'DATA DEMANDA': '',
        'STATUS': '',
        'SOLICITAÇÃO': '',
        'OBS STATUS': '',
        'MUNICIPIO': '',
        'LIDERANÇA': '',
        'LIDERANÇA URNA': '',
        'PAUTA': '',
        'AÇÃO/OBJETO': '',
        'NÍVEL ESPAÇO': '',
        'ESFERA': '',
        'VALOR ': '',
        'ÓRGAO ': '',
        'PREVISÃO': '',
        'USUÁRIO': ''
      };
      
      headers.forEach((header: string, index: number) => {
        if (header && header.trim() && row[index]) {
          (obra as any)[header] = row[index];
        }
      });

      return obra;
    });

    // Mostrar informações para debug
    if (obras.length > 0) {
      console.log('\nPrimeiro registro:', obras[0]);
      console.log('\nTotal de registros:', obras.length);
    }

    return obras;
  } catch (error) {
    console.error('Erro ao obter dados:', error);
    throw error;
  }
}

// Função para gerar dados mock para obras e demandas
export function getMockObrasDemandas(): ObraDemanda[] {
  return [
    {
      'ID': '001',
      'DATA DEMANDA': '01/01/2023',
      'STATUS': 'Em andamento',
      'SOLICITAÇÃO': 'Construção de escola',
      'OBS STATUS': 'Aguardando liberação de recursos',
      'MUNICIPIO': 'São Paulo',
      'LIDERANÇA': 'João Silva',
      'LIDERANÇA URNA': 'João Silva',
      'PAUTA': 'Educação',
      'AÇÃO/OBJETO': 'Construção',
      'NÍVEL ESPAÇO': 'Municipal',
      'ESFERA': 'Municipal',
      'VALOR ': '500000',
      'ÓRGAO ': 'Secretaria de Educação',
      'PREVISÃO': '12/2023',
      'USUÁRIO': 'admin'
    },
    {
      'ID': '002',
      'DATA DEMANDA': '15/02/2023',
      'STATUS': 'Concluído',
      'SOLICITAÇÃO': 'Reforma de posto de saúde',
      'OBS STATUS': 'Obra finalizada',
      'MUNICIPIO': 'Rio de Janeiro',
      'LIDERANÇA': 'Maria Oliveira',
      'LIDERANÇA URNA': 'Maria Oliveira',
      'PAUTA': 'Saúde',
      'AÇÃO/OBJETO': 'Reforma',
      'NÍVEL ESPAÇO': 'Estadual',
      'ESFERA': 'Estadual',
      'VALOR ': '250000',
      'ÓRGAO ': 'Secretaria de Saúde',
      'PREVISÃO': '06/2023',
      'USUÁRIO': 'admin'
    },
    {
      'ID': '003',
      'DATA DEMANDA': '10/03/2023',
      'STATUS': 'Não iniciado',
      'SOLICITAÇÃO': 'Pavimentação de rua',
      'OBS STATUS': 'Aguardando licitação',
      'MUNICIPIO': 'Belo Horizonte',
      'LIDERANÇA': 'Pedro Santos',
      'LIDERANÇA URNA': 'Pedro Santos',
      'PAUTA': 'Infraestrutura',
      'AÇÃO/OBJETO': 'Pavimentação',
      'NÍVEL ESPAÇO': 'Municipal',
      'ESFERA': 'Municipal',
      'VALOR ': '300000',
      'ÓRGAO ': 'Secretaria de Obras',
      'PREVISÃO': '03/2024',
      'USUÁRIO': 'admin'
    },
    {
      'ID': '004',
      'DATA DEMANDA': '05/04/2023',
      'STATUS': 'Em andamento',
      'SOLICITAÇÃO': 'Construção de praça',
      'OBS STATUS': 'Em fase de execução',
      'MUNICIPIO': 'Curitiba',
      'LIDERANÇA': 'Ana Souza',
      'LIDERANÇA URNA': 'Ana Souza',
      'PAUTA': 'Lazer',
      'AÇÃO/OBJETO': 'Construção',
      'NÍVEL ESPAÇO': 'Municipal',
      'ESFERA': 'Municipal',
      'VALOR ': '150000',
      'ÓRGAO ': 'Secretaria de Urbanismo',
      'PREVISÃO': '09/2023',
      'USUÁRIO': 'admin'
    },
    {
      'ID': '005',
      'DATA DEMANDA': '20/05/2023',
      'STATUS': 'Aprovado',
      'SOLICITAÇÃO': 'Aquisição de ambulâncias',
      'OBS STATUS': 'Aguardando entrega',
      'MUNICIPIO': 'Salvador',
      'LIDERANÇA': 'Carlos Lima',
      'LIDERANÇA URNA': 'Carlos Lima',
      'PAUTA': 'Saúde',
      'AÇÃO/OBJETO': 'Aquisição',
      'NÍVEL ESPAÇO': 'Estadual',
      'ESFERA': 'Estadual',
      'VALOR ': '450000',
      'ÓRGAO ': 'Secretaria de Saúde',
      'PREVISÃO': '08/2023',
      'USUÁRIO': 'admin'
    }
  ];
} 