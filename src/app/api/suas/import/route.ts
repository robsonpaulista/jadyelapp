import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// Permitir uso de request.url e evitar cache
export const dynamic = 'force-dynamic';

// Ajuste a origem conforme necessidade (pode ser * durante testes locais)
const ALLOWED_ORIGINS = [
  'https://estruturasuas.mds.gov.br',
  'https://estruturasuas-api.mds.gov.br',
  // Adicione também o domínio do seu app se precisar consumir deste endpoint via browser externo
];

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.mds.gov.br'))
    ? origin
    : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  } as Record<string, string>;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const headers = corsHeaders(origin);

    const body = await req.json();
    // body esperado: { fonte: 'suas', filtro: {...}, payload: any }
    if (!body || !body.payload) {
      return NextResponse.json({ error: 'Payload ausente' }, { status: 400, headers });
    }

    // Persistir snapshot no Firestore
    const ref = collection(db, 'suas_saldo_snapshots');
    const docRef = await addDoc(ref, {
      fonte: body.fonte || 'suas',
      filtro: body.filtro || null,
      payload: body.payload,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, id: docRef.id }, { headers });
  } catch (error: any) {
    const origin = req.headers.get('origin');
    const headers = corsHeaders(origin);
    return NextResponse.json({ error: error?.message || 'Falha ao salvar snapshot SUAS' }, { status: 500, headers });
  }
}


