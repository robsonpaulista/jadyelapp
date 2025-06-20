import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSheetByTitle, PESSOAS_CONFIG } from '@/lib/googleSheetsConfig';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';
import { logUserActivity } from '@/lib/db/database';
import { headers } from 'next/headers';

// Função para encontrar uma pessoa pelo ID na planilha
async function findPersonById(id: string) {
  console.log(`Buscando pessoa com ID: ${id}`);
  
  try {
    // Conectar ao Google Sheets
    console.log('Conectando ao Google Sheets...');
    const doc = await getGoogleSheetsClient();
    await doc.loadInfo();
    
    // Obter a aba de pessoas
    console.log('Buscando aba "pessoas"...');
    const sheet = doc.sheetsByTitle[PESSOAS_CONFIG.SHEET_TITLE];
    
    if (!sheet) {
      console.error('Aba "pessoas" não encontrada.');
      return null;
    }
    
    console.log('Aba "pessoas" encontrada.');
    
    // Carregar cabeçalhos e linhas
    await sheet.loadHeaderRow();
    console.log('Cabeçalhos atuais:', sheet.headerValues);
    
    // Carregar todas as linhas
    const rows = await sheet.getRows();
    
    // Buscar a linha com o ID correspondente
    const rowIndex = rows.findIndex(row => row.get('id') === id);
    
    if (rowIndex === -1) {
      console.log(`Pessoa com ID ${id} não encontrada.`);
      return null;
    }
    
    console.log(`Pessoa encontrada na linha ${rowIndex + 2}`);
    
    return { row: rows[rowIndex], index: rowIndex };
  } catch (error) {
    console.error(`Erro ao buscar pessoa com ID ${id}:`, error);
    throw error;
  }
}

// Endpoint GET para buscar uma pessoa específica por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/pessoas/${params.id} - Buscando pessoa específica`);
    
    // Encontrar a pessoa na planilha
    const result = await findPersonById(params.id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Pessoa não encontrada' },
        { status: 404 }
      );
    }
    
    const { row } = result;
    
    // Converter a linha para objeto
    const pessoa: Record<string, any> = {};
    
    // Verificar se headerValues estão disponíveis
    try {
      const sheet = (row as any)._sheet;
      if (sheet && sheet.headerValues) {
        const headers = sheet.headerValues;
        headers.forEach((header: string) => {
          pessoa[header] = row.get(header) || '';
        });
      } else {
        console.error('Erro: headerValues não encontrado na planilha');
        // Usar os headers padrão definidos na configuração
        PESSOAS_CONFIG.HEADERS.forEach(header => {
          pessoa[header] = row.get(header) || '';
        });
      }
    } catch (headerError) {
      console.error('Erro ao acessar headers da planilha:', headerError);
      // Usar os headers padrão definidos na configuração
      PESSOAS_CONFIG.HEADERS.forEach(header => {
        pessoa[header] = row.get(header) || '';
      });
    }
    
    return NextResponse.json(pessoa);
  } catch (error) {
    console.error(`Erro ao buscar pessoa com ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erro ao buscar pessoa' },
      { status: 500 }
    );
  }
}

// Endpoint PUT para atualizar uma pessoa existente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/pessoas/${params.id} - Atualizando pessoa`);
    
    // Obter dados da requisição
    const data = await request.json();
    console.log('Dados recebidos para atualização:', JSON.stringify(data, null, 2));
    
    // Encontrar a pessoa na planilha
    const result = await findPersonById(params.id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Pessoa não encontrada' },
        { status: 404 }
      );
    }
    
    const { row } = result;
    
    // Atualizar os campos permitidos
    const camposAtualizaveis = [
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
      'naturalidade',
      'estadoCivil',
      'cargoOcupacao',
      'orgao'
    ];
    
    const camposModificados: string[] = [];
    
    camposAtualizaveis.forEach(campo => {
      if (data[campo] !== undefined) {
        const valorAntigo = row.get(campo);
        const valorNovo = data[campo];
        
        // Verificar se o valor realmente foi alterado
        if (valorAntigo !== valorNovo) {
          console.log(`Atualizando campo ${campo}: "${valorAntigo}" -> "${valorNovo}"`);
          row.set(campo, valorNovo);
          camposModificados.push(`${campo}: ${valorAntigo} -> ${valorNovo}`);
        }
      }
    });
    
    // Atualizar data de atualização
    row.set('atualizadoEm', new Date().toISOString());
    
    // Salvar alterações
    console.log('Salvando alterações na planilha...');
    await row.save();
    console.log('Alterações salvas com sucesso');
    
    // Converter a linha atualizada para objeto
    const pessoaAtualizada: Record<string, any> = {};
    
    // Verificação de segurança para evitar erros de tipo
    try {
      const sheet = (row as any)._sheet;
      if (sheet && sheet.headerValues) {
        // Processar normalmente com headerValues disponível
        const headers = sheet.headerValues;
        headers.forEach((header: string) => {
          pessoaAtualizada[header] = row.get(header) || '';
        });
      } else {
        console.log('Aviso: sheet ou headerValues não disponível. Usando campos padrão.');
        
        // Usar os headers padrão da configuração
        PESSOAS_CONFIG.HEADERS.forEach(header => {
          pessoaAtualizada[header] = row.get(header) || '';
        });
        
        // Incluir os campos que acabamos de atualizar
        Object.keys(data).forEach(key => {
          if (camposAtualizaveis.includes(key)) {
            pessoaAtualizada[key] = data[key];
          }
        });
        
        // Garantir que temos o ID e campos de auditoria
        pessoaAtualizada.id = params.id;
        pessoaAtualizada.atualizadoEm = new Date().toISOString();
      }
    } catch (sheetError) {
      console.error('Erro ao acessar sheet:', sheetError);
      // Fallback para headers padrão
      PESSOAS_CONFIG.HEADERS.forEach(header => {
        pessoaAtualizada[header] = row.get(header) || '';
      });
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
    
    // Registrar atividade de atualização da pessoa
    await logUserActivity({
      user_id: userId,
      action_type: 'UPDATE',
      target_type: 'PATIENT',
      target_id: undefined, // Não temos um ID numérico disponível
      details: `Pessoa atualizada: ${pessoaAtualizada.nome} (CPF: ${pessoaAtualizada.cpf}) - Campos alterados: ${camposModificados.join(', ')}`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
    });
    
    return NextResponse.json({
      success: true,
      message: 'Pessoa atualizada com sucesso',
      data: pessoaAtualizada
    });
  } catch (error) {
    console.error(`Erro ao atualizar pessoa com ID ${params.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar pessoa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Endpoint DELETE para remover uma pessoa
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/pessoas/${params.id} - Removendo pessoa`);
    
    // Encontrar a pessoa na planilha
    const result = await findPersonById(params.id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Pessoa não encontrada' },
        { status: 404 }
      );
    }
    
    const { row } = result;
    
    // Guardar dados da pessoa antes de excluir
    const nome = row.get('nome') || 'Desconhecido';
    const cpf = row.get('cpf') || 'Desconhecido';
    
    // Excluir a linha
    console.log('Removendo pessoa da planilha...');
    await row.delete();
    console.log('Pessoa removida com sucesso');
    
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
    
    // Registrar atividade de exclusão da pessoa
    await logUserActivity({
      user_id: userId,
      action_type: 'DELETE',
      target_type: 'PATIENT',
      target_id: undefined, // Não temos um ID numérico disponível
      details: `Pessoa excluída: ${nome} (CPF: ${cpf}) - ID: ${params.id}`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
    });
    
    return NextResponse.json({
      success: true,
      message: 'Pessoa removida com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao remover pessoa com ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erro ao remover pessoa' },
      { status: 500 }
    );
  }
} 