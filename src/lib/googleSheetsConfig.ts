import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { v4 as uuidv4 } from 'uuid';

// Configurações para a API do Google Sheets
const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com';
const GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSDLfQJGMDqCqM\ntIWAEcpguOP2SdSryQIO8Qw87ftyJMoOCSCxXP5CquNghZqPiSXriNzcNR1QAt5g\nmeABqHFjLCToJJ+UIh88XcHeF990wFs9Udul78oD7QccxZo/lS0DI7PdfmqnhE6k\naDV9/J6yRrkYvRkC8F89mm2oryniuZ7wU2BRSkX+t+ojyQlEj9G6cTN2oxCRnzL1\nsqPmRuyIz4NBSlaa09IDVKzM5ZsuWE2EASTRW+EyxqLQD2pPFoCGKbJUB2SJBRYn\ngC7oxdK8OatahJOQzSlCYSX3cpMJkUJww6khb4doAeqRckVLmNZqSwvTODO/vv92\nxYeBwdmzAgMBAAECggEAB8Wys3/1Lfh2ApjXa8K8w1F0FfPra6PXcKgYtNR1fmbA\nFz7dN9LiEaNzIGoxKuh/P7Tjvz4z5HcGtXpcIJOUBoBmqTRZt0h/8WLivo4Rladc\neOtjfkNeLUEDB1yEdZ/Wd4xFpod7+NDbfBfjCtNjJ+OYC8NLfqFYVNY3Aovgt+Pn\nQo3QWiJ8vb+BhDXSIXCU7XWdV/iIPwvBbPoQl+ruSx3jd69CUQTHeOTUyYxDnlem\n8aKvelNo/Fhx8LT7qZNjLtCAK02WsDFVF3my29V12IoUp+xT9XRupoms6N89ip1S\nUdWTJA44CiltB4n+h/hVyaDdAlZ0J66ppgEo/YWVIQKBgQDwdwNWmgv3tCbHiPb4\nkuGOesw8XcxizsZZ9rEIfr+se/qxzFqNOUml4C6pvAVEZt7xrGj+3XXx4+kzVw8h\nMs78+fNogjJ/OwnT/483fPPpPqeKxUCkqZx+QbOnQTVZTQifzR4csEocPF2pSgCH\nEHyqlkZ/La5HjImqn8oUIOjcgwKBgQDfnqzyZBLTR+bT4bnauMi4ooDh0PXnVvUW\n/gEf5JHj4pXWrLR1NvxzHONTyN/LJ9QCtpdKsFjdSCs1SggqA8hUwpzLsBNkbi1f\naxqhU+2avNAuGGGcKVbfQvB7l7bmkKHfbeyZCyFlpAtfr6LuDnglSXH0gNuvYQss\n3XEokJvnEQKBgFRuRULMFfWkUJVw9t5ynDXt0fZELPZoieaeoqxL7LsAURbKnOTH\nP5+5Zkj8lpDc2dzbX4ZVdgs3rfLz14EdmOXkUV3ZkSdxMFM6gSvHeNDlyegEuFzY\nnPUL1qucTsILNUL+v1rtXygo3e4J6MODu3IeD6SqAm5m3xOExWxp3blHAoGAahwn\nQNWPwUXrGDuSL2FjjYk+0uiO5vlyTzi0W+ff+ly4cSd+cehnnk/k5wr4drQtfCQc\nYkqPwGDQb/bzLMyisOWv9U9VxGArk42FE2x54OUbe+QB3VIYcNSYvGzfU0TqKtVE\nYdLQRCS1aPA0xfWDuV3CfxzuIahQ3zcszOzhraECgYEAzcqW8k4rPUTE3YEI0RrR\noZe1hH/0Qw3DNLWzBG9CuNr6UuPLaW8fZc0OEBG8P1mJfmwLtpgNK/ST8wrbgxIy\n3JQpWlvDyR+bfNqOqaMx85R6f6+EAs0nmxknTnKbjs7AVkwjpM4eXGhxFpMjqN5X\n3Jd2TlM7oumBvKKRfcLCzwo=\n-----END PRIVATE KEY-----\n';
const GOOGLE_SHEET_ID = '1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E';

