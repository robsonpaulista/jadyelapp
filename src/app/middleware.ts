import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const authorizedRoutes = ['/painel-aplicacoes', '/relatorios', '/configuracoes'];

// Rotas públicas que nunca devem ser redirecionadas
const publicRoutes = ['/', '/login', '/api/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Primeiro, verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Se for uma rota pública, permitir acesso sem restrições
  if (isPublicRoute) {
    console.log(`Middleware: Rota pública acessada: ${pathname}`);
    return NextResponse.next();
  }
  
  // Verificar se é uma rota que requer autenticação
  const isAuthorizedRoute = authorizedRoutes.some(route => pathname.startsWith(route));

  // Se não for uma rota autorizada, não faz nada
  if (!isAuthorizedRoute) {
    return NextResponse.next();
  }

  // Verifica se o usuário está autenticado
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie?.value) {
    // Não há cookie de sessão, redirecionar para login
    console.log(`Middleware: Sem cookie de sessão, redirecionando para login. Rota: ${pathname}`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    // Verificar o conteúdo do cookie
    const sessionData = JSON.parse(sessionCookie.value);
    
    if (!sessionData || !sessionData.user || !sessionData.loginDate) {
      console.log(`Middleware: Dados de sessão inválidos, redirecionando para login. Rota: ${pathname}`);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Verificar a data de login
    const loginDate = new Date(sessionData.loginDate);
    const now = new Date();
    
    if (loginDate > now) {
      console.log(`Middleware: Data de login no futuro, redirecionando para login. Rota: ${pathname}`);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Usuário está autenticado, continuar com a navegação
    // Adicionar um cabeçalho para indicar que a navegação veio de uma rota autorizada
    const response = NextResponse.next();
    response.headers.set('X-From-Authorized-Route', 'true');
    
    // Adicionar script para definir o valor no localStorage
    const originalUrl = request.headers.get('referer') || '';
    if (originalUrl && originalUrl.includes(request.nextUrl.origin + '/')) {
      response.headers.set(
        'Set-Cookie',
        'fromAuthorizedRoute=true; Path=/; Max-Age=30; SameSite=Strict'
      );
    }
    
    return response;
  } catch (error) {
    console.error(`Middleware: Erro ao verificar sessão: ${error}. Rota: ${pathname}`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 