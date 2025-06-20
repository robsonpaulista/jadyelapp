const xlsx = require('xlsx');
const fs = require('fs');

// Função para normalizar nomes
function normalizeString(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Caminho do arquivo Excel
const workbook = xlsx.readFile('./public/populacaoibge.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

// Ajuste os nomes dos campos conforme o cabeçalho da sua planilha
const municipios = data.map(row => {
  const nome = row['NOME DO MUNICÍPIO'];
  return {
    nome,
    nome_normalizado: normalizeString(nome),
    codigo_ibge: row['COD. MUNIC'],
    populacao: row['POPULAÇÃO ESTIMADA'],
  };
});

fs.writeFileSync('./public/populacaoibge.json', JSON.stringify(municipios, null, 2), 'utf-8');
console.log('Arquivo populacaoibge.json gerado com sucesso!'); 