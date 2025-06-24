import { NextResponse } from 'next/server';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { PESSOAS_CONFIG, getGoogleSheetsClient, getSheetByTitle } from '@/lib/googleSheetsConfig';
import { v4 as uuidv4 } from 'uuid';
import { logUserActivity } from '@/lib/db/database';
import { headers } from 'next/headers';

// Interface para os dados da pessoa
interface PessoaData {
  nome: string;
  cpf: string;
  dataNascimento: string;
  genero: string;
  endereco: string;
  numero: string;
  bairro: string;
  municipio: string;
  telefone?: string;
  email?: string;
  escolaridade?: string;
  rendaFamiliar?: string;
  observacoes?: string;
  acaoId?: string;
  acaoTitulo?: string;
  dataAgendamento?: string;
  hora?: string;
  local?: string;
  dataDoAtendimento?: string;
  naturalidade?: string;
  estadoCivil?: string;
  cargoOcupacao?: string;
  orgao?: string;
}

// Função para garantir que a aba de pessoas existe com os cabeçalhos corretos
async function ensurePessoasSheetExists(): Promise<GoogleSpreadsheetWorksheet> {
  try {
    console.log('Verificando existência da aba pessoas...');
    const doc = await getGoogleSheetsClient();
    let sheet: GoogleSpreadsheetWorksheet | undefined = doc.sheetsByTitle[PESSOAS_CONFIG.SHEET_TITLE];
    
    // Se a aba existir, tentar carregar os cabeçalhos
    if (sheet) {
      try {
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        console.log('Cabeçalhos atuais:', headers);
        
        // Se não houver cabeçalhos ou estiverem incorretos, deletar a aba e criar novamente
        if (!headers || headers.length === 0 || !PESSOAS_CONFIG.HEADERS.every(header => headers.includes(header))) {
          console.log('Cabeçalhos inválidos ou ausentes. Recriando aba...');
          await sheet.delete();
          sheet = undefined;
        }
      } catch (error) {
        console.log('Erro ao carregar cabeçalhos. Recriando aba...');
        if (sheet) {
        await sheet.delete();
        sheet = undefined;
        }
      }
    }
    
    // Se não houver aba válida, criar uma nova
    if (!sheet) {
      console.log(`Criando nova aba "${PESSOAS_CONFIG.SHEET_TITLE}"...`);
      sheet = await doc.addSheet({
        title: PESSOAS_CONFIG.SHEET_TITLE,
        headerValues: PESSOAS_CONFIG.HEADERS
      });
      console.log(`Aba "${PESSOAS_CONFIG.SHEET_TITLE}" criada com sucesso.`);
    }
    
    // Garantir que os cabeçalhos estejam carregados antes de retornar
    if (!sheet) {
      throw new Error('Não foi possível criar ou acessar a aba de pessoas');
    }
    
    await sheet.loadHeaderRow();
    return sheet;
  } catch (error) {
    console.error('Erro ao configurar aba pessoas:', error);
    throw error;
  }
}

