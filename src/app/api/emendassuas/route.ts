import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

// Interface para os dados da emenda SUAS
interface EmendaSUAS {
  id?: string;
  municipio: string;
  tipo_proposta: string;
  tipo_recurso: string;
  valor_proposta: number;
  valor_pagar: number;
}

// GET - Buscar todas as emendas SUAS
export async function GET(request: NextRequest) {
  try {
    const emendasRef = collection(db, 'emendassuas');
    const snapshot = await getDocs(emendasRef);
    const emendas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(emendas);
  } catch (error) {
    console.error('Erro ao buscar emendas SUAS:', error);
    return NextResponse.json({ error: 'Erro ao buscar emendas SUAS' }, { status: 500 });
  }
}

// POST - Criar nova emenda SUAS
export async function POST(request: NextRequest) {
  try {
    const data: EmendaSUAS = await request.json();
    const emendasRef = collection(db, 'emendassuas');
    const docRef = await addDoc(emendasRef, {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('Erro ao criar emenda SUAS:', error);
    return NextResponse.json({ error: 'Erro ao criar emenda SUAS' }, { status: 500 });
  }
}

// PUT - Atualizar emenda SUAS
export async function PUT(request: NextRequest) {
  try {
    const data: EmendaSUAS = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const docRef = doc(db, 'emendassuas', data.id);
    await updateDoc(docRef, {
      ...data,
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar emenda SUAS:', error);
    return NextResponse.json({ error: 'Erro ao atualizar emenda SUAS' }, { status: 500 });
  }
}

// DELETE - Remover emenda SUAS
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }
    
    const docRef = doc(db, 'emendassuas', id);
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover emenda SUAS:', error);
    return NextResponse.json({ error: 'Erro ao remover emenda SUAS' }, { status: 500 });
  }
} 