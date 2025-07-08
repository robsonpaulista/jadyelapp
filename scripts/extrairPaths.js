const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../src/components/br-pi-nomes.svg');
const outputPath = path.join(__dirname, '../src/components/paths-extraidos.txt');

// Lê o arquivo SVG
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Extrai todos os paths
const pathRegex = /<path[^>]*id="([^"]*)"[^>]*d="([^"]*)"[^>]*\/>/g;
const paths = [];
let match;

while ((match = pathRegex.exec(svgContent)) !== null) {
  const id = match[1];
  const d = match[2];
  paths.push({ id, d });
}

// Gera o código React
let reactCode = '';
paths.forEach(({ id, d }) => {
  reactCode += `                <path microregion="22012" id="${id}" className="municipy" fill={getFill('${id}')} d="${d}"/>\n`;
});

// Salva o resultado
fs.writeFileSync(outputPath, reactCode);
console.log(`Extraídos ${paths.length} paths para ${outputPath}`); 