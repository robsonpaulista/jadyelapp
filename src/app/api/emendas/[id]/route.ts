import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const dadosAtualizacao = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da emenda é obrigatório' },
        { status: 400 }
      );
    }

    // Referência ao documento
    const emendaRef = doc(db, 'emendas', id);

    // Verificar se o documento existe
    const emendaDoc = await getDoc(emendaRef);
    if (!emendaDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Emenda não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar o documento
    await updateDoc(emendaRef, {
      ...dadosAtualizacao,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Emenda atualizada com sucesso',
      id: id
    });

  } catch (error: any) {
    console.error('Erro ao atualizar emenda:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da emenda é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar o documento específico
    const emendaRef = doc(db, 'emendas', id);
    const emendaDoc = await getDoc(emendaRef);

    if (!emendaDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Emenda não encontrada' },
        { status: 404 }
      );
    }

    const emenda = {
      id: emendaDoc.id,
      ...emendaDoc.data()
    };

    return NextResponse.json({
      success: true,
      emenda: emenda
    });

  } catch (error: any) {
    console.error('Erro ao buscar emenda:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 