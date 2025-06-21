import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Força runtime dinâmico para permitir uso de cookies
export const dynamic = 'force-dynamic';

// Cache simplificado para anti-flood de logout
let lastLogoutTime: { [ip: string]: number } = {};
const LOGOUT_THROTTLE_MS = 2000; // 2 segundos entre logouts permitidos

export async function POST(request: Request) {
  try {
    console.log('[Logout API] Processando solicitação de logout');

    // Obter IP ou identificador do cliente para limitar taxa de requisições
    const ipOrKey = request.headers.get('x-forwarded-for') || 
                   request.headers.get('user-agent') || 
                   'unknown-client';
    
    const now = Date.now();
    
    // Verificar se houve uma requisição recente do mesmo cliente
    if (lastLogoutTime[ipOrKey] && (now - lastLogoutTime[ipOrKey] < LOGOUT_THROTTLE_MS)) {
      console.log(`[Logout API] Muitas solicitações de logout do cliente ${ipOrKey.substring(0, 20)}... - Throttling aplicado`);
      
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

    // Obter o cookie de sessão para registrar qual usuário está saindo
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
        if (sessionData?.user?.email) {
          console.log(`[Logout API] Logout do usuário: ${sessionData.user.email}`);
        }
      } catch (error) {
        console.error('[Logout API] Erro ao decodificar dados de sessão durante logout', error);
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

    console.log('[Logout API] Logout processado com sucesso');
    return response;
  } catch (error) {
    console.error('[Logout API] Erro ao processar logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 