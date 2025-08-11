import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, limit as fbLimit, query } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const col = collection(db, 'suas_saldo_snapshots');
    const q = query(col, orderBy('created_at', 'desc'), fbLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      return NextResponse.json({ ok: true, data: null });
    }
    const doc = snap.docs[0];
    const data = doc.data();
    return NextResponse.json({ ok: true, id: doc.id, ...data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Falha ao obter saldo SUAS' }, { status: 500 });
  }
}


