import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { apiCache } from '@/lib/apiCache';
import { GoogleAuth } from 'google-auth-library';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

interface EmendaRow {
  id: string;
  emenda: string;
  municipio: string;
  valor_indicado: number;
  objeto: string;
  valor_empenhado: number;
  liderancas: string;
  classificacao_emenda: string;
  natureza: string;
  status: string;
  fase: string;
  rowIndex: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const municipio = searchParams.get('municipio');
    const bloco = searchParams.get('bloco');

    let q = query(collection(db, 'emendas'));
    
    // Aplicar filtros se fornecidos
    if (municipio) {
      q = query(q, where('municipioBeneficiario', '==', municipio));
    }
    
    if (bloco) {
      q = query(q, where('bloco', '==', bloco));
    }

    // Ordenar por valor indicado (decrescente)
    q = query(q, orderBy('valorIndicado', 'desc'));

    // Aplicar limite se fornecido
    if (limitParam) {
      const limitNumber = parseInt(limitParam, 10);
      if (limitNumber > 0 && limitNumber <= 1000) {
        q = query(q, limit(limitNumber));
      }
    }

    const querySnapshot = await getDocs(q);
    const emendas = [];

    querySnapshot.forEach((doc) => {
      emendas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({
      success: true,
      count: emendas.length,
      emendas
    });

  } catch (error) {
    console.error('Erro ao buscar emendas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { emenda, rowIndex } = await request.json();
    console.log('API POST /api/emendas - Dados recebidos para atualização:', emenda);
    
    if (!emenda || rowIndex === undefined || rowIndex === null) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dados incompletos para atualização' 
      }, { status: 400 });
    }

    // Verificar credenciais
    if (!process.env.EMENDAS_SHEETS_CLIENT_EMAIL || !process.env.EMENDAS_SHEETS_PRIVATE_KEY) {
      console.error('Credenciais do Google Sheets não configuradas');
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }

    // Verificar ID da planilha
    if (!process.env.EMENDAS_SHEET_ID) {
      console.error('ID da planilha não configurado');
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }

    // Configurar autenticação com escopo de leitura e escrita
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.EMENDAS_SHEETS_CLIENT_EMAIL,
        private_key: process.env.EMENDAS_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Criar cliente do Google Sheets
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.EMENDAS_SHEET_ID;
    
    // Calcular a linha real na planilha (adicionando 7 ao índice base-zero)
    const sheetRow = rowIndex + 7;
    
    // Preparar os valores para atualização preservando a estrutura da planilha real
    const values = [
      [
        emenda.id || '', // coluna0
        emenda.municipio || '', // coluna1
        emenda.funcional || '', // coluna2
        emenda.gnd || '', // coluna3
        emenda.valor_indicado ? `R$ ${emenda.valor_indicado.toString().replace('.', ',')}` : '', // coluna4
        emenda.alteracao || '', // coluna5
        emenda.nroproposta || '', // coluna6
        emenda.valor_empenho ? `R$ ${emenda.valor_empenho.toString().replace('.', ',')}` : '', // coluna7
        emenda.empenho || '', // coluna8
        emenda.dataempenho || '', // coluna9
        emenda.portaria_convenio || '', // coluna10
        emenda.valoraempenhar ? `R$ ${emenda.valoraempenhar.toString().replace('.', ',')}` : '', // coluna11
        emenda.pagamento || '', // coluna12
        emenda.valorpago ? `R$ ${emenda.valorpago.toString().replace('.', ',')}` : '', // coluna13
        emenda.valoraserpago ? `R$ ${emenda.valoraserpago.toString().replace('.', ',')}` : '', // coluna14
        emenda.classificacao_emenda || '', // coluna15
        emenda.lideranca || emenda.tipo || '', // coluna16
        emenda.natureza || '', // coluna17
        emenda.objeto || '', // coluna18
        emenda.status_situacao || '' // coluna19
      ]
    ];
    
    // Atualizar a planilha
    const updateRange = `Atualizado2025!A${sheetRow}:T${sheetRow}`;
    console.log(`Atualizando range: ${updateRange}`);
    
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'USER_ENTERED', // Permite formatação automática
      requestBody: {
        values
      }
    });
    
    // Log detalhado da resposta para depuração
    console.log('Resposta da API do Google Sheets:', JSON.stringify({
      status: updateResponse.status,
      statusText: updateResponse.statusText,
      data: updateResponse.data,
      headers: updateResponse.headers
    }, null, 2));
    
    if (updateResponse.status !== 200) {
      console.error('Erro ao atualizar planilha:', updateResponse.statusText);
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao atualizar planilha' 
      }, { status: updateResponse.status });
    }
    
    // Retorna sucesso com os dados atualizados
    return NextResponse.json({ 
      success: true, 
      message: 'Dados atualizados com sucesso na planilha', 
      updatedEmenda: emenda 
    });
  } catch (error: any) {
    console.error('Erro ao processar atualização:', error);
    
    // Verificar se é um erro do Google Sheets
    if (error.code === 403) {
      return NextResponse.json(
        { error: 'Erro de autenticação com o Google Sheets ou permissão insuficiente para edição' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Erro ao processar atualização', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const emenda = data.emenda;
    
    console.log('API PUT /api/emendas - Dados recebidos para atualização:', emenda);
    
    if (!emenda || !emenda.id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dados incompletos para atualização' 
      }, { status: 400 });
    }
    
    // Verificar credenciais
    if (!process.env.EMENDAS_SHEETS_CLIENT_EMAIL || !process.env.EMENDAS_SHEETS_PRIVATE_KEY) {
      console.error('Credenciais do Google Sheets não configuradas');
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }
    
    // Verificar ID da planilha
    if (!process.env.EMENDAS_SHEET_ID) {
      console.error('ID da planilha não configurado');
    return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
      { status: 500 }
    );
  }

    // Configurar autenticação com escopo de leitura e escrita
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.EMENDAS_SHEETS_CLIENT_EMAIL,
        private_key: process.env.EMENDAS_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Criar cliente do Google Sheets
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.EMENDAS_SHEET_ID;
    
    // Calcular o índice da linha diretamente a partir do ID gerado
    // Como o ID é gerado como (index + 1).toString() na função GET,
    // subtraímos 1 para obter o índice original
    const rowIndex = parseInt(emenda.id) - 1;
    
    if (isNaN(rowIndex) || rowIndex < 0) {
      console.error(`ID de emenda inválido: ${emenda.id}`);
      return NextResponse.json({ 
        success: false, 
        message: 'ID de emenda inválido' 
      }, { status: 400 });
    }
    
    // Calcular a linha real na planilha (adicionando 7 ao índice)
    const sheetRow = rowIndex + 7;
    console.log(`ATUALIZANDO LINHA ${sheetRow} da planilha (ID ${emenda.id}, índice ${rowIndex})`);
    
    // Primeiro, buscar os dados atuais para garantir que atualizamos corretamente
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Atualizado2025!A${sheetRow}:T${sheetRow}`,
    });
    
    console.log(`Dados atuais na linha ${sheetRow}:`, response.data.values ? response.data.values[0] : 'Linha vazia');
    
    // Preservar valores que não estamos atualizando
    const currentValues = response.data.values && response.data.values[0] ? response.data.values[0] : new Array(20).fill('');
    
    // Preparar os valores para atualização, atualizando apenas os campos modificados
    const updatedValues = [
      [
        currentValues[0] || '',                           // coluna0
        emenda.municipio || currentValues[1] || '',       // coluna1 - Município
        currentValues[2] || '',                           // coluna2 - Funcional
        currentValues[3] || '',                           // coluna3 - GND
        emenda.valor_indicado ? `R$ ${emenda.valor_indicado.toString().replace('.', ',')}` : currentValues[4] || '', // coluna4 - Valor Indicado
        currentValues[5] || '',                           // coluna5 - Alteração
        currentValues[6] || '',                           // coluna6 - Nroproposta
        emenda.valor_empenho ? `R$ ${emenda.valor_empenho.toString().replace('.', ',')}` : currentValues[7] || '', // coluna7 - Valor Empenho
        emenda.empenho || currentValues[8] || '',         // coluna8 - Empenho
        emenda.dataempenho || currentValues[9] || '',     // coluna9 - Data Empenho
        emenda.portaria_convenio || currentValues[10] || '', // coluna10 - Portaria Convênio
        currentValues[11] || '',                          // coluna11 - Valor a Empenhar formatado
        emenda.valoraempenhar ? `${emenda.valoraempenhar.toString().replace('.', ',')}` : currentValues[12] || '', // coluna12 - Valor a Empenhar numérico
        emenda.pagamento || currentValues[13] || '',      // coluna13 - Pagamento
        emenda.valorpago ? `${emenda.valorpago.toString().replace('.', ',')}` : currentValues[14] || '', // coluna14 - Valor Pago
        emenda.valoraserpago ? `${emenda.valoraserpago.toString().replace('.', ',')}` : currentValues[15] || '', // coluna15 - Valor a Ser Pago
        emenda.lideranca || emenda.tipo || currentValues[16] || '', // coluna16 - Liderança/Tipo
        emenda.classificacao_emenda || currentValues[17] || '', // coluna17 - Classificação
        emenda.natureza || currentValues[18] || '',      // coluna18 - Natureza
        emenda.objeto || currentValues[19] || '',        // coluna19 - Objeto
        emenda.status_situacao || currentValues[20] || '' // coluna20 - Status
      ]
    ];
    
    // Log dos valores para debug
    console.log("Valores para atualização:", JSON.stringify(updatedValues, null, 2));
    
    // Atualizar range com os valores novos
    const updateRange = `Atualizado2025!A${sheetRow}:U${sheetRow}`;
    console.log(`Atualizando range: ${updateRange}`);
    
    try {
      // Usar valueInputOption: 'USER_ENTERED' para permitir formatação de números
      const updateResponse = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: updatedValues
        }
      });
      
      // Log detalhado da resposta para depuração
      console.log('Resposta da API do Google Sheets:', JSON.stringify({
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        data: updateResponse.data
      }, null, 2));
      
      if (updateResponse.status !== 200) {
        console.error('Erro ao atualizar planilha:', updateResponse.statusText);
        return NextResponse.json({ 
          success: false, 
          message: 'Erro ao atualizar planilha' 
        }, { status: updateResponse.status });
      }
      
      // Verificar se a atualização foi bem-sucedida
      console.log(`Atualização concluída. Células atualizadas: ${updateResponse.data.updatedCells}`);
      
      // Retorna sucesso com os dados atualizados
      return NextResponse.json({ 
        success: true, 
        message: `Emenda atualizada com sucesso. Células modificadas: ${updateResponse.data.updatedCells}`, 
        updatedEmenda: emenda 
      });
    } catch (sheetError: any) {
      console.error('Erro específico ao atualizar planilha:', sheetError);
      return NextResponse.json({
        success: false,
        message: 'Erro ao comunicar com o Google Sheets',
        error: sheetError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro ao processar atualização:', error);
    
    // Verificar se é um erro do Google Sheets
    if (error.code === 403) {
      return NextResponse.json(
        { error: 'Erro de autenticação com o Google Sheets ou permissão insuficiente para edição' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Erro ao processar atualização', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // Force clear the cache
  const CACHE_KEY = 'emendas_data';
  apiCache.delete(CACHE_KEY);
  
  console.log('Cache de emendas limpo manualmente');
  
  return NextResponse.json({ 
    sucesso: true, 
    mensagem: 'Cache limpo com sucesso' 
  }, { status: 200 });
} 