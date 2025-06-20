import { NextResponse } from 'next/server';
import { getObrasDemandas, getMockObrasDemandas, testeConexao, listarAbas } from '@/lib/googleSheets';
import { ObraDemanda } from "@/lib/googleSheets";

export async function GET() {
  try {
    console.log('=== INICIANDO API DE OBRAS E DEMANDAS ===');
    
    // Verificar conexão com o Google Sheets
    console.log('Testando conexão com Google Sheets...');
    const conexaoOk = await testeConexao();
    
    if (!conexaoOk) {
      console.error("Erro de conexão com o Google Sheets");
      
      // Tentar listar abas para diagnóstico
      try {
        console.log('Tentando listar abas para diagnóstico...');
        const abas = await listarAbas(process.env.OBRAS_SHEET_ID);
        console.log("Abas encontradas:", abas);
      } catch (error) {
        console.error("Erro ao listar abas:", error);
      }
      
      // Retornar dados mock caso a conexão falhe
      console.log('Retornando dados mock...');
      const dadosMock = await getMockObrasDemandas();
      
      return NextResponse.json({
        success: false,
        message: "Erro de conexão com o Google Sheets. Exibindo dados de exemplo.",
        dadosMock: true,
        data: dadosMock,
        stats: null
      });
    }
    
    // Buscar dados reais
    console.log('Buscando dados reais da planilha...');
    const dados = await getObrasDemandas();
    
    if (!dados || dados.length === 0) {
      console.log('Nenhum dado encontrado na planilha');
      // Se não houver dados, retornar mensagem e dados mock
      const dadosMock = await getMockObrasDemandas();
      
      return NextResponse.json({
        success: false,
        message: "Não foram encontrados registros de obras e demandas na planilha.",
        dadosMock: true,
        data: dadosMock,
        stats: null
      });
    }
    
    console.log('Dados obtidos com sucesso. Número de registros:', dados.length);
    
    // Calcular estatísticas com dados reais
    const totalObras = dados.length;
    const totalValor = dados.reduce((acc, curr) => {
      const valor = parseFloat(curr['VALOR '] || '0');
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
    const municipios = Array.from(new Set(dados.map(item => item.MUNICIPIO)));
    const tiposObras = Array.from(new Set(dados.map(item => item['AÇÃO/OBJETO'])));
    
    // Calcular obras por status
    const obrasPorStatus: Record<string, number> = {};
    dados.forEach(obra => {
      const status = obra.STATUS || 'Sem status';
      if (!obrasPorStatus[status]) {
        obrasPorStatus[status] = 0;
      }
      obrasPorStatus[status]++;
    });
    
    // Calcular obras por município
    const obrasPorMunicipio = municipios.map(municipio => {
      const obrasMunicipio = dados.filter(obra => obra.MUNICIPIO === municipio);
      const total = obrasMunicipio.length;
      const valorTotal = obrasMunicipio.reduce((acc, curr) => {
        const valor = parseFloat(curr['VALOR '] || '0');
        return acc + (isNaN(valor) ? 0 : valor);
      }, 0);
      
      return {
        municipio,
        total,
        valorTotal
      };
    }).sort((a, b) => b.valorTotal - a.valorTotal);
    
    console.log('Preparando resposta final...');
    const response = {
      success: true,
      dadosMock: false,
      data: dados,
      stats: {
        totalObras,
        totalValor,
        totalMunicipios: municipios.length,
        tiposObras: tiposObras.length,
        obrasPorStatus,
        obrasPorMunicipio
      }
    };
    
    console.log('Enviando resposta...');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Erro na API de obras e demandas:", error);
    
    // Em caso de erro, retornar dados mock
    const dadosMock = await getMockObrasDemandas();
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao processar dados",
      dadosMock: true,
      data: dadosMock,
      stats: null
    });
  }
} 