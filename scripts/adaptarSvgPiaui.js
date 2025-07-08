const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../src/components/br-pi.svg');
const jsonPath = path.join(__dirname, '../public/populacaoibge.json');
const outputPath = path.join(__dirname, '../src/components/br-pi-nomes.svg');

// Carrega o dicionário código_ibge -> nome_normalizado
const municipios = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const ibgeToNome = {};
municipios.forEach(m => {
  // O SVG usa código IBGE de 7 dígitos, então precisamos padronizar
  // Ex: 2203008
  let codigo = m.codigo_ibge;
  if (codigo.length < 7) {
    // Adiciona o prefixo do Piauí (22) e zeros à esquerda
    codigo = '22' + codigo.padStart(5, '0');
  }
  ibgeToNome[codigo] = m.nome_normalizado.replace(/ /g, '').normalize('NFD').replace(/[^a-zA-Z0-9]/g, '');
});

let svg = fs.readFileSync(svgPath, 'utf8');

// Substitui os ids dos paths
svg = svg.replace(/id="(\d{7})"/g, (match, ibge) => {
  if (ibgeToNome[ibge]) {
    return `id="${ibgeToNome[ibge]}"`;
  } else {
    return match; // mantém o original se não encontrar
  }
});

fs.writeFileSync(outputPath, svg, 'utf8');
console.log('SVG adaptado salvo em:', outputPath); 