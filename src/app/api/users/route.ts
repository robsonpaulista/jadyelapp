import { NextResponse } from 'next/server';
import { createUser, getAllUsers, updateUser, deleteUser, logUserActivity, getUserActivities } from '@/lib/db/database';
import { headers } from 'next/headers';

// Função auxiliar para criar uma URL absoluta
function getAbsoluteUrl(path: string): string {
  // Garantir que temos um protocolo e host válidos
  try {
    // Em produção, usar a variável de ambiente ou um valor padrão
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    
    // Verificar se a URL base já tem uma barra final
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Verificar se o caminho já tem uma barra inicial
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Construir URL final
    const finalUrl = `${normalizedBase}${normalizedPath}`;
    
    console.log(`[getAbsoluteUrl] Criando URL absoluta: ${finalUrl} (base: ${baseUrl}, path: ${path})`);
    
    // Testar se a URL é válida antes de retornar
    new URL(finalUrl);
    
    return finalUrl;
  } catch (error) {
    console.error(`[getAbsoluteUrl] Erro ao criar URL absoluta para '${path}':`, error);
    // Fornecer um URL absoluto fixo garantido em caso de erro
    const fallbackUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'}/api/auth`;
    console.log(`[getAbsoluteUrl] Usando URL fallback: ${fallbackUrl}`);
    return fallbackUrl;
  }
}

// GET /api/users - Lista todos os usuários
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const getActivities = searchParams.get('activities');
    
    if (getActivities === 'true') {
      // Obter logs de atividades
      const limit = parseInt(searchParams.get('limit') || '100', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const activities = await getUserActivities(limit, offset);
      return NextResponse.json(activities);
    }
    
    // Obter lista de usuários
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

// POST /api/users - Cria um novo usuário
export async function POST(request: Request) {
  try {
    const userData = await request.json();
    const result = await createUser(userData);
    
    // Obter sessão do usuário que realizou a operação
    const headersList = headers();
    const sessCookie = headersList.get('cookie') || '';
    
    // Usar URL absoluta completa e garantida para ambiente de servidor
    const authUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'}/api/auth`;
    console.log(`[POST /api/users] Usando URL de autenticação: ${authUrl}`);
    
    const sessionReq = new Request(authUrl, {
      headers: { cookie: sessCookie }
    });
    
    // Tentar obter dados da sessão
    let sessionRes;
    let userId = null;
    
    try {
      sessionRes = await fetch(sessionReq);
      
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.isLoggedIn && sessionData.user) {
          userId = sessionData.user.id;
        }
      }
    } catch (sessionError) {
      console.error('[POST /api/users] Erro ao obter sessão:', sessionError);
      // Continuar mesmo com erro na obtenção da sessão
    }
    
    // Registrar atividade
    await logUserActivity({
      user_id: userId,
      action_type: 'CREATE',
      target_type: 'USER',
      target_id: result.lastInsertRowid as number,
      details: `Usuário criado: ${userData.name} (${userData.email})`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Atualiza um usuário existente
export async function PUT(request: Request) {
  try {
    const userData = await request.json();
    const { id, ...updates } = userData;
    
    // Logs para debug
    console.log('userData recebido:', userData);
    console.log('ID do usuário:', id, 'Tipo:', typeof id);
    console.log('Atualizações:', updates);
    console.log('Status ativo:', updates.active, 'Tipo:', typeof updates.active);
    
    // Verificar se o ID foi fornecido
    if (!id) {
      console.error('ID do usuário não fornecido nos dados de atualização');
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    // Converter ID para número se necessário
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      console.error('ID do usuário inválido:', id);
      return NextResponse.json(
        { error: 'ID do usuário inválido' },
        { status: 400 }
      );
    }
    
    // Se as permissões não são um array, converter para array vazio
    if (updates.permissions && !Array.isArray(updates.permissions)) {
      updates.permissions = [];
    }
    
    // Garantir que active seja tratado como booleano explícito
    if ('active' in updates) {
      // Verificação detalhada do valor original para debug
      console.log(`[PUT] Valor bruto de active antes da conversão: ${JSON.stringify(updates.active)}, tipo: ${typeof updates.active}`);
      
      // Converter para booleano de forma explícita baseado no tipo de entrada
      if (typeof updates.active === 'string') {
        updates.active = updates.active.toLowerCase() === 'true';
      } else {
        updates.active = Boolean(updates.active);
      }
      
      console.log(`[PUT] Valor final convertido de active: ${updates.active}, tipo: ${typeof updates.active}`);
    } else {
      console.log('[PUT] Campo active não presente nas atualizações');
    }
    
    try {
      const result = await updateUser(numericId, updates);
      console.log('Resultado da atualização:', result);
      
      // Obter sessão do usuário que realizou a operação
      const headersList = headers();
      const sessCookie = headersList.get('cookie') || '';
      
      // Usar URL absoluta para ambiente de servidor
      const authUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'}/api/auth`;
      console.log(`[PUT /api/users] Usando URL de autenticação: ${authUrl}`);
      
      let userId = null;
      
      try {
        const sessionReq = new Request(authUrl, {
          headers: { cookie: sessCookie }
        });
        const sessionRes = await fetch(sessionReq);
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.isLoggedIn && sessionData.user) {
            userId = sessionData.user.id;
          }
        }
      } catch (sessionError) {
        console.error('[PUT /api/users] Erro ao obter sessão:', sessionError);
        // Continuar mesmo com erro na obtenção da sessão
      }
      
      // Criar um resumo das alterações
      const changesDetails = Object.entries(updates)
        .filter(([key]) => key !== 'password') // Não incluir senha nos logs
        .map(([key, value]) => {
          if (key === 'active') {
            return `status: ${value ? 'ativo' : 'inativo'}`;
          } else if (key === 'permissions') {
            return `permissões: ${(value as string[]).length} páginas`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
      
      // Registrar atividade
      await logUserActivity({
        user_id: userId,
        action_type: 'UPDATE',
        target_type: 'USER',
        target_id: numericId,
        details: `Usuário atualizado: ID ${numericId} (${changesDetails})`,
        ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      });
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('Erro específico do banco de dados:', error);
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar usuário no banco de dados', 
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar usuário', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Remove um usuário
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário não fornecido' },
        { status: 400 }
      );
    }
    
    const numericId = Number(id);
    
    // Obter sessão do usuário que realizou a operação
    const headersList = headers();
    const sessCookie = headersList.get('cookie') || '';
    
    // Usar URL absoluta fixa para ambiente de servidor
    const authUrl = getAbsoluteUrl('/api/auth');
    const sessionReq = new Request(authUrl, {
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
    
    const result = await deleteUser(numericId);
    
    // Registrar atividade
    await logUserActivity({
      user_id: userId,
      action_type: 'DELETE',
      target_type: 'USER',
      target_id: numericId,
      details: `Usuário excluído: ID ${numericId}`,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
} 