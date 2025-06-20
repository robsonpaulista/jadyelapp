import { NextResponse } from 'next/server';
import { getProjecaoVotos } from '@/lib/projecao2026';

// Endpoint para buscar dados de projeção
export async function GET() {
  try {
    console.log("=== INICIANDO API DE PROJEÇÃO DE VOTOS ===");
    console.log(`ID da planilha configurado: ${process.env.PROJECAO_SHEET_ID}`);
    console.log(`Nome da aba configurada: ${process.env.PROJECAO_SHEET_NAME}`);
    console.log(`Email da conta de serviço: ${process.env.PROJECAO_CLIENT_EMAIL}`);
    console.log(`Colunas configuradas: ${process.env.PROJECAO_SHEET_COLUMNS}`);
    
    // Buscar dados reais da planilha
    const dados = await getProjecaoVotos();
    
    if (!dados.tabelaDados || dados.tabelaDados.length === 0) {
      console.log("Nenhum dado de projeção encontrado na planilha, usando dados de exemplo");
      
      // Se não houver dados, retornar dados de exemplo
      return NextResponse.json(
        { 
          success: true, 
          message: 'Nenhum dado encontrado na planilha, usando dados de exemplo',
          dadosMock: true,
          data: getMockData()
        }
      );
    }
    
    console.log(`Retornando ${dados.tabelaDados.length} itens de projeção obtidos com sucesso da API`);
    
    // Retornar os dados com sucesso
    return NextResponse.json({
      success: true,
      message: 'Dados de projeção obtidos com sucesso da planilha Google Sheets',
      dadosMock: false,
      data: dados.tabelaDados,
      stats: {
        totalVotos: dados.totalVotos,
        totalMunicipios: dados.totalMunicipios,
        mediaVotos: dados.mediaVotos,
        liderancas: dados.liderancas
      }
    });
  } catch (error) {
    console.error('Erro na API de projeção:', error);
    
    // Em caso de erro, retornar dados de exemplo
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        dadosMock: true,
        data: getMockData(),
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
}

// Função para gerar dados de exemplo
function getMockData() {
  return [
    { municipio: 'Teresina', lideranca: 'João Silva', liderancaAtual: true, cargo2024: 'Vereador', votos: 125000, votacao2022: '120,000' },
    { municipio: 'Parnaíba', lideranca: 'Maria Oliveira', liderancaAtual: true, cargo2024: 'Prefeito', votos: 38500, votacao2022: '35,500' },
    { municipio: 'Picos', lideranca: 'Pedro Santos', liderancaAtual: false, cargo2024: 'Vereador', votos: 27200, votacao2022: '25,800' },
    { municipio: 'Floriano', lideranca: 'Ana Costa', liderancaAtual: true, cargo2024: 'Vereador', votos: 21500, votacao2022: '20,100' },
    { municipio: 'Piripiri', lideranca: 'Carlos Pereira', liderancaAtual: false, cargo2024: 'Não candidato', votos: 18300, votacao2022: '17,500' },
    { municipio: 'Campo Maior', lideranca: 'José Ferreira', liderancaAtual: true, cargo2024: 'Prefeito', votos: 16700, votacao2022: '15,900' },
    { municipio: 'Barras', lideranca: 'Antônio Souza', liderancaAtual: false, cargo2024: 'Vereador', votos: 14200, votacao2022: '13,800' },
    { municipio: 'Pedro II', lideranca: 'Paulo Lima', liderancaAtual: true, cargo2024: 'Vereador', votos: 12500, votacao2022: '11,900' },
    { municipio: 'José de Freitas', lideranca: 'Raimundo Neto', liderancaAtual: false, cargo2024: 'Não candidato', votos: 11800, votacao2022: '11,200' },
    { municipio: 'Oeiras', lideranca: 'Francisco Gomes', liderancaAtual: true, cargo2024: 'Prefeito', votos: 10900, votacao2022: '10,500' },
  ];
} 