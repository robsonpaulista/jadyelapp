import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

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

// Interface para o relacionamento
interface RelacionamentoDeputado {
  id?: string;
  municipio: string;
  deputadoFederal: string;
  prefeito?: string;
  votacaoPrefeito?: number;
  vereadores: string[];
  votacoesVereadores: { nome: string; votos: number }[];
  nomesAdicionais: string[];
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

// GET - Buscar relacionamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const municipio = searchParams.get('municipio');

    let q = query(collection(db, 'relacionamentos_deputados'), orderBy('municipio', 'asc'));
    
    if (municipio) {
      q = query(
        collection(db, 'relacionamentos_deputados'),
        where('municipio', '==', municipio),
        orderBy('municipio', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    const relacionamentos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: relacionamentos
    });

  } catch (error) {
    console.error('Erro ao buscar relacionamentos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar relacionamento
export async function POST(request: NextRequest) {
  try {
    const body: RelacionamentoDeputado = await request.json();
    
    // Validações básicas
    if (!body.municipio || !body.deputadoFederal) {
      return NextResponse.json(
        { success: false, error: 'Município e Deputado Federal são obrigatórios' },
        { status: 400 }
      );
    }

    const agora = new Date().toISOString();
    const id = body.id || `${body.municipio}_${body.deputadoFederal.replace(/\s+/g, '_')}`;

    const relacionamentoData = {
      municipio: body.municipio,
      deputadoFederal: body.deputadoFederal,
      prefeito: body.prefeito || '',
      votacaoPrefeito: body.votacaoPrefeito || 0,
      vereadores: body.vereadores || [],
      votacoesVereadores: body.votacoesVereadores || [],
      nomesAdicionais: body.nomesAdicionais || [],
      observacoes: body.observacoes || '',
      dataCriacao: body.id ? body.dataCriacao : agora,
      dataAtualizacao: agora
    };

    await setDoc(doc(db, 'relacionamentos_deputados', id), relacionamentoData);

    return NextResponse.json({
      success: true,
      data: { id, ...relacionamentoData }
    });

  } catch (error) {
    console.error('Erro ao salvar relacionamento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover relacionamento
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do relacionamento é obrigatório' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'relacionamentos_deputados', id));

    return NextResponse.json({
      success: true,
      message: 'Relacionamento removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover relacionamento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
