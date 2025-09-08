import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Interface para deputado federal adicional
interface DeputadoFederalAdicional {
  id?: string;
  nome: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

// GET - Buscar todos os deputados federais adicionais
export async function GET(request: NextRequest) {
  try {
    const q = query(collection(db, 'deputados_federais_adicionais'), orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);
    const deputados = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: deputados
    });

  } catch (error) {
    console.error('Erro ao buscar deputados federais adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo deputado federal adicional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome } = body;
    
    // Validações básicas
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nome do deputado é obrigatório' },
        { status: 400 }
      );
    }

    const nomeLimpo = nome.trim();
    
    // Verificar se já existe
    const q = query(collection(db, 'deputados_federais_adicionais'));
    const snapshot = await getDocs(q);
    const deputadosExistentes = snapshot.docs.map(doc => doc.data().nome);
    
    if (deputadosExistentes.includes(nomeLimpo)) {
      return NextResponse.json(
        { success: false, error: 'Este deputado já existe na lista' },
        { status: 400 }
      );
    }

    const agora = new Date().toISOString();
    const id = `deputado_${nomeLimpo.replace(/\s+/g, '_').toLowerCase()}`;

    const deputadoData = {
      nome: nomeLimpo,
      dataCriacao: agora,
      dataAtualizacao: agora
    };

    await setDoc(doc(db, 'deputados_federais_adicionais', id), deputadoData);

    return NextResponse.json({
      success: true,
      data: { id, ...deputadoData }
    });

  } catch (error) {
    console.error('Erro ao criar deputado federal adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover deputado federal adicional
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do deputado é obrigatório' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'deputados_federais_adicionais', id));

    return NextResponse.json({
      success: true,
      message: 'Deputado removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover deputado federal adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