// ID da planilha do Google Sheets
const ACOES_SPREADSHEET_ID = '1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E';

// Headers obrigatórios para a planilha de ações
const ACOES_HEADERS = [
  'id',
  'titulo',
  'descricao',
  'responsavel',
  'dataInicio',
  'dataFim',
  'status',
  'criadoEm',
  'atualizadoEm'
];

// Headers obrigatórios para a planilha de pessoas
const PESSOAS_HEADERS = [
  'id',
  'nome',
  'cpf',
  'dataNascimento',
  'genero',
  'endereco',
  'numero',
  'bairro',
  'municipio',
  'telefone',
  'email',
  'escolaridade',
  'rendaFamiliar',
  'observacoes',
  'acaoId',
  'acaoTitulo',
  'dataAgendamento',
  'hora',
  'local',
  'dataDoAtendimento',
  'criadoEm',
  'atualizadoEm',
  'naturalidade',
  'estadoCivil',
  'cargoOcupacao',
  'orgao'
];

// Headers obrigatórios para a planilha de atendimentos
const ATENDIMENTOS_HEADERS = [
  'id',
  'pessoaId',
  'dataAgendamento',
  'hora',
  'local',
  'observacoes',
  'dataDoAtendimento',
  'criadoEm',
  'atualizadoEm',
  'status' // "agendado", "realizado", "cancelado"
];

/**
 * Função para autenticar e conectar à API do Google Sheets
 */
export async function getGoogleSheetsClient(): Promise<GoogleSpreadsheet> {
  try {
    console.log('Iniciando autenticação com Google Sheets...');
    console.log('Email da conta de serviço:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
    
    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await auth.authorize();
    console.log('Autenticação bem-sucedida');

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    console.log('Planilha carregada com sucesso');
    
    return doc;
  } catch (error) {
    console.error('Erro ao conectar com o Google Sheets:', error);
    throw new Error('Falha ao conectar com o Google Sheets');
  }
}

/**
 * Função simplificada para garantir que a aba de ações exista
 */
export async function ensureAcoesSheetExists(): Promise<GoogleSpreadsheetWorksheet> {
  try {
    // Conectar à planilha
    console.log('Conectando ao Google Sheets...');
    const doc = await getGoogleSheetsClient();
    console.log('Conectado com sucesso. ID da planilha:', ACOES_SPREADSHEET_ID);
    
    // Verificar se a aba já existe
    let sheet: GoogleSpreadsheetWorksheet;
    
    try {
      // Tentar obter a aba pelo título
      console.log(`Buscando aba "${ACOES_CONFIG.SHEET_TITLE}"...`);
      sheet = doc.sheetsByTitle[ACOES_CONFIG.SHEET_TITLE];
      
      if (sheet) {
        console.log(`Aba "${ACOES_CONFIG.SHEET_TITLE}" encontrada.`);
      } else {
        console.log(`Aba "${ACOES_CONFIG.SHEET_TITLE}" não encontrada. Criando...`);
        // Criar uma nova aba com cabeçalhos
        sheet = await doc.addSheet({
          title: ACOES_CONFIG.SHEET_TITLE,
          headerValues: ACOES_HEADERS
        });
        console.log(`Aba "${ACOES_CONFIG.SHEET_TITLE}" criada com sucesso.`);
        return sheet; // Retornar imediatamente pois os cabeçalhos já estão configurados
      }
    } catch (error) {
      console.error(`Erro ao buscar/criar aba "${ACOES_CONFIG.SHEET_TITLE}":`, error);
      
      // Se houver erro, verificar se temos alguma aba disponível
      if (doc.sheetsByIndex.length > 0) {
        sheet = doc.sheetsByIndex[0];
        console.log(`Usando aba existente "${sheet.title}" como fallback.`);
        
        // Renomear a aba se necessário
        if (sheet.title !== ACOES_CONFIG.SHEET_TITLE) {
          try {
            await sheet.updateProperties({ title: ACOES_CONFIG.SHEET_TITLE });
            console.log(`Aba renomeada para "${ACOES_CONFIG.SHEET_TITLE}".`);
          } catch (renameError) {
            console.error('Erro ao renomear aba:', renameError);
            // Continuar usando a aba mesmo com o nome original
          }
        }
      } else {
        // Nenhuma aba disponível, tentar criar uma nova
        console.log('Nenhuma aba encontrada. Tentando criar uma nova...');
        sheet = await doc.addSheet({
          headerValues: ACOES_HEADERS  // Definir cabeçalhos na criação
        });
        await sheet.updateProperties({ title: ACOES_CONFIG.SHEET_TITLE });
        console.log(`Nova aba criada com título "${ACOES_CONFIG.SHEET_TITLE}".`);
        return sheet; // Retornar imediatamente pois os cabeçalhos já estão configurados
      }
    }
    
    // Se chegou aqui, é porque a planilha já existe. Vamos garantir que os cabeçalhos estejam corretos
    try {
      console.log('Carregando cabeçalhos da aba...');
      await sheet.loadHeaderRow();
      const headerValues = sheet.headerValues || [];
      console.log('Cabeçalhos atuais:', headerValues);
      
      // Verificamos se TODOS os cabeçalhos necessários estão presentes
      const missingHeaders = ACOES_HEADERS.filter(header => !headerValues.includes(header));
      
      if (missingHeaders.length > 0) {
        console.log(`Cabeçalhos ausentes: ${missingHeaders.join(', ')}. Reconfigurando cabeçalhos...`);
        
        // Em vez de apenas adicionar os cabeçalhos ausentes, vamos recriar a planilha
        // Primeiro, vamos fazer backup dos dados existentes
        const rows = await sheet.getRows();
        const existingData = rows.map(row => {
          const rowData: Record<string, any> = {};
          headerValues.forEach(header => {
            rowData[header] = row.get(header);
          });
          return rowData;
        });
        
        console.log(`Salvando ${existingData.length} linhas existentes antes de reconfigurar cabeçalhos.`);
        
        // Limpar a planilha existente
        for (const row of rows) {
          await row.delete();
        }
        
        // Definir os novos cabeçalhos
        await sheet.setHeaderRow(ACOES_HEADERS);
        console.log('Cabeçalhos configurados:', ACOES_HEADERS);
        
        // Restaurar dados existentes
        if (existingData.length > 0) {
          console.log('Restaurando dados existentes...');
          for (const data of existingData) {
            // Mapear os dados antigos para o novo esquema
            const newRowData: Record<string, any> = {};
            
            // Inicializar com valores padrão
            ACOES_HEADERS.forEach(header => {
              newRowData[header] = '';
            });
            
            // Copiar valores existentes
            Object.keys(data).forEach(key => {
              if (ACOES_HEADERS.includes(key)) {
                newRowData[key] = data[key];
              }
            });
            
            // Garantir que temos um ID
            if (!newRowData.id) {
              newRowData.id = uuidv4();
            }
            
            // Adicionar dados de auditoria se não existirem
            const now = new Date().toISOString();
            if (!newRowData.criadoEm) {
              newRowData.criadoEm = now;
            }
            if (!newRowData.atualizadoEm) {
              newRowData.atualizadoEm = now;
            }
            
            await sheet.addRow(newRowData);
          }
          console.log(`${existingData.length} linhas restauradas com sucesso.`);
        }
      }
    } catch (headerError) {
      console.error('Erro ao configurar cabeçalhos:', headerError);
      
      // Se falhar ao configurar cabeçalhos, criar uma nova aba
      try {
        console.log('Criando nova aba devido a erro nos cabeçalhos...');
        // Excluir a aba atual se possível
        try {
          await sheet.delete();
          console.log('Aba anterior excluída.');
        } catch (deleteError) {
          console.error('Erro ao excluir aba anterior:', deleteError);
          // Continuar mesmo se não conseguir excluir
        }
        
        // Criar nova aba
        sheet = await doc.addSheet({
          title: ACOES_CONFIG.SHEET_TITLE,
          headerValues: ACOES_HEADERS
        });
        console.log('Nova aba criada com cabeçalhos corretos.');
      } catch (recreateError) {
        console.error('Erro ao recriar a aba:', recreateError);
        throw new Error('Não foi possível configurar a planilha corretamente');
      }
    }
    
    return sheet;
  } catch (error) {
    console.error('Erro crítico ao configurar a aba de ações:', error);
    throw new Error('Falha ao inicializar a planilha de ações');
  }
}

/**
 * Função para obter uma planilha específica pelo título
 */
export async function getSheetByTitle(title: string): Promise<GoogleSpreadsheetWorksheet> {
  try {
    // Se for a planilha de ações, usar a função específica
    if (title === ACOES_CONFIG.SHEET_TITLE) {
      return await ensureAcoesSheetExists();
    }
    
    // Se for a planilha de pessoas, usar a função específica
    if (title === PESSOAS_CONFIG.SHEET_TITLE) {
      return await ensurePessoasSheetExists();
    }
    
    // Para outras planilhas
    const doc = await getGoogleSheetsClient();
    const sheet = doc.sheetsByTitle[title];
    
    if (!sheet) {
      throw new Error(`Planilha com título "${title}" não encontrada`);
    }
    
    return sheet;
  } catch (error) {
    console.error(`Erro ao obter planilha "${title}":`, error);
    throw new Error(`Falha ao obter planilha "${title}"`);
  }
}

/**
 * Configuração específica para a planilha de ações
 */
export const ACOES_CONFIG = {
  CLIENT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY || '',
  SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  SHEET_TITLE: 'acoes',
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
  CAMPOS_OBRIGATORIOS: ['titulo', 'descricao', 'responsavel', 'dataInicio', 'dataFim', 'status']
};

// Configuração para a aba de pessoas
export const PESSOAS_CONFIG = {
  CLIENT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY || '',
  SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  SHEET_TITLE: 'pessoas',
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
  HEADERS: PESSOAS_HEADERS,
  CAMPOS_OBRIGATORIOS: ['nome', 'cpf', 'bairro', 'municipio', 'telefone', 'email']
};

// Configuração para a aba de atendimentos
export const ATENDIMENTOS_CONFIG = {
  CLIENT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY || '',
  SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  SHEET_TITLE: 'atendimentos',
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
  HEADERS: ATENDIMENTOS_HEADERS,
  CAMPOS_OBRIGATORIOS: ['pessoaId', 'dataAgendamento', 'hora', 'local']
};

/**
 * Função para garantir que a aba de pessoas exista com os cabeçalhos corretos
 */
export async function ensurePessoasSheetExists(): Promise<GoogleSpreadsheetWorksheet> {
  try {
    // Conectar à planilha
    console.log('Conectando ao Google Sheets...');
    const doc = await getGoogleSheetsClient();
    console.log('Conectado com sucesso. ID da planilha:', ACOES_SPREADSHEET_ID);
    
    // Verificar se a aba já existe
    let sheet: GoogleSpreadsheetWorksheet;
    
    try {
      // Tentar obter a aba pelo título
      console.log(`Buscando aba "${PESSOAS_CONFIG.SHEET_TITLE}"...`);
      sheet = doc.sheetsByTitle[PESSOAS_CONFIG.SHEET_TITLE];
      
      if (sheet) {
        console.log(`Aba "${PESSOAS_CONFIG.SHEET_TITLE}" encontrada.`);
        // Carregar cabeçalhos existentes
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        console.log('Cabeçalhos atuais:', headers);
        
        // Verificar se todos os cabeçalhos necessários existem
        const missingHeaders = PESSOAS_CONFIG.HEADERS.filter(header => !headers.includes(header));
        
        if (missingHeaders.length > 0) {
          console.log(`Cabeçalhos ausentes: ${missingHeaders.join(', ')}. Atualizando...`);
          
          // Fazer backup dos dados existentes
          const rows = await sheet.getRows();
          console.log(`Backup de ${rows.length} linhas existentes...`);
          
          const existingData = rows.map(row => {
            const rowData: Record<string, any> = {};
            headers.forEach(header => {
              rowData[header] = row.get(header);
            });
            return rowData;
          });
          
          // Limpar a planilha
          console.log('Limpando planilha...');
          for (const row of rows) {
            await row.delete();
          }
          
          // Definir novos cabeçalhos
          console.log('Definindo novos cabeçalhos:', PESSOAS_CONFIG.HEADERS);
          await sheet.setHeaderRow(PESSOAS_CONFIG.HEADERS);
          
          // Restaurar dados existentes
          console.log('Restaurando dados existentes...');
          for (const data of existingData) {
            const newRowData: Record<string, any> = {};
            PESSOAS_CONFIG.HEADERS.forEach(header => {
              newRowData[header] = data[header] || '';
            });
            await sheet.addRow(newRowData);
          }
          console.log(`${existingData.length} linhas restauradas com sucesso.`);
        }
      } else {
        console.log(`Aba "${PESSOAS_CONFIG.SHEET_TITLE}" não encontrada. Criando...`);
        // Criar uma nova aba com cabeçalhos
        sheet = await doc.addSheet({
          title: PESSOAS_CONFIG.SHEET_TITLE,
          headerValues: PESSOAS_CONFIG.HEADERS
        });
        console.log(`Aba "${PESSOAS_CONFIG.SHEET_TITLE}" criada com sucesso.`);
      }
    } catch (error) {
      console.error('Erro ao verificar/criar aba:', error);
      throw error;
    }
    
    return sheet;
  } catch (error) {
    console.error('Erro ao configurar planilha:', error);
    throw error;
  }
}

/**
 * Função para garantir que a aba de atendimentos exista com os cabeçalhos corretos
 */
export async function ensureAtendimentosSheetExists(): Promise<GoogleSpreadsheetWorksheet> {
  try {
    console.log('Verificando existência da aba atendimentos...');
    const doc = await getGoogleSheetsClient();
    
    // Verificar se a aba existe
    let sheet: GoogleSpreadsheetWorksheet | null = doc.sheetsByTitle[ATENDIMENTOS_CONFIG.SHEET_TITLE];
    
    // Se a aba existir, verificar os cabeçalhos
    if (sheet) {
      try {
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        console.log('Cabeçalhos de atendimentos atuais:', headers);
        
        // Se não houver cabeçalhos ou estiverem incorretos, deletar a aba
        if (!headers || headers.length === 0 || !ATENDIMENTOS_CONFIG.HEADERS.every(header => headers.includes(header))) {
          console.log('Cabeçalhos de atendimentos inválidos ou ausentes. Recriando aba...');
          await sheet.delete();
          
          // Recarregar informações do documento após excluir
          await doc.loadInfo();
          sheet = null;
        }
      } catch (error) {
        console.log('Erro ao carregar cabeçalhos de atendimentos. Recriando aba...');
        if (sheet) {
        await sheet.delete();
        }
        
        // Recarregar informações do documento após excluir
        await doc.loadInfo();
        sheet = null;
      }
    }
    
    // Se a aba não existir ou foi deletada, criar nova
    if (!sheet) {
      console.log(`Criando nova aba "${ATENDIMENTOS_CONFIG.SHEET_TITLE}"...`);
      
      // Criar nova aba
      await doc.addSheet({
        title: ATENDIMENTOS_CONFIG.SHEET_TITLE,
        headerValues: ATENDIMENTOS_CONFIG.HEADERS
      });
      
      console.log(`Aba "${ATENDIMENTOS_CONFIG.SHEET_TITLE}" criada com sucesso.`);
      
      // Recarregar informações após criar a aba
      await doc.loadInfo();
      
      // Obter a nova aba
      sheet = doc.sheetsByTitle[ATENDIMENTOS_CONFIG.SHEET_TITLE];
      
      if (!sheet) {
        throw new Error('A aba criada não pôde ser encontrada após recarregar o documento');
      }
    }
    
    // Carregar cabeçalhos antes de retornar
    await sheet.loadHeaderRow();
    
    return sheet;
  } catch (error) {
    console.error('Erro ao configurar aba atendimentos:', error);
    throw error;
  }
} 