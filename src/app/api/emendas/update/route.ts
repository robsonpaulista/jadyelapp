import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getGoogleAuth } from '@/lib/googleAuth';

export async function PUT(request: Request) {
  try {
    const emenda = await request.json();

    // Autenticar com o Google
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Configurações da planilha
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = 'Atualizado2025!A7:Z';

    // Primeiro, buscar todas as emendas para encontrar a linha correta
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    // Encontrar o índice da linha que contém a emenda a ser atualizada
    const rowIndex = rows.findIndex(row => row[0] === emenda.id);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Emenda não encontrada' },
        { status: 404 }
      );
    }

    // Preparar os dados para atualização
    const updateRange = `Atualizado2025!A${rowIndex + 7}:Z${rowIndex + 7}`;
    const updateValues = [
      [
        emenda.id,
        emenda.emenda,
        emenda.municipio,
        emenda.funcional,
        emenda.gnd,
        emenda.valor_indicado.toString(),
        emenda.alteracao,
        emenda.nroproposta,
        emenda.valor_empenho.toString(),
        emenda.empenho,
        emenda.dataempenho,
        emenda.portaria_convenio,
        emenda.valoraempenhar.toString(),
        emenda.pagamento,
        emenda.valorpago.toString(),
        emenda.valoraserpago.toString(),
        emenda.tipo,
        emenda.classificacao_emenda,
        emenda.natureza,
        emenda.status_situacao
      ]
    ];

    // Atualizar a linha na planilha
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: updateValues,
      },
    });

    return NextResponse.json({ message: 'Emenda atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar emenda:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar emenda' },
      { status: 500 }
    );
  }
} 