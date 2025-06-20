import { NextResponse } from 'next/server';
import { getObrasDemandas, getMockObrasDemandas, testeConexao, listarAbas } from '@/lib/googleSheets';

// Endpoint para buscar dados de obras e demandas
export async function GET() {
  try {
    // Verificar se a conexão com o Google Sheets está funcionando
    const conexaoOk = await testeConexao();
    
    if (!conexaoOk) {
      // Tentar listar abas para diagnóstico
      try {
        const abas = await listarAbas(process.env.OBRAS_SHEET_ID || '');
        console.log('Resultado da tentativa de listar abas para obras:', abas);
      } catch (listError) {
        console.error('Erro ao tentar listar abas para diagnóstico de obras:', listError);
      }
      
      // Se não conseguir conectar, retornar dados de exemplo
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro ao conectar com Google Sheets para Obras. Verifique as credenciais e o ID da planilha.',
          dadosMock: true,
          data: getMockObrasDemandas(), // Retornar dados de exemplo em caso de erro
          diagnostico: {
            clientEmail: process.env.GOOGLE_CLIENT_EMAIL ? 'Configurado' : 'Não configurado',
            privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Configurado' : 'Não configurado',
            sheetId: process.env.OBRAS_SHEET_ID || 'Não configurado'
          }
        }, 
        { status: 500 }
      );
    }
    
    // Buscar dados reais da planilha
    const dados = await getObrasDemandas();
    
    if (dados.length === 0) {
      // Se não houver dados, retornar dados de exemplo
      return NextResponse.json(
        { 
          success: true, 
          message: 'Nenhum dado encontrado na planilha de obras, usando dados de exemplo',
          dadosMock: true,
          data: getMockObrasDemandas()
        }
      );
    }
    
    // Retornar os dados com sucesso
    return NextResponse.json({
      success: true,
      message: 'Dados de obras e demandas obtidos com sucesso da planilha Google Sheets',
      dadosMock: false,
      data: dados
    });
  } catch (error) {
    console.error('Erro na API de obras:', error);
    
    // Em caso de erro, retornar dados de exemplo
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao processar requisição de obras: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        dadosMock: true,
        data: getMockObrasDemandas(),
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
} 