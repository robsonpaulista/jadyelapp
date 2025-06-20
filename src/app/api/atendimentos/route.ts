import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ensureAtendimentosSheetExists, ATENDIMENTOS_CONFIG, getGoogleSheetsClient } from '@/lib/googleSheetsConfig';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';
import { logUserActivity } from '@/lib/db/database';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/atendimentos - Buscando atendimentos');
    
    // Extrair parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const pessoaId = searchParams.get('pessoaId');
    
    console.log('Parâmetros de busca:', { pessoaId });
    
    // Obter o documento do Google Sheets
    const doc = await getGoogleSheetsClient();
    await doc.loadInfo();
    
    // Obter a aba de atendimentos
    const sheet = doc.sheetsByTitle[ATENDIMENTOS_CONFIG.SHEET_TITLE];
    
    if (!sheet) {
      console.log('Aba de atendimentos não encontrada. Retornando array vazio.');
      return NextResponse.json([]);
    }
    
    // Carregar cabeçalhos e linhas
    try {
      await sheet.loadHeaderRow();
      console.log('Cabeçalhos de atendimentos atuais:', sheet.headerValues);
      
      // Verificar se a aba contém os cabeçalhos esperados
      if (!sheet.headerValues || !sheet.headerValues.includes('id')) {
        console.error('Erro: Cabeçalhos incorretos na aba de atendimentos');
        return NextResponse.json([]);
      }
      
      // Carregar todas as linhas
      const rows = await sheet.getRows();
      console.log(`Total de linhas carregadas: ${rows.length}`);
      
      // Converter as linhas em objetos de atendimento
      const atendimentos = rows.map(row => {
        const atendimento: Record<string, any> = {};
        ATENDIMENTOS_CONFIG.HEADERS.forEach(header => {
          atendimento[header] = row.get(header) || '';
        });
        return atendimento;
      });
      
      // Filtrar por pessoaId se fornecido
      const atendimentosFiltrados = pessoaId 
        ? atendimentos.filter(a => a.pessoaId === pessoaId)
        : atendimentos;
      
      console.log(`Encontrados ${atendimentosFiltrados.length} atendimentos${pessoaId ? ` para o paciente ${pessoaId}` : ''}`);
      
      return NextResponse.json(atendimentosFiltrados);
    } catch (error) {
      console.error('Erro ao processar dados da planilha:', error);
      
      // Se houver erro ao carregar os cabeçalhos ou linhas, retornar array vazio
      const atendimentosVazio: any[] = [];
      console.log(`Retornando array vazio devido a erro no processamento`);
      return NextResponse.json(atendimentosVazio);
    }
  } catch (error) {
    console.error(`Erro ao buscar atendimentos: ${error}`);
    return NextResponse.json(
      { error: 'Erro ao buscar atendimentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/atendimentos - Criando novo atendimento');
    
    // Extrair dados do corpo da requisição
    const data = await request.json();
    
    // Verificar campos obrigatórios
    const camposObrigatorios = ATENDIMENTOS_CONFIG.CAMPOS_OBRIGATORIOS;
    const camposFaltando = camposObrigatorios.filter(campo => !data[campo]);
    
    if (camposFaltando.length > 0) {
      console.error(`Campos obrigatórios faltando: ${camposFaltando.join(', ')}`);
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${camposFaltando.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Gerar ID e timestamps
    const novoAtendimento = {
      ...data,
      id: uuidv4(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      status: data.status || 'agendado'
    };
    
    console.log('Novo atendimento:', novoAtendimento);
    
    try {
      // Obter o documento do Google Sheets
      const doc = await getGoogleSheetsClient();
      await doc.loadInfo();
      
      // Obter a aba de atendimentos ou criar se não existir
      let sheet = doc.sheetsByTitle[ATENDIMENTOS_CONFIG.SHEET_TITLE];
      
      if (!sheet) {
        console.log(`Criando nova aba "${ATENDIMENTOS_CONFIG.SHEET_TITLE}"...`);
        sheet = await doc.addSheet({
          title: ATENDIMENTOS_CONFIG.SHEET_TITLE,
          headerValues: ATENDIMENTOS_CONFIG.HEADERS
        });
        console.log(`Aba "${ATENDIMENTOS_CONFIG.SHEET_TITLE}" criada com sucesso.`);
      }
      
      // Garantir que os cabeçalhos estejam carregados
      await sheet.loadHeaderRow();
      const headerValues = sheet.headerValues || [];
      console.log('Cabeçalhos de atendimentos atuais:', headerValues);
      
      // Verificar se todos os cabeçalhos necessários estão presentes
      const missingHeaders = ATENDIMENTOS_CONFIG.HEADERS.filter(header => !headerValues.includes(header));
      
      if (missingHeaders.length > 0) {
        console.log(`Cabeçalhos ausentes: ${missingHeaders.join(', ')}. Configurando cabeçalhos...`);
        await sheet.setHeaderRow(ATENDIMENTOS_CONFIG.HEADERS);
        console.log('Cabeçalhos atualizados.');
      }
      
      // Adicionar nova linha com formato adequado
      console.log('Adicionando novo atendimento à planilha...');
      
      // Criar o objeto de linha para adicionar à planilha
      const rowValues: Record<string, any> = {};
      ATENDIMENTOS_CONFIG.HEADERS.forEach(header => {
        rowValues[header] = novoAtendimento[header] || '';
      });
      
      // Adicionar a linha usando o método que cria um objeto de linha
      const novaLinha = await sheet.addRow(rowValues);
      
      // Salvar explicitamente para garantir que os dados sejam gravados
      await novaLinha.save();
      
      console.log(`Atendimento adicionado com sucesso. ID: ${novoAtendimento.id}`);
      
      // Verificar se a linha foi realmente adicionada
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();
      const atendimentoAdicionado = rows.find(row => row.get('id') === novoAtendimento.id);
      
      if (!atendimentoAdicionado) {
        console.error('Aviso: Atendimento não foi encontrado após adição!');
      } else {
        console.log(`Confirmado: Atendimento ID ${novoAtendimento.id} encontrado na planilha`);
      }
      
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
      
      // Registrar atividade de criação de atendimento
      await logUserActivity({
        user_id: userId,
        action_type: 'CREATE',
        target_type: 'PATIENT',
        target_id: parseInt(novoAtendimento.pessoaId) || undefined,
        details: `Atendimento criado: ${novoAtendimento.id} - Paciente ID: ${novoAtendimento.pessoaId} - Data: ${novoAtendimento.dataAgendamento}`,
        ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
      });
      
      return NextResponse.json(novoAtendimento);
    } catch (error) {
      console.error('Erro ao adicionar atendimento na planilha:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar atendimento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar atendimento' },
      { status: 500 }
    );
  }
} 