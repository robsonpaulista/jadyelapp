import { NextResponse } from 'next/server';
import { buscarProjecoesMunicipios } from '@/services/projecaoMunicipiosService';

// Força runtime dinâmico para permitir uso de nextUrl.searchParams
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projecoes = await buscarProjecoesMunicipios();
    
    // Log para debug
    console.log('Projeções retornadas do serviço:', {
      tipo: typeof projecoes,
      isArray: Array.isArray(projecoes),
      tamanho: projecoes?.length,
      amostra: projecoes?.slice(0, 2)
    });

    // Garante que sempre retornamos um array
    const dados = Array.isArray(projecoes) ? projecoes : [];
    
    return NextResponse.json(dados);
  } catch (error) {
    console.error('Erro na rota de projeção de municípios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projeções dos municípios' },
      { status: 500 }
    );
  }
} 