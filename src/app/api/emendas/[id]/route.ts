import { NextResponse } from 'next/server';
import { getEmenda, updateEmenda } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const emenda = await getEmenda(params.id);
    if (!emenda) {
      return NextResponse.json({ error: 'Emenda não encontrada' }, { status: 404 });
    }
    return NextResponse.json(emenda);
  } catch (error) {
    console.error('Erro ao buscar emenda:', error);
    return NextResponse.json({ error: 'Erro ao buscar emenda' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const emenda = await updateEmenda(params.id, data);
    if (!emenda) {
      return NextResponse.json({ error: 'Emenda não encontrada' }, { status: 404 });
    }
    return NextResponse.json(emenda);
  } catch (error) {
    console.error('Erro ao atualizar emenda:', error);
    return NextResponse.json({ error: 'Erro ao atualizar emenda' }, { status: 500 });
  }
} 