import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail, logUserActivity } from '@/lib/db/database';
import { comparePassword } from '@/lib/hash';

// Versão simplificada da API de autenticação sem validações complexas

export async function GET(request: Request) {
  try {
    // Verificar se há um cookie de sessão
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ isLoggedIn: false });
    }
    
    // Decodificar o cookie
    try {
      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
      
      // Verificação básica
      if (!sessionData?.user) {
        cookieStore.delete('session');
        return NextResponse.json({ isLoggedIn: false });
      }
      
      // Retornar usuário sem senha
      const { password, ...userWithoutPassword } = sessionData.user;
      
      return NextResponse.json({ 
        isLoggedIn: true, 
        user: userWithoutPassword
      });
    } catch (err) {
      cookieStore.delete('session');
      return NextResponse.json({ isLoggedIn: false });
    }
  } catch (error) {
    return NextResponse.json(
      { isLoggedIn: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("[Auth API] Iniciando processo de login");
    
    // Obtém email e senha do corpo da requisição
    const body = await request.json();
    const { email, password } = body;
    
    // Valida se foram fornecidos email e senha
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`[Auth API] Tentativa de login para: ${email}`);

    // Busca o usuário pelo email - função agora é assíncrona
    const user = await getUserByEmail(email);
    
    // Verifica se o usuário existe
    if (!user) {
      console.log(`[Auth API] Usuário não encontrado: ${email}`);
      return NextResponse.json(
        { success: false, error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }
    
    // Verifica se o usuário está ativo - usando uma forma segura de verificação
    // O valor pode vir como boolean (false) ou como number (0) ou string ('0')
    const isUserActive = user.active !== undefined && user.active !== false && 
                           String(user.active) !== '0';
    if (!isUserActive) {
      console.log(`[Auth API] Usuário inativo: ${email}`);
      
      // Registrar tentativa de login de usuário inativo
      await logUserActivity({
        user_id: user.id,
        action_type: 'LOGIN',
        target_type: 'SYSTEM',
        details: `Tentativa de login rejeitada: Usuário inativo (${email})`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
      });
      
      return NextResponse.json(
        { success: false, error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 401 }
      );
    }
    
    // Verifica se a senha está correta usando bcrypt
    const isPasswordValid = await comparePassword(password, user.password || '');
    
    if (!isPasswordValid) {
      console.log(`[Auth API] Senha inválida para: ${email}`);
      
      // Registrar tentativa de login com senha inválida
      await logUserActivity({
        user_id: user.id,
        action_type: 'LOGIN',
        target_type: 'SYSTEM',
        details: `Tentativa de login falhou: Senha inválida (${email})`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
      });
      
      return NextResponse.json(
        { success: false, error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    console.log(`[Auth API] Login bem-sucedido para: ${email}`);
    
    // Registrar login bem-sucedido
    await logUserActivity({
      user_id: user.id,
      action_type: 'LOGIN',
      target_type: 'SYSTEM',
      details: `Login bem-sucedido: ${email}`,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // Remove a senha do objeto do usuário antes de retornar
    const { password: _, ...userWithoutPassword } = user;

    // Cria a sessão com dados mínimos
    const session = {
      user,
      loggedAt: Date.now().toString(),
      lastActivity: Date.now().toString()
    };

    // Define o cookie da sessão
    cookies().set({
      name: 'session',
      value: encodeURIComponent(JSON.stringify(session)),
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('[Auth API] Erro ao fazer login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Cache simplificado para anti-flood de logout
let lastLogoutTime: { [ip: string]: number } = {};
const LOGOUT_THROTTLE_MS = 2000; // 2 segundos entre logouts permitidos
// Lista de tokens de logout já processados (para evitar duplicações)
const processedLogoutTokens = new Set<string>();
// Limite de tamanho para a lista de tokens processados
const MAX_PROCESSED_TOKENS = 1000;

export async function DELETE(request: Request) {
  try {
    // Verificar se o token já foi processado (através de um cookie ou header)
    const logoutToken = request.headers.get('x-logout-token') || '';
    if (logoutToken && processedLogoutTokens.has(logoutToken)) {
      console.log(`[Auth API] Token de logout já processado: ${logoutToken.substring(0, 8)}...`);
      return NextResponse.json({ 
        success: true, 
        alreadyProcessed: true,
        message: 'Logout já processado anteriormente',
      });
    }
    
    // Verificar se é um logout final (indicado pelo cliente)
    const isFinalLogout = request.headers.get('x-logout-final') === 'true';
    
    // Remover sessão (logout)
    console.log('[Auth API] Processando solicitação de logout');

    // Obter IP ou identificador do cliente para limitar taxa de requisições
    const ipOrKey = request.headers.get('x-forwarded-for') || 
                   request.headers.get('user-agent') || 
                   'unknown-client';
    
    const now = Date.now();
    
    // Verificar se houve uma requisição recente do mesmo cliente
    if (!isFinalLogout && lastLogoutTime[ipOrKey] && (now - lastLogoutTime[ipOrKey] < LOGOUT_THROTTLE_MS)) {
      console.log(`[Auth API] Muitas solicitações de logout do cliente ${ipOrKey.substring(0, 20)}... - Throttling aplicado`);
      
      return NextResponse.json({ 
        success: false, 
        message: 'Muitas solicitações. Tente novamente em alguns segundos.',
        throttled: true,
      }, { status: 429 });
    }
    
    // Registrar timestamp desta solicitação
    lastLogoutTime[ipOrKey] = now;
    
    // Limpar entradas antigas do cache a cada 100 acessos (evitar memory leak)
    if (Object.keys(lastLogoutTime).length > 100) {
      const keysToRemove = Object.keys(lastLogoutTime)
        .filter(key => now - lastLogoutTime[key] > 60000); // Remover entradas com mais de 1 minuto
      
      keysToRemove.forEach(key => delete lastLogoutTime[key]);
    }

    // Se fornecido um token de logout, registrá-lo como processado
    if (logoutToken) {
      processedLogoutTokens.add(logoutToken);
      
      // Limitar o tamanho da lista de tokens processados
      if (processedLogoutTokens.size > MAX_PROCESSED_TOKENS) {
        // Remover os tokens mais antigos (assumindo que os primeiros adicionados são os mais antigos)
        const tokensToRemove = Array.from(processedLogoutTokens).slice(0, 100);
        tokensToRemove.forEach(token => processedLogoutTokens.delete(token));
      }
    }

    // Obter o cookie de sessão para registrar qual usuário está saindo
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    let userId = null;
    let userEmail = null;
    
    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
        if (sessionData?.user) {
          userId = sessionData.user.id;
          userEmail = sessionData.user.email;
          console.log(`[Auth API] Logout do usuário: ${userEmail}`);
          
          // Registrar logout
          await logUserActivity({
            user_id: userId,
            action_type: 'LOGOUT',
            target_type: 'SYSTEM',
            details: `Logout: ${userEmail}`,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
          });
        }
      } catch (error) {
        console.error('[Auth API] Erro ao decodificar dados de sessão durante logout', error);
      }
    }

    // Excluir completamente o cookie de sessão
    cookieStore.delete({
      name: 'session',
      path: '/',
      // Garantir que todas as instâncias do cookie sejam removidas
      domain: '',
    });

    // Criar uma resposta com cabeçalhos adequados para invalidar qualquer cache
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout realizado com sucesso',
      // Timestamp para evitar cache da resposta
      timestamp: now
    });

    // Adicionar cabeçalhos para garantir que não haja cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Adicionar um cookie de expiração forçada para garantir que o cliente saiba que a sessão terminou
    // Com valor de timestamp para evitar duplicações
    response.cookies.set({
      name: 'session_ended',
      value: now.toString(),
      httpOnly: false, // Permitir acesso via JavaScript
      path: '/',
      maxAge: 60, // Curta duração, apenas para indicar logout recente
    });

    // Adicionar um token à resposta para que o cliente possa usá-lo para evitar duplicações
    if (!logoutToken) {
      const newToken = `logout_${now}_${Math.random().toString(36).substring(2, 15)}`;
      response.headers.set('X-Logout-Token', newToken);
      processedLogoutTokens.add(newToken);
    }

    console.log('[Auth API] Sessão encerrada com sucesso');
    return response;
  } catch (error) {
    console.error('[Auth API] Erro ao processar logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar logout' },
      { status: 500 }
    );
  }
} 