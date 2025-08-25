const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Script para converter planilha Excel de resultados eleitorais para JSON
 * Usage: node scripts/excelToResultadosEleitorais.js <caminho-para-planilha.xlsx>
 */

function normalizeString(str) {
  if (!str) return '';
  return str.toString().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  
  const strValue = value.toString().replace(/[^\d,.-]/g, '');
  const numValue = parseFloat(strValue.replace(',', '.'));
  return isNaN(numValue) ? 0 : numValue;
}

function convertExcelToResultadosEleitorais(excelFilePath) {
  try {
    console.log('🔄 Iniciando conversão da planilha de resultados eleitorais...');
    console.log(`📁 Arquivo: ${excelFilePath}`);
    
    if (!fs.existsSync(excelFilePath)) {
      throw new Error(`Arquivo não encontrado: ${excelFilePath}`);
    }

    // Ler a planilha
    const workbook = XLSX.readFile(excelFilePath);
    console.log(`📊 Planilha carregada. Abas encontradas: ${workbook.SheetNames.join(', ')}`);
    
    // Usar a primeira aba por padrão
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log(`📋 Processando aba: ${sheetName}`);
    
    // Converter para array de objetos
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`📝 Total de linhas encontradas: ${rawData.length}`);
    
    if (rawData.length === 0) {
      throw new Error('Planilha está vazia');
    }
    
    // Primeira linha são os cabeçalhos
    const headers = rawData[0];
    console.log(`🏷️  Cabeçalhos identificados: ${headers.join(', ')}`);
    
    const resultados = [];
    
    // Processar cada linha de dados (pular cabeçalho)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      if (!row || row.length === 0) continue; // Pular linhas vazias
      
      const resultado = {};
      
      // Mapear cada coluna para o objeto
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          const normalizedHeader = normalizeString(header).toLowerCase();
          let value = row[index];
          
          // Detectar e converter tipos de dados comuns
          if (typeof value === 'string') {
            value = value.trim();
            
            // Se parece com número, tentar converter
            if (/^\d+([,.]?\d+)?$/.test(value.replace(/[.\s]/g, ''))) {
              value = parseNumber(value);
            }
          } else if (typeof value === 'number') {
            value = parseNumber(value);
          }
          
          resultado[normalizedHeader] = value;
        }
      });
      
      // Só adicionar se tiver dados válidos
      if (Object.keys(resultado).length > 0) {
        resultados.push(resultado);
      }
    }
    
    console.log(`✅ Processamento concluído: ${resultados.length} registros válidos`);
    
    // Preparar dados finais
    const dadosFinais = {
      metadata: {
        arquivo: path.basename(excelFilePath),
        dataProcessamento: new Date().toISOString(),
        totalRegistros: resultados.length,
        colunas: headers,
        versao: '1.0'
      },
      resultados: resultados
    };
    
    // Salvar JSON na pasta public
    const outputPath = path.join(process.cwd(), 'public', 'resultados-eleitorais.json');
    fs.writeFileSync(outputPath, JSON.stringify(dadosFinais, null, 2), 'utf8');
    
    console.log(`💾 Arquivo JSON salvo em: ${outputPath}`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de registros: ${resultados.length}`);
    console.log(`   - Colunas: ${headers.length}`);
    console.log(`   - Tamanho do arquivo: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Mostrar preview dos primeiros registros
    console.log(`\n📋 Preview dos dados (primeiros 3 registros):`);
    resultados.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}:`, JSON.stringify(item, null, 2));
    });
    
    return dadosFinais;
    
  } catch (error) {
    console.error('❌ Erro ao converter planilha:', error.message);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Uso: node scripts/excelToResultadosEleitorais.js <caminho-para-planilha.xlsx>');
    console.log('📝 Exemplo: node scripts/excelToResultadosEleitorais.js ./resultados_eleicoes_2024.xlsx');
    process.exit(1);
  }
  
  const excelFilePath = path.resolve(args[0]);
  
  try {
    convertExcelToResultadosEleitorais(excelFilePath);
    console.log('\n🎉 Conversão concluída com sucesso!');
  } catch (error) {
    console.error('\n💥 Falha na conversão:', error.message);
    process.exit(1);
  }
}

module.exports = { convertExcelToResultadosEleitorais };