// Processa requisição POST para criar uma nova pessoa
export async function POST(request: Request) {
  try {
    console.log('=== INICIANDO PROCESSO DE CRIAÇÃO DE PESSOA ===');
    console.log('Recebendo solicitação para criar pessoa');
    
    // Extrair dados do corpo da requisição
    const data: PessoaData = await request.json();
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    // Validar campos obrigatórios
    const missingFields = PESSOAS_CONFIG.CAMPOS_OBRIGATORIOS.filter(field => !data[field as keyof PessoaData]);
    if (missingFields.length > 0) {
      console.log('Campos obrigatórios ausentes:', missingFields);
      return NextResponse.json({ 
        error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Conectar ao Google Sheets e obter a aba de pessoas
    console.log('Conectando ao Google Sheets...');
    const sheet = await ensurePessoasSheetExists();
    console.log('Conectado com sucesso ao Google Sheets');
    
    // Preparar a nova pessoa
    const novaPessoa = {
      id: uuidv4(),
      nome: data.nome,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento || '',
      genero: data.genero || '',
      endereco: data.endereco || '',
      numero: data.numero || '',
      bairro: data.bairro,
      municipio: data.municipio,
      telefone: data.telefone || '',
      email: data.email || '',
      escolaridade: data.escolaridade || '',
      rendaFamiliar: data.rendaFamiliar || '',
      observacoes: data.observacoes || '',
      acaoId: data.acaoId || '',
      acaoTitulo: data.acaoTitulo || '',
      dataAgendamento: data.dataAgendamento || '',
      hora: data.hora || '',
      local: data.local || '',
      dataDoAtendimento: data.dataDoAtendimento || '',
      naturalidade: data.naturalidade || '',
      estadoCivil: data.estadoCivil || '',
      cargoOcupacao: data.cargoOcupacao || '',
      orgao: data.orgao || '',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    console.log('Nova pessoa preparada:', JSON.stringify(novaPessoa, null, 2));
    
    // Adicionar a nova linha à planilha
    console.log('Adicionando nova pessoa à planilha...');
    try {
      const newRow = await sheet.addRow(novaPessoa);
      console.log('Pessoa adicionada com sucesso. ID:', novaPessoa.id);
      console.log('Row adicionada com índice:', (newRow as any)._rowNumber);
      
      // Obter sessão do usuário que realizou a operação
      const headersList = headers();
      const sessCookie = headersList.get('cookie') || '';
      const sessionReq = new Request('/api/auth', {
        headers: { cookie: sessCookie }
      });
      const sessionRes = await fetch(sessionReq);
      let userId = null;
      
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.isLoggedIn && sessionData.user) {
          userId = sessionData.user.id;
        }
      }
      
      // Registrar atividade de criação de pessoa
      await logUserActivity({
        user_id: userId,
        action_type: 'CREATE',
        target_type: 'PATIENT',
        target_id: undefined, // Não temos um ID numérico disponível
        details: `Pessoa criada: ${novaPessoa.nome} (CPF: ${novaPessoa.cpf}) - ID: ${novaPessoa.id}`,
        ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Pessoa criada com sucesso', 
        data: novaPessoa 
      });
    } catch (addError) {
      console.error('Erro ao adicionar linha na planilha:', addError);
      throw addError;
    }
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    return NextResponse.json({ 
      error: `Erro ao criar pessoa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/pessoas - Buscando pessoas');
    
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const acaoId = searchParams.get('acaoId');
    const termo = searchParams.get('termo');
    
    console.log('Parâmetros de busca:', { acaoId, termo });
    
    // Verificar se é uma busca por CPF
    const isCpfSearch = termo && /^\d+$/.test(termo) && termo.length >= 11;
    if (isCpfSearch) {
      console.log(`Detectada busca por CPF: ${termo}`);
    }
    
    // Conectar ao Google Sheets e obter a aba de pessoas
    const sheet = await ensurePessoasSheetExists();
    
    console.log('Conectado com sucesso. ID da planilha:', process.env.GOOGLE_SHEET_ID);

    // Carregar cabeçalhos
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    console.log('Cabeçalhos atuais:', headers);

    // Buscar todas as pessoas
    const rows = await sheet.getRows();
    console.log(`Encontradas ${rows.length} pessoas na planilha`);

    // Mapear os dados para o formato correto
    let pessoas = rows.map((row: any) => {
      return {
        id: row.get('id') || '',
        nome: row.get('nome') || '',
        cpf: row.get('cpf') || '',
        dataNascimento: row.get('dataNascimento') || '',
        genero: row.get('genero') || '',
        endereco: row.get('endereco') || '',
        numero: row.get('numero') || '',
        bairro: row.get('bairro') || '',
        municipio: row.get('municipio') || '',
        telefone: row.get('telefone') || '',
        email: row.get('email') || '',
        escolaridade: row.get('escolaridade') || '',
        rendaFamiliar: row.get('rendaFamiliar') || '',
        observacoes: row.get('observacoes') || '',
        acaoId: row.get('acaoId') || '',
        acaoTitulo: row.get('acaoTitulo') || '',
        dataAgendamento: row.get('dataAgendamento') || '',
        hora: row.get('hora') || '',
        local: row.get('local') || '',
        dataDoAtendimento: row.get('dataDoAtendimento') || '',
        naturalidade: row.get('naturalidade') || '',
        estadoCivil: row.get('estadoCivil') || '',
        cargoOcupacao: row.get('cargoOcupacao') || '',
        orgao: row.get('orgao') || '',
        criadoEm: row.get('criadoEm') || '',
        atualizadoEm: row.get('atualizadoEm') || ''
      };
    });

    // Filtrar por acaoId se fornecido
    if (acaoId) {
      console.log(`Filtrando pessoas pela ação ID: ${acaoId}`);
      pessoas = pessoas.filter(pessoa => pessoa.acaoId === acaoId);
      console.log(`Encontradas ${pessoas.length} pessoas para a ação ${acaoId}`);
    }
    
    // Filtrar por termo de busca (nome ou CPF) se fornecido
    if (termo && termo.length >= 3) {
      console.log(`Filtrando pessoas pelo termo: "${termo}"`);
      
      // Se for um CPF, buscar com correspondência exata
      if (isCpfSearch) {
        const cpfNormalizado = termo.replace(/\D/g, '');
        console.log(`Buscando por CPF normalizado: ${cpfNormalizado}`);
        
        // Verificar CPFs exatos primeiro
        const pessoasComCpfExato = pessoas.filter(pessoa => {
          const pessoaCpfNormalizado = pessoa.cpf.replace(/\D/g, '');
          return pessoaCpfNormalizado === cpfNormalizado;
        });
        
        if (pessoasComCpfExato.length > 0) {
          console.log(`Encontradas ${pessoasComCpfExato.length} pessoas com CPF exato: ${cpfNormalizado}`);
          pessoas = pessoasComCpfExato;
          
          // Logar os CPFs encontrados para depuração
          pessoasComCpfExato.forEach(p => {
            console.log(`CPF encontrado: ${p.cpf} (ID: ${p.id}, Nome: ${p.nome})`);
          });
        } else {
          // Se não encontrar exato, busca parcial
          const termoLowerCase = termo.toLowerCase();
          pessoas = pessoas.filter(pessoa => 
            pessoa.nome.toLowerCase().includes(termoLowerCase) || 
            pessoa.cpf.includes(termo)
          );
          console.log(`CPF exato não encontrado. Encontradas ${pessoas.length} pessoas para o termo parcial "${termo}"`);
        }
      } else {
        // Busca por nome
        const termoLowerCase = termo.toLowerCase();
        pessoas = pessoas.filter(pessoa => 
          pessoa.nome.toLowerCase().includes(termoLowerCase) || 
          pessoa.cpf.includes(termo)
        );
        console.log(`Encontradas ${pessoas.length} pessoas para o termo "${termo}"`);
      }
    }

    return NextResponse.json(pessoas);
  } catch (error) {
    console.error('Erro ao buscar pessoas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pessoas' },
      { status: 500 }
    );
  }
} 