import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/painel-aplicacoes',
  '/relatorios', 
  '/configuracoes',
  '/baseliderancas',
  '/emendas2025',
  '/projecao2026',
  '/instagram-analytics',
  '/acoes',
  '/obras_demandas',
  '/cadastro',
  '/pacientes',
  '/gerenciar-usuarios',
  '/usuarios',
  '/tipos-acao',
  '/pessoas',
  '/chapas',
  '/consultar-tetos',
  '/eleicoes-anteriores',
  '/monitoramento-noticias',
  '/pesquisas-eleitorais',
  '/eleitores-municipio',
  '/emendas',
  '/criaremendas',
  '/dashboardemendas'
];

// Rotas públicas que nunca devem ser redirecionadas
const publicRoutes = ['/', '/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir acesso a arquivos estáticos e APIs
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // arquivos com extensão
  ) {
    return NextResponse.next();
  }
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Se for uma rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Se não for uma rota protegida, permitir acesso
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Para rotas protegidas, verificar se há dados de autenticação no localStorage
  // Como não podemos acessar localStorage no middleware, vamos deixar que o cliente
  // faça a verificação via JavaScript
  
  // Adicionar header para indicar que é uma rota protegida
  const response = NextResponse.next();
  response.headers.set('x-protected-route', 'true');
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 