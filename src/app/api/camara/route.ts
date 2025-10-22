import { NextResponse } from 'next/server';
import { camaraService } from '@/services/camaraService';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ano = url.searchParams.get('ano') || '2025';
    
    let dados;
    
    if (ano === '2025') {
      dados = await camaraService.getEmendas2025();
    } else {
      dados = await camaraService.getDeputadosComEmendas();
    }

    return NextResponse.json({
      success: true,
      count: dados.length,
      dados,
      ano
    });
  } catch (error) {
    console.error('Erro na API da Câmara:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      }, 
      { status: 500 }
    );
  }
} 