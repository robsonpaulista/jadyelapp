import { NextRequest, NextResponse } from 'next/server';
import { getSheetByTitle, ACOES_CONFIG, PESSOAS_CONFIG } from '@/lib/googleSheetsConfig';
import { getGoogleSheetsClient } from '@/lib/googleSheetsConfig';

export async function DELETE(request: NextRequest) {
  try {
    // Obter o ID da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }

    // Obter o cliente do Google Sheets
    const doc = await getGoogleSheetsClient();
    
    // Obter as planilhas
    const acoesSheet = await getSheetByTitle(ACOES_CONFIG.SHEET_TITLE);
    const pessoasSheet = await getSheetByTitle(PESSOAS_CONFIG.SHEET_TITLE);
    
    // Carregar as linhas das planilhas
    const acoesRows = await acoesSheet.getRows();
    const pessoasRows = await pessoasSheet.getRows();
    
    // Encontrar a linha da ação pelo ID
    const acaoRowIndex = acoesRows.findIndex(row => row.get('id') === id);
    
    if (acaoRowIndex === -1) {
      return NextResponse.json(
        { error: 'Ação não encontrada' },
        { status: 404 }
      );
    }
    
    // Encontrar todas as pessoas vinculadas à ação
    const pessoasVinculadas = pessoasRows.filter(row => row.get('acaoId') === id);
    
    // Excluir todas as pessoas vinculadas
    for (const pessoa of pessoasVinculadas) {
      await pessoa.delete();
    }
    
    // Excluir a ação
    await acoesRows[acaoRowIndex].delete();
    
    return NextResponse.json({ 
      success: true,
      message: `Ação e ${pessoasVinculadas.length} pessoa(s) excluída(s) com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao remover ação e pessoas:', error);
    return NextResponse.json(
      { error: 'Erro ao remover ação e pessoas' },
      { status: 500 }
    );
  }
} 