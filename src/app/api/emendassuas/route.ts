import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// Interface para os dados da emenda SUAS
interface EmendaSUAS {
  id?: number;
  municipio: string;
  tipo_proposta: string;
  tipo_recurso: string;
  valor_proposta: number;
  valor_pagar: number;
}

// GET - Buscar todas as emendas SUAS
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const emendas = db.prepare('SELECT * FROM emendassuas ORDER BY municipio').all();
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
    const db = await getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO emendassuas (municipio, tipo_proposta, tipo_recurso, valor_proposta, valor_pagar)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.municipio,
      data.tipo_proposta,
      data.tipo_recurso,
      data.valor_proposta,
      data.valor_pagar
    );
    
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Erro ao criar emenda SUAS:', error);
    return NextResponse.json({ error: 'Erro ao criar emenda SUAS' }, { status: 500 });
  }
}

// PUT - Atualizar emenda SUAS
export async function PUT(request: NextRequest) {
  try {
    const data: EmendaSUAS = await request.json();
    const db = await getDatabase();
    
    const stmt = db.prepare(`
      UPDATE emendassuas 
      SET municipio = ?, tipo_proposta = ?, tipo_recurso = ?, valor_proposta = ?, valor_pagar = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      data.municipio,
      data.tipo_proposta,
      data.tipo_recurso,
      data.valor_proposta,
      data.valor_pagar,
      data.id
    );
    
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
    
    const db = await getDatabase();
    const stmt = db.prepare('DELETE FROM emendassuas WHERE id = ?');
    stmt.run(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover emenda SUAS:', error);
    return NextResponse.json({ error: 'Erro ao remover emenda SUAS' }, { status: 500 });
  }
} 