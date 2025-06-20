export interface ProjecaoVotos {
  municipio: string;
  votacao2022: string;
  votosProjetados: string;
  votos: number;
  lideranca: string;
  liderancaAtual: boolean;
  cargo2024: string;
  percentual: number;
}

export function buscarVotacao(dados: ProjecaoVotos[], termo: string, ano?: string): string | null {
  console.log('Buscando votação para:', termo);
  
  // Normaliza o termo de busca
  const termoNormalizado = termo.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // Procura o município nos dados
  const municipioEncontrado = dados.find(d => {
    const municipioNormalizado = d.municipio.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    return municipioNormalizado.includes(termoNormalizado);
  });

  if (!municipioEncontrado) {
    return null;
  }

  // Processa os votos
  const votos2022 = parseInt(municipioEncontrado.votacao2022.replace(/,/g, '') || '0', 10);
  const votosProjetados = parseInt(municipioEncontrado.votosProjetados.replace(/,/g, '') || '0', 10);
  
  // Calcula a diferença e o percentual de crescimento
  const diferenca = votosProjetados - votos2022;
  const percentualCrescimento = votos2022 > 0 ? ((diferenca / votos2022) * 100) : 0;

  // Formata a resposta com todos os detalhes
  const resposta = `📊 Análise de Votos - ${municipioEncontrado.municipio}:\n\n` +
    `🗳️ Votos Projetados 2026: ${votosProjetados.toLocaleString('pt-BR')}\n` +
    `📈 Votação 2022: ${votos2022.toLocaleString('pt-BR')}\n` +
    `${diferenca >= 0 ? '⬆️' : '⬇️'} Diferença: ${Math.abs(diferenca).toLocaleString('pt-BR')} votos\n` +
    `📊 Crescimento: ${percentualCrescimento.toFixed(1)}%`;

  return resposta;
} 