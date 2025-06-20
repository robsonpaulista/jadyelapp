import { NextRequest, NextResponse } from 'next/server';
import { getSheetByTitle, ACOES_CONFIG, ensureAcoesSheetExists } from '@/lib/googleSheetsConfig';
import { v4 as uuidv4 } from 'uuid';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';
import { logUserActivity } from '@/lib/db/database';
import { headers } from 'next/headers';

// Interface para as ações
export interface Acao {
  id: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  criadoEm?: string;
  atualizadoEm?: string;
  [key: string]: any;
}

/**
 * @swagger
 * /api/acoes:
 *   get:
 *     description: Retorna todas as ações cadastradas
 *     responses:
 *       200:
 *         description: Lista de ações encontradas
 *       500:
 *         description: Erro ao buscar ações
 */
export async function GET(request: NextRequest) {
  try {
    // Obter parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const responsavel = searchParams.get('responsavel');
    
    console.log('GET /api/acoes - Buscando todas as ações');
    
    // Garantir que a aba exista
    await ensureAcoesSheetExists();
    
    // Obter a planilha
    const sheet = await getSheetByTitle(ACOES_CONFIG.SHEET_TITLE);
    
    // Carregar os cabeçalhos
    await sheet.loadHeaderRow();
    
    // Carregar as linhas da planilha
    const rows = await sheet.getRows();
    console.log(`Encontradas ${rows.length} ações na planilha`);
    
    // Converter rows para objetos Acao
    let acoes: Acao[] = rows.map((row: GoogleSpreadsheetRow) => {
      const acao: Acao = {
        id: row.get('id') || '',
        titulo: row.get('titulo') || '',
        descricao: row.get('descricao') || '',
        responsavel: row.get('responsavel') || '',
        dataInicio: row.get('dataInicio') || '',
        dataFim: row.get('dataFim') || '',
        status: row.get('status') || '',
        criadoEm: row.get('criadoEm') || '',
        atualizadoEm: row.get('atualizadoEm') || ''
      };
      
      // Adicionar quaisquer campos adicionais que possam existir
      sheet.headerValues.forEach(header => {
        if (!(header in acao)) {
          acao[header] = row.get(header);
        }
      });
      
      return acao;
    });
    
    // Filtrar por ID se fornecido
    if (id) {
      const acao = acoes.find(acao => acao.id === id);
      if (!acao) {
        return NextResponse.json(
          { error: 'Ação não encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: acao });
    }
    
    // Filtrar por status se fornecido
    if (status) {
      acoes = acoes.filter(acao => acao.status === status);
    }
    
    // Filtrar por responsável se fornecido
    if (responsavel) {
      acoes = acoes.filter(acao => acao.responsavel.toLowerCase().includes(responsavel.toLowerCase()));
    }
    
    return NextResponse.json(acoes);
  } catch (error) {
    console.error('Erro ao buscar ações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ações' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/acoes:
 *   post:
 *     description: Cria uma nova ação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descricao
 *               - responsavel
 *               - dataInicio
 *               - dataFim
 *               - status
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               responsavel:
 *                 type: string
 *               dataInicio:
 *                 type: string
 *                 format: date
 *               dataFim:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [pendente, em_andamento, concluida, cancelada]
 *     responses:
 *       201:
 *         description: Ação criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro ao criar ação
 */
export async function POST(request: NextRequest) {
  try {
    // Obter os dados da requisição
    const data = await request.json();
    console.log('POST /api/acoes - Dados recebidos:', data);
    
    // Validação básica dos campos obrigatórios
    if (!data.titulo || !data.descricao || !data.responsavel || !data.dataInicio || !data.dataFim || !data.status) {
      console.error('Campos obrigatórios ausentes:', {
        titulo: !!data.titulo,
        descricao: !!data.descricao,
        responsavel: !!data.responsavel,
        dataInicio: !!data.dataInicio,
        dataFim: !!data.dataFim,
        status: !!data.status
      });
      
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Obtendo a planilha (garantindo que ela existe)
    console.log('Obtendo a planilha de ações...');
    const sheet = await ensureAcoesSheetExists();
    console.log('Planilha obtida com sucesso');
    
    // Gerar timestamp e ID
    const timestamp = new Date().toISOString();
    const id = uuidv4();
    
    // Preparar dados para inserção
    const novaAcao = {
      id,
      titulo: data.titulo,
      descricao: data.descricao,
      responsavel: data.responsavel,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      status: data.status,
      criadoEm: timestamp,
      atualizadoEm: timestamp
    };
    
    console.log('Adicionando nova ação à planilha:', novaAcao);
    
    // Adicionar linha à planilha
    try {
      const row = await sheet.addRow(novaAcao);
      console.log('Ação adicionada com sucesso:', novaAcao.id);
      
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
      
      // Registrar atividade de criação de ação
      await logUserActivity({
        user_id: userId,
        action_type: 'CREATE',
        target_type: 'SYSTEM',
        target_id: undefined,
        details: `Ação criada: ${novaAcao.titulo} (ID: ${novaAcao.id}) - Responsável: ${novaAcao.responsavel}`,
        ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Ação criada com sucesso', 
        data: novaAcao 
      });
    } catch (error) {
      console.error('Erro ao adicionar ação:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao processar requisição POST /api/acoes:', error);
    return NextResponse.json(
      { error: 'Erro ao criar ação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/acoes/{id}:
 *   put:
 *     description: Atualiza uma ação existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ação atualizada com sucesso
 *       404:
 *         description: Ação não encontrada
 *       500:
 *         description: Erro ao atualizar ação
 */
export async function PUT(request: NextRequest) {
  try {
    // Obter os dados da requisição
    const data = await request.json();
    const { id } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }
    
    // Obter a planilha
    const sheet = await getSheetByTitle(ACOES_CONFIG.SHEET_TITLE);
    
    // Carregar as linhas da planilha
    const rows = await sheet.getRows();
    
    // Encontrar a linha pelo ID
    const rowIndex = rows.findIndex(row => row.get('id') === id);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Ação não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar os campos da ação
    const row = rows[rowIndex];
    const camposAtualizaveis = [
      'titulo',
      'descricao',
      'responsavel',
      'dataInicio',
      'dataFim',
      'status'
    ];
    
    const camposModificados: string[] = [];
    
    camposAtualizaveis.forEach(campo => {
      if (data[campo] !== undefined) {
        const valorAntigo = row.get(campo);
        const valorNovo = data[campo];
        
        if (valorAntigo !== valorNovo) {
          row.set(campo, valorNovo);
          camposModificados.push(`${campo}: ${valorAntigo} -> ${valorNovo}`);
        }
      }
    });
    
    // Atualizar a data de atualização
    row.set('atualizadoEm', new Date().toISOString());
    
    // Salvar as alterações
    await row.save();
    
    // Converter a linha atualizada para objeto
    const acaoAtualizada: Record<string, any> = {};
    sheet.headerValues.forEach(header => {
      acaoAtualizada[header] = row.get(header);
    });
    
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
    
    // Registrar atividade de atualização da ação
    await logUserActivity({
      user_id: userId,
      action_type: 'UPDATE',
      target_type: 'SYSTEM',
      target_id: undefined,
      details: `Ação atualizada: ${acaoAtualizada.titulo} (ID: ${id}) - Campos alterados: ${camposModificados.join(', ')}`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
    });
    
    return NextResponse.json(acaoAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar ação:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar ação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/acoes/{id}:
 *   delete:
 *     description: Remove uma ação existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ação removida com sucesso
 *       404:
 *         description: Ação não encontrada
 *       500:
 *         description: Erro ao remover ação
 */
export async function DELETE(request: NextRequest) {
  try {
    // Obter o ID da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }
    
    // Obter a planilha
    const sheet = await getSheetByTitle(ACOES_CONFIG.SHEET_TITLE);
    
    // Carregar as linhas da planilha
    const rows = await sheet.getRows();
    
    // Encontrar a linha pelo ID
    const rowIndex = rows.findIndex(row => row.get('id') === id);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Ação não encontrada' },
        { status: 404 }
      );
    }
    
    // Guardar informações antes de excluir
    const titulo = rows[rowIndex].get('titulo') || 'Desconhecido';
    const responsavel = rows[rowIndex].get('responsavel') || 'Desconhecido';
    
    // Remover a linha
    await rows[rowIndex].delete();
    
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
    
    // Registrar atividade de exclusão da ação
    await logUserActivity({
      user_id: userId,
      action_type: 'DELETE',
      target_type: 'SYSTEM',
      target_id: undefined,
      details: `Ação excluída: ${titulo} (ID: ${id}) - Responsável: ${responsavel}`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover ação:', error);
    return NextResponse.json(
      { error: 'Erro ao remover ação' },
      { status: 500 }
    );
  }
} 