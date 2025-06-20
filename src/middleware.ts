// middleware.ts
// MIDDLEWARE DESATIVADO - SEM VALIDAÇÕES DE AUTENTICAÇÃO

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// IMPLEMENTAÇÃO SIMPLIFICADA: PERMITIR ACESSO A TODAS AS ROTAS
export function middleware(request: NextRequest) {
  // Permitir sempre o acesso, sem restrições
  return NextResponse.next();
}

// Configuração mínima apenas para arquivos estáticos
export const config = {
  matcher: []  // Não aplicar a nenhuma rota
}; 