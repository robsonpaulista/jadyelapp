import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, where, orderBy, getDoc } from 'firebase/firestore';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

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

// Interface para o relacionamento por duplo clique
interface RelacionamentoDuploClique {
  id?: string;
  municipio: string;
  nomePolitico: string;
  tipoPolitico: 'prefeito' | 'vereador';
  deputadosRelacionados: string[];
  votosPolitico?: number;
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

// GET - Buscar relacionamentos por duplo clique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const municipio = searchParams.get('municipio');
    const nomePolitico = searchParams.get('nomePolitico');

    let q = query(collection(db, 'relacionamentos_duplo_clique'), orderBy('municipio', 'asc'));
    
    if (municipio) {
      q = query(
        collection(db, 'relacionamentos_duplo_clique'),
        where('municipio', '==', municipio),
        orderBy('municipio', 'asc')
      );
    }

    if (nomePolitico) {
      q = query(
        collection(db, 'relacionamentos_duplo_clique'),
        where('nomePolitico', '==', nomePolitico),
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
    console.error('Erro ao buscar relacionamentos por duplo clique:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar relacionamento por duplo clique
export async function POST(request: NextRequest) {
  try {
    const body: RelacionamentoDuploClique = await request.json();
    
    // Validações básicas
    if (!body.municipio || !body.nomePolitico || !body.tipoPolitico) {
      return NextResponse.json(
        { success: false, error: 'Município, Nome do Político e Tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const agora = new Date().toISOString();
    const id = body.id || `${body.municipio}_${body.nomePolitico.replace(/\s+/g, '_')}_${body.tipoPolitico}`;

    // Se é uma edição, buscar dados existentes para preservar
    let dadosExistentes = null;
    if (body.id) {
      try {
        const docRef = doc(db, 'relacionamentos_duplo_clique', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          dadosExistentes = docSnap.data();
        }
      } catch (error) {
        console.error('Erro ao buscar dados existentes:', error);
      }
    }

    const relacionamentoData = {
      municipio: body.municipio,
      nomePolitico: body.nomePolitico,
      tipoPolitico: body.tipoPolitico,
      deputadosRelacionados: body.deputadosRelacionados || dadosExistentes?.deputadosRelacionados || [],
      votosPolitico: body.votosPolitico || dadosExistentes?.votosPolitico || 0,
      observacoes: body.observacoes || dadosExistentes?.observacoes || '',
      dataCriacao: body.id ? (dadosExistentes?.dataCriacao || body.dataCriacao || agora) : agora,
      dataAtualizacao: agora
    };

    await setDoc(doc(db, 'relacionamentos_duplo_clique', id), relacionamentoData);

    return NextResponse.json({
      success: true,
      data: { id, ...relacionamentoData }
    });

  } catch (error) {
    console.error('Erro ao salvar relacionamento por duplo clique:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover relacionamento por duplo clique
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

    await deleteDoc(doc(db, 'relacionamentos_duplo_clique', id));

    return NextResponse.json({
      success: true,
      message: 'Relacionamento removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover relacionamento por duplo clique:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
