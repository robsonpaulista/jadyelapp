const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Lê a planilha
const workbook = XLSX.readFile('../municipiosporterritorio.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converte para JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Colunas disponíveis:', Object.keys(data[0] || {}));

// Organiza os dados por território
const territorios = data.reduce((acc, row) => {
  // Agora usando as colunas corretas identificadas
  const territorio = row['Território '] || row['Território'] || row.Territorio;
  const municipio = row['Município'] || row.Municipio;
  
  if (!territorio || !municipio) return acc;
  
  // Limpa espaços extras do território
  const territorioLimpo = territorio.trim();
  
  if (!acc[territorioLimpo]) {
    acc[territorioLimpo] = [];
  }
  
  acc[territorioLimpo].push(municipio.trim());
  return acc;
}, {});

console.log('Territórios processados:', Object.keys(territorios));
console.log('Total de territórios:', Object.keys(territorios).length);

// Salva o arquivo JSON
fs.writeFileSync(
  path.join(__dirname, '../public/territorios.json'),
  JSON.stringify(territorios, null, 2)
);

console.log('Arquivo territorios.json criado com sucesso!'); 