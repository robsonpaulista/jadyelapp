import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

interface PostClassification {
  postId?: string;
  postDate?: string;
  postCaption?: string;
  theme: string;
  isBoosted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Função para gerar ID único baseado em data + legenda
function generateIdFromDateAndCaption(date: string, caption: string): string {
  const dateStr = new Date(date).toISOString().split('T')[0];
  const captionHash = caption.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${dateStr}_${captionHash}`;
}

// GET - Buscar todas as classificações
export async function GET(request: NextRequest) {
  try {
    const classificationsRef = collection(db, 'instagram_post_classifications');
    const snapshot = await getDocs(classificationsRef);
    
    const classifications: Record<string, { theme: string; isBoosted: boolean }> = {};
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as PostClassification;
      const id = docSnap.id;
      classifications[id] = {
        theme: data.theme,
        isBoosted: data.isBoosted
      };
    });
    
    return NextResponse.json({ success: true, classifications });
  } catch (error) {
    console.error('Erro ao buscar classificações:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar classificações' },
      { status: 500 }
    );
  }
}

// POST - Salvar ou atualizar classificação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, postDate, postCaption, theme, isBoosted } = body;
    
    // Validações
    if (!theme || typeof isBoosted !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Tema e isBoosted são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Determinar o ID do documento
    let documentId: string;
    if (postId) {
      // Usar ID da postagem se disponível
      documentId = postId;
    } else if (postDate && postCaption) {
      // Usar data + legenda como identificador alternativo
      documentId = generateIdFromDateAndCaption(postDate, postCaption);
    } else {
      return NextResponse.json(
        { success: false, error: 'É necessário fornecer postId ou (postDate + postCaption)' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    // Verificar se já existe
    const docRef = doc(db, 'instagram_post_classifications', documentId);
    const docSnap = await getDoc(docRef);
    
    const classificationData: PostClassification = {
      postId: postId || undefined,
      postDate: postDate || undefined,
      postCaption: postCaption || undefined,
      theme,
      isBoosted,
      updatedAt: now,
      ...(docSnap.exists() ? {} : { createdAt: now })
    };
    
    // Se já existe, preservar createdAt
    if (docSnap.exists()) {
      const existingData = docSnap.data() as PostClassification;
      if (existingData.createdAt) {
        classificationData.createdAt = existingData.createdAt;
      }
    }
    
    await setDoc(docRef, classificationData, { merge: true });
    
    return NextResponse.json({
      success: true,
      id: documentId,
      data: classificationData
    });
  } catch (error) {
    console.error('Erro ao salvar classificação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar classificação' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar múltiplas classificações (batch)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { classifications } = body;
    
    if (!Array.isArray(classifications)) {
      return NextResponse.json(
        { success: false, error: 'classifications deve ser um array' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const results = [];
    
    for (const classification of classifications) {
      const { postId, postDate, postCaption, theme, isBoosted } = classification;
      
      if (!theme || typeof isBoosted !== 'boolean') {
        continue; // Pular classificações inválidas
      }
      
      // Determinar o ID do documento
      let documentId: string;
      if (postId) {
        documentId = postId;
      } else if (postDate && postCaption) {
        documentId = generateIdFromDateAndCaption(postDate, postCaption);
      } else {
        continue; // Pular se não tiver identificador
      }
      
      const docRef = doc(db, 'instagram_post_classifications', documentId);
      const docSnap = await getDoc(docRef);
      
      const classificationData: PostClassification = {
        postId: postId || undefined,
        postDate: postDate || undefined,
        postCaption: postCaption || undefined,
        theme,
        isBoosted,
        updatedAt: now,
        ...(docSnap.exists() ? {} : { createdAt: now })
      };
      
      if (docSnap.exists()) {
        const existingData = docSnap.data() as PostClassification;
        if (existingData.createdAt) {
          classificationData.createdAt = existingData.createdAt;
        }
      }
      
      await setDoc(docRef, classificationData, { merge: true });
      results.push({ id: documentId, success: true });
    }
    
    return NextResponse.json({
      success: true,
      saved: results.length,
      results
    });
  } catch (error) {
    console.error('Erro ao atualizar classificações em lote:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar classificações' },
      { status: 500 }
    );
  }
}

