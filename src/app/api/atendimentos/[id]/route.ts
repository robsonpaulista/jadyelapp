import { NextRequest, NextResponse } from 'next/server';
import { ensureAtendimentosSheetExists, ATENDIMENTOS_CONFIG, getGoogleSheetsClient } from '@/lib/googleSheetsConfig';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';
import { logUserActivity } from '@/lib/db/database';
import { headers } from 'next/headers';

// Obter um atendimento específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`GET /api/atendimentos/${id} - Buscando atendimento específico`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de atendimento não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar atendimento por ID
    const atendimento = await buscarAtendimentoPorId(id);
    
    if (!atendimento) {
      return NextResponse.json(
        { error: 'Atendimento não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(atendimento);
  } catch (error) {
    console.error(`Erro ao buscar atendimento: ${error}`);
    return NextResponse.json(
      { error: 'Erro ao buscar atendimento' },
      { status: 500 }
    );
  }
}

// Atualizar um atendimento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`PUT /api/atendimentos/${id} - Atualizando atendimento`);
    
    // Extrair dados do corpo da requisição
    const dadosAtualizados = await request.json();
    console.log('Dados recebidos para atualização:', dadosAtualizados);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de atendimento não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar e atualizar o atendimento
    const atendimentoAtualizado = await atualizarAtendimento(id, dadosAtualizados);
    
    if (!atendimentoAtualizado) {
      return NextResponse.json(
        { error: 'Atendimento não encontrado' },
        { status: 404 }
      );
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
    
    // Criar um resumo das alterações
    const alteracoes = Object.keys(dadosAtualizados)
      .filter(key => ATENDIMENTOS_CONFIG.HEADERS.includes(key) && key !== 'id')
      .map(key => `${key}: ${dadosAtualizados[key]}`)
      .join(', ');
    
    // Registrar atividade de atualização de atendimento
    await logUserActivity({
      user_id: userId,
      action_type: 'UPDATE',
      target_type: 'PATIENT',
      target_id: parseInt(atendimentoAtualizado.pessoaId) || undefined,
      details: `Atendimento atualizado: ${id} - Alterações: ${alteracoes}`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
    });
    
    return NextResponse.json(atendimentoAtualizado);
  } catch (error) {
    console.error(`Erro ao atualizar atendimento: ${error}`);
    return NextResponse.json(
      { error: 'Erro ao atualizar atendimento' },
      { status: 500 }
    );
  }
}

// Função auxiliar para buscar um atendimento por ID
async function buscarAtendimentoPorId(id: string) {
  console.log(`Buscando atendimento com ID: ${id}`);
  
  try {
    // Obter a aba de atendimentos
    const sheet = await ensureAtendimentosSheetExists();
    
    // Forçar recarga dos dados da planilha
    await sheet.resetLocalCache();
    
    // Recarregar informações do documento para garantir consistência
    const doc = await getGoogleSheetsClient();
    await doc.loadInfo();
    
    // Obter a planilha atualizada após recarregar
    const updatedSheet = doc.sheetsByTitle[ATENDIMENTOS_CONFIG.SHEET_TITLE];
    
    // Carregar todas as linhas
    await updatedSheet.loadHeaderRow();
    const rows = await updatedSheet.getRows();
    
    console.log(`Total de linhas carregadas: ${rows.length}`);
    
    // Buscar a linha correspondente ao ID
    const row = rows.find((row: any) => row.get('id') === id);
    
    if (!row) {
      console.log(`Atendimento com ID ${id} não encontrado`);
      return null;
    }
    
    console.log(`Atendimento encontrado`);
    
    // Converter a linha em um objeto de atendimento
    const atendimento: any = {};
    ATENDIMENTOS_CONFIG.HEADERS.forEach(header => {
      atendimento[header] = row.get(header) || '';
    });
    
    return atendimento;
  } catch (error) {
    console.error(`Erro ao buscar atendimento: ${error}`);
    throw error;
  }
}

// Função auxiliar para atualizar um atendimento
async function atualizarAtendimento(id: string, dadosAtualizados: any) {
  console.log(`Buscando atendimento com ID: ${id}`);
  
  try {
    // Obter o documento do Google Sheets
    const doc = await getGoogleSheetsClient();
    await doc.loadInfo();
    
    // Obter a planilha de atendimentos
    const sheet = doc.sheetsByTitle[ATENDIMENTOS_CONFIG.SHEET_TITLE];
    
    if (!sheet) {
      console.error(`Aba ${ATENDIMENTOS_CONFIG.SHEET_TITLE} não encontrada`);
      return null;
    }
    
    // Carregar cabeçalhos e todas as linhas
    await sheet.loadHeaderRow();
    console.log('Cabeçalhos carregados:', sheet.headerValues);
    
    const rows = await sheet.getRows();
    console.log(`Total de linhas carregadas: ${rows.length}`);
    
    // Buscar a linha correspondente ao ID
    const row = rows.find((row: any) => row.get('id') === id);
    
    if (!row) {
      console.log(`Atendimento com ID ${id} não encontrado`);
      return null;
    }
    
    console.log(`Atendimento encontrado`);
    
    // Atualizar os campos do atendimento
    const camposParaAtualizar = Object.keys(dadosAtualizados).filter(
      campo => ATENDIMENTOS_CONFIG.HEADERS.includes(campo) && campo !== 'id'
    );
    
    // Atualizar cada campo
    for (const campo of camposParaAtualizar) {
      const valorAtual = row.get(campo);
      const novoValor = dadosAtualizados[campo];
      
      console.log(`Atualizando campo ${campo}: "${valorAtual}" -> "${novoValor}"`);
      row.set(campo, novoValor);
    }
    
    // Atualizar timestamp
    row.set('atualizadoEm', new Date().toISOString());
    
    // Salvar as alterações
    console.log('Salvando alterações na planilha...');
    await row.save();
    console.log('Alterações salvas com sucesso');
    
    // Criar o objeto de retorno com os dados atualizados
    // Usamos os valores do objeto original + os valores atualizados para garantir consistência
    const atendimentoAtualizado: Record<string, any> = {};
    
    // Primeiro preenchemos com os valores originais
    ATENDIMENTOS_CONFIG.HEADERS.forEach(header => {
      atendimentoAtualizado[header] = row.get(header) || '';
    });
    
    console.log(`Atendimento atualizado com sucesso: ${atendimentoAtualizado.id}`);
    
    return atendimentoAtualizado;
  } catch (error) {
    console.error(`Erro ao atualizar atendimento: ${error}`);
    throw error;
  }
}

// Excluir um atendimento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`DELETE /api/atendimentos/${id} - Excluindo atendimento`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de atendimento não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar o atendimento antes de excluir para obter informações
    const atendimento = await buscarAtendimentoPorId(id);
    
    if (!atendimento) {
      return NextResponse.json(
        { error: 'Atendimento não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter o documento do Google Sheets
    const doc = await getGoogleSheetsClient();
    await doc.loadInfo();
    
    // Obter a planilha de atendimentos
    const sheet = doc.sheetsByTitle[ATENDIMENTOS_CONFIG.SHEET_TITLE];
    
    if (!sheet) {
      return NextResponse.json(
        { error: 'Aba de atendimentos não encontrada' },
        { status: 404 }
      );
    }
    
    // Carregar todas as linhas
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    // Buscar a linha correspondente ao ID
    const rowIndex = rows.findIndex((row: any) => row.get('id') === id);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Atendimento não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir a linha
    await rows[rowIndex].delete();
    console.log(`Atendimento com ID ${id} excluído com sucesso`);
    
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
    
    // Registrar atividade de exclusão de atendimento
    await logUserActivity({
      user_id: userId,
      action_type: 'DELETE',
      target_type: 'PATIENT',
      target_id: parseInt(atendimento.pessoaId) || undefined,
      details: `Atendimento excluído: ${id} - Paciente ID: ${atendimento.pessoaId} - Data: ${atendimento.dataAgendamento || 'N/A'}`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
    });
    
    return NextResponse.json({ success: true, message: 'Atendimento excluído com sucesso' });
  } catch (error) {
    console.error(`Erro ao excluir atendimento: ${error}`);
    return NextResponse.json(
      { error: 'Erro ao excluir atendimento' },
      { status: 500 }
    );
  }
} 