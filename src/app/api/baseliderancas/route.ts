import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Força runtime dinâmico para permitir uso de searchParams
export const dynamic = 'force-dynamic';

// Interface para os dados de liderança
interface Lideranca {
  id: string;
  nome: string;
  telefone: string;
  nivel: string;
  municipio: string;
  bairro?: string;
  votosProjetados: number;
  filhos: Lideranca[];
}

// Interface para estruturar os dados agrupados
interface DadosAgrupados {
  dados: Lideranca[];
  estatisticas: {
    totalRegistros: number;
    totalVotos: number;
    votosPromedio: number;
    municipios: Array<{
      municipio: string; 
      votos: number;
      bairros: Array<{bairro: string; votos: number}>;
    }>;
    niveis: {
      [key: string]: {
        count: number;
        votos: number;
      }
    };
  };
}

// Cache para armazenar resultados e evitar processamento repetido
let dadosCache: { dados: Lideranca[]; estatisticas: any } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos em milissegundos

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    console.log(`API BaseLiderancas: Iniciada, forceRefresh=${forceRefresh}, temCache=${dadosCache !== null}`);

    // SEMPRE forçar atualização - desabilitar cache temporariamente
    dadosCache = null;
    
    // Caminho para o arquivo Excel
    const filePath = path.join(process.cwd(), 'baseeleitores.xlsx');
    console.log('API BaseLiderancas: Caminho do arquivo:', filePath);
    
    // Verificar se estamos em ambiente de desenvolvimento para fornecer dados de demonstração
    const isDemo = !fs.existsSync(filePath);
    console.log('API BaseLiderancas: Modo demo?', isDemo);
    
    // Se o arquivo não existir, gera dados de demonstração
    if (isDemo) {
      console.log("API BaseLiderancas: Arquivo não encontrado. Gerando dados de demonstração.");
      const demoDados = gerarDadosDemonstracao();
      
      // Verificar se temos dados
      if (!demoDados.dados || demoDados.dados.length === 0) {
        console.error("API BaseLiderancas: Erro ao gerar dados de demonstração");
        return NextResponse.json({ 
          success: false, 
          message: "Erro ao gerar dados de demonstração"
        });
      }
      
      // Atualizar cache
      dadosCache = demoDados;
      lastFetchTime = now;
    
      console.log(`API BaseLiderancas: Retornando ${demoDados.dados.length} lideranças de demonstração`);
      return NextResponse.json({
        success: true,
        message: "Dados de demonstração gerados com sucesso",
        data: demoDados.dados,
        estatisticas: demoDados.estatisticas
      });
    }
    
    // Ler o arquivo Excel - adicionamos um try/catch aqui para tratar erros específicos ao ler o arquivo
    try {
      console.log("API BaseLiderancas: Tentando ler o arquivo Excel");
      
      // Lê o arquivo usando fs primeiro para evitar problemas de acesso
      const buffer = fs.readFileSync(filePath);
      
      // Converte o buffer usando xlsx
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      
      // Verificar se a aba "cadastro" existe
      if (!workbook.SheetNames.includes('cadastro')) {
        console.error("API BaseLiderancas: Aba 'cadastro' não encontrada na planilha");
        throw new Error("Aba 'cadastro' não encontrada na planilha");
      }
      
      // Obter os dados da aba "cadastro"
      const worksheet = workbook.Sheets['cadastro'];
      const rawData = xlsx.utils.sheet_to_json(worksheet);
      
      console.log(`API BaseLiderancas: Dados brutos obtidos: ${rawData.length} registros`);
      
      // Verificar cada registro para debug
      console.log("API BaseLiderancas: Primeiros 3 registros brutos:", JSON.stringify(rawData.slice(0, 3), null, 2));
      
      // Processar os dados usando a função processarDados (não a processarDadosExcel que não existe)
      const dadosProcessados = processarDados(rawData);
      
      // Loggar estrutura da hierarquia para depuração
      console.log(`API BaseLiderancas: Dados processados: ${dadosProcessados.length} lideranças raiz`);
      if (dadosProcessados.length > 0) {
        const estrutura = dadosProcessados.map(r => ({
          id: r.id,
          nome: r.nome,
          nivel: r.nivel,
          filhosImediatos: r.filhos.length,
          filhosPorNivel: r.filhos.reduce((acc, filho) => {
            acc[filho.nivel] = (acc[filho.nivel] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }));
        console.log(`API BaseLiderancas: Estrutura da hierarquia:`, JSON.stringify(estrutura, null, 2));
      }
      
      // Calcular estatísticas
      const estatisticas = calcularEstatisticas(rawData, dadosProcessados);
      
      // Verificar se temos dados
      if (!dadosProcessados || dadosProcessados.length === 0) {
        console.error("API BaseLiderancas: Nenhum dado processado, usando demonstração");
        const demoDados = gerarDadosDemonstracao();
        
        // Atualizar cache
        dadosCache = demoDados;
        lastFetchTime = now;
        
        return NextResponse.json({
          success: true,
          message: "Nenhum dado encontrado na planilha. Usando dados de demonstração.",
          data: demoDados.dados,
          estatisticas: demoDados.estatisticas,
          isDemo: true
        });
      }
      
      // Atualizar cache
      dadosCache = {
        dados: dadosProcessados,
        estatisticas
      };
      lastFetchTime = now;
      
      // Verificar se a estrutura pode ser serializada corretamente
      if (!verificarProfundidadeJSON(dadosProcessados)) {
        console.error("API BaseLiderancas: Problema na estrutura de dados para serialização JSON");
        return NextResponse.json({ 
          success: false, 
          message: "Erro na estrutura de dados. Possível referência circular."
        });
      }

      // Contagem de registros por nível na hierarquia final
      const contarRegistrosPorNivel = (items: Lideranca[]): Record<string, number> => {
        const contagem: Record<string, number> = {};
        
        const processar = (item: Lideranca) => {
          const nivel = item.nivel || 'desconhecido';
          contagem[nivel] = (contagem[nivel] || 0) + 1;
          
          for (const filho of item.filhos) {
            processar(filho);
          }
        };
        
        for (const item of items) {
          processar(item);
        }
        
        return contagem;
      };
      
      const contagemPorNivel = contarRegistrosPorNivel(dadosProcessados);
      
      console.log(`API BaseLiderancas: Retornando ${dadosProcessados.length} lideranças raiz, com distribuição:`, contagemPorNivel);
      return NextResponse.json({
        success: true,
        message: "Dados processados com sucesso",
        data: dadosProcessados,
        estatisticas,
        registrosBrutos: rawData.length,
        registrosProcessados: dadosProcessados.length,
        distribuicaoNiveis: contagemPorNivel,
        tempoProcessamento: Date.now() - now + 'ms'
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
    } catch (err) {
      console.error("API BaseLiderancas: Erro ao processar planilha:", err);
      const demoDados = gerarDadosDemonstracao();
      
      // Atualizar cache com dados de demonstração em caso de erro
      dadosCache = demoDados;
      lastFetchTime = now;
      
      return NextResponse.json({
        success: true,
        message: "Erro ao processar planilha. Usando dados de demonstração.",
        data: demoDados.dados,
        estatisticas: demoDados.estatisticas,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      });
    }
    
  } catch (error) {
    console.error("API BaseLiderancas: Erro geral:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao processar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      },
      { status: 500 }
    );
  }
}

// Função para processar os dados e criar hierarquia - otimizada
function processarDados(rawData: any[]): Lideranca[] {
  // Se não houver dados, retorna array vazio
  if (!rawData || rawData.length === 0) return [];
  
  console.log("API BaseLiderancas: Iniciando processamento de dados [VERSÃO HIERÁRQUICA COMPLETA]");
  console.log(`API BaseLiderancas: Processando ${rawData.length} registros brutos`);
  
  try {
    // Detectar nomes das colunas importantes no primeiro registro
    const amostra = rawData[0];
    const colunas = Object.keys(amostra);
    
    console.log("API BaseLiderancas: Colunas detectadas:", colunas);
    
    // Definir colunas importantes
    const colunaNome = "NOME ";  // A coluna tem um espaço após o nome
    const colunaLider = "LIDER";
    const colunaMunicipio = "MUNICIPIO";
    const colunaNivel = "NIVEL";
    const colunaVotos = "VOTOS";
    const colunaBairro = "BAIRRO";
    
    // Ordem exata dos níveis hierárquicos
    const ordemNiveis = [
      'candidato',
      'lideranca', 
      'liderancanivel1', 
      'liderancanivel2', 
      'liderancanivel3', 
      'liderancanivel4', 
      'liderancanivel5'
    ];
    
    // Mapas para armazenar objetos por nível
    const mapaCompleto: Record<string, Lideranca> = {};
    const registrosPorNivel: Record<string, Lideranca[]> = {};
    
    // Inicializar arrays para cada nível
    ordemNiveis.forEach(nivel => {
      registrosPorNivel[nivel] = [];
    });
    
    // Normalizar o valor do nível
    const normalizarNivel = (nivel: string): string => {
      if (!nivel) return 'lideranca';
      
      const nivelLower = nivel.toLowerCase().trim();
      
      if (nivelLower === 'candidato') return 'candidato';
      if (nivelLower === 'lideranca') return 'lideranca';
      if (nivelLower === 'lideranca n1' || nivelLower === 'liderancanivel1') return 'liderancanivel1';
      if (nivelLower === 'lideranca n2' || nivelLower === 'liderancanivel2') return 'liderancanivel2';
      if (nivelLower === 'lideranca n3' || nivelLower === 'liderancanivel3') return 'liderancanivel3';
      if (nivelLower === 'lideranca n4' || nivelLower === 'liderancanivel4') return 'liderancanivel4';
      if (nivelLower === 'lideranca n5' || nivelLower === 'liderancanivel5') return 'liderancanivel5';
      
      // Caso não reconheça o nível exato, tenta extrair o número
      if (nivelLower.includes('nivel') || nivelLower.includes('nível') || nivelLower.includes('n')) {
        const match = nivelLower.match(/\d+/);
        if (match) {
          return `liderancanivel${match[0]}`;
        }
      }
      
      // Caso padrão
      return 'lideranca';
    };
    
    console.log("API BaseLiderancas: Processando registros...");
    
    // Registrar os níveis encontrados no dataset
    const niveisEncontrados = new Set<string>();
    
    // Primeiro passo: classificar todos os registros por nível
    for (const item of rawData) {
      const nome = item[colunaNome]?.toString().trim();
      if (!nome) {
        console.log("API BaseLiderancas: Registro sem nome encontrado, ignorando");
        continue;
      }
      
      const votos = parseInt(item[colunaVotos]?.toString() || '0') || 0;
      const nivelBruto = (item[colunaNivel]?.toString() || '').toLowerCase();
      const nivel = normalizarNivel(nivelBruto);
      const municipio = item[colunaMunicipio]?.toString().trim() || 'Não especificado';
      
      // Registrar nível encontrado
      niveisEncontrados.add(nivel);
      
      // Usar o nome normalizado (lowercase) como ID para evitar duplicações
      const id = nome.toLowerCase();
      
      // Criar nova liderança
      const novaLideranca: Lideranca = {
        id,
        nome,
        telefone: '',
        nivel: nivel,
        municipio: municipio,
        bairro: item[colunaBairro]?.toString().trim() || 'Não especificado',
        votosProjetados: votos,
        filhos: []
      };
      
      // Adicionar ao mapa completo
      mapaCompleto[id] = novaLideranca;
      
      // Adicionar ao array do seu nível
      if (registrosPorNivel[nivel]) {
        registrosPorNivel[nivel].push(novaLideranca);
      } else {
        // Se o nível não estiver na ordem pré-definida, trata como liderança geral
        registrosPorNivel['lideranca'].push(novaLideranca);
      }
    }
    
    // Log da quantidade de registros por nível e níveis encontrados
    console.log("API BaseLiderancas: Níveis encontrados no dataset:", Array.from(niveisEncontrados));
    ordemNiveis.forEach(nivel => {
      console.log(`API BaseLiderancas: Nível ${nivel}: ${registrosPorNivel[nivel].length} registros`);
    });
    
    // FORÇAR: Se não tiver candidatos, criar um candidato fictício
    if (registrosPorNivel['candidato'].length === 0) {
      const candidatoFicticio: Lideranca = {
        id: 'candidato-ficticio',
        nome: 'Candidato',
        telefone: '',
        nivel: 'candidato',
        municipio: 'Global',
        votosProjetados: 0,
        filhos: []
      };
      
      registrosPorNivel['candidato'].push(candidatoFicticio);
      mapaCompleto[candidatoFicticio.id] = candidatoFicticio;
      console.log('API BaseLiderancas: Candidato fictício criado para manter a hierarquia');
    }
    
    // Construir a hierarquia exata por níveis
    const raizes = [...registrosPorNivel['candidato']];
    console.log(`API BaseLiderancas: ${raizes.length} candidatos como raízes`);
    
    // IMPLEMENTAÇÃO DIRETA POR NÍVEIS (sem distribuição complexa)
    // Para cada nível, conectar diretamente ao nível anterior
    
    console.log("API BaseLiderancas: Construindo hierarquia completa de níveis...");
    
    // Para cada nível, exceto o primeiro (candidato que já são raízes)
    for (let i = 1; i < ordemNiveis.length; i++) {
      const nivelAtual = ordemNiveis[i];
      const nivelAnterior = ordemNiveis[i-1];
      
      const registrosNivelAtual = registrosPorNivel[nivelAtual];
      const registrosNivelAnterior = registrosPorNivel[nivelAnterior];
      
      if (registrosNivelAtual.length === 0) {
        console.log(`API BaseLiderancas: Nível ${nivelAtual} vazio, pulando`);
        continue;
      }
      
      if (registrosNivelAnterior.length === 0) {
        console.log(`API BaseLiderancas: Nível anterior ${nivelAnterior} vazio, criando item fictício`);
        
        // Criar um item fictício no nível anterior para manter a hierarquia
        const itemFicticio: Lideranca = {
          id: `ficticio-${nivelAnterior}`,
          nome: `${nivelAnterior.charAt(0).toUpperCase() + nivelAnterior.slice(1)}`,
          telefone: '',
          nivel: nivelAnterior,
          municipio: 'Global',
          votosProjetados: 0,
          filhos: []
        };
        
        registrosPorNivel[nivelAnterior].push(itemFicticio);
        
        // Se for o primeiro nível após as raízes, conectar às raízes
        if (i === 1) {
          if (raizes.length > 0) {
            raizes[0].filhos.push(itemFicticio);
          } else {
            raizes.push(itemFicticio);
          }
        } else {
          // Conectar ao nível anterior ao anterior
          const nivelAnteriorAnterior = ordemNiveis[i-2];
          if (registrosPorNivel[nivelAnteriorAnterior].length > 0) {
            registrosPorNivel[nivelAnteriorAnterior][0].filhos.push(itemFicticio);
          }
        }
      }
      
      console.log(`API BaseLiderancas: Conectando ${registrosNivelAtual.length} registros de nível ${nivelAtual} a ${registrosNivelAnterior.length} registros de nível ${nivelAnterior}`);
      
      // DISTRIBUIÇÃO MELHORADA: Tentar distribuir os filhos de forma mais equilibrada
      // entre os pais, levando em consideração a localidade/município quando possível
      
      // Agrupar os registros do nível atual por município para tentar manter juntos os da mesma região
      const registrosPorMunicipio: Record<string, Lideranca[]> = {};
      
      for (const registro of registrosNivelAtual) {
        const municipio = registro.municipio || "Não especificado";
        if (!registrosPorMunicipio[municipio]) {
          registrosPorMunicipio[municipio] = [];
        }
        registrosPorMunicipio[municipio].push(registro);
      }
      
      // Distribuir os registros agrupados por município entre os pais
      let indiceProximoPai = 0;
      
      for (const municipio in registrosPorMunicipio) {
        const registrosDoMunicipio = registrosPorMunicipio[municipio];
        
        // Para cada grupo de município, selecionar um pai do nível anterior e distribuir os filhos
        for (let j = 0; j < registrosDoMunicipio.length; j++) {
          const registroFilho = registrosDoMunicipio[j];
          
          // Encontrar um pai que idealmente seja do mesmo município
          let paiSelecionado = null;
          
          // Tentar encontrar um pai do mesmo município primeiro
          for (const potencialPai of registrosNivelAnterior) {
            if (potencialPai.municipio === municipio) {
              paiSelecionado = potencialPai;
              break;
            }
          }
          
          // Se não encontrou pai do mesmo município, usar distribuição circular
          if (!paiSelecionado) {
            indiceProximoPai = indiceProximoPai % registrosNivelAnterior.length;
            paiSelecionado = registrosNivelAnterior[indiceProximoPai];
            indiceProximoPai++;
          }
          
          // Adicionar filho ao pai selecionado
          paiSelecionado.filhos.push(registroFilho);
        }
      }
    }
    
    // Calcular votos para toda a hierarquia
    const calcularVotosTotais = (lideranca: Lideranca): number => {
      let total = lideranca.votosProjetados || 0;
      
      for (const filho of lideranca.filhos) {
        total += calcularVotosTotais(filho);
      }
      
      return total;
    };
    
    // Atualizar votosProjetados para candidatos baseado em seus filhos
    for (const candidato of raizes) {
      const votosTotais = calcularVotosTotais(candidato);
      if (candidato.votosProjetados === 0) {
        candidato.votosProjetados = votosTotais;
      }
    }
    
    // VERIFICAÇÃO FINAL: Garantir que TODOS os registros estão incluídos na hierarquia
    // Primeiro, criar um conjunto com IDs de todos os registros já incluídos na hierarquia
    const idsProcessados = new Set<string>();
    
    const contarProcessados = (lideranca: Lideranca) => {
      idsProcessados.add(lideranca.id);
      for (const filho of lideranca.filhos) {
        contarProcessados(filho);
      }
    };
    
    // Contar todos os registros já incluídos na hierarquia
    for (const raiz of raizes) {
      contarProcessados(raiz);
    }
    
    // Se tem registros não processados, forçar inclusão na hierarquia
    const totalRegistros = Object.keys(mapaCompleto).length;
    const registrosProcessados = idsProcessados.size;
    
    console.log(`API BaseLiderancas: Verificação final - ${registrosProcessados}/${totalRegistros} registros incluídos na hierarquia`);
    
    if (registrosProcessados < totalRegistros) {
      // Encontrar registros não processados
      const registrosNaoProcessados: Lideranca[] = [];
      
      for (const id in mapaCompleto) {
        if (!idsProcessados.has(id)) {
          registrosNaoProcessados.push(mapaCompleto[id]);
        }
      }
      
      console.log(`API BaseLiderancas: Forçando inclusão de ${registrosNaoProcessados.length} registros não processados`);
      
      // Se temos pelo menos uma raiz, adicionar como filhos dela
      if (raizes.length > 0) {
        for (const registro of registrosNaoProcessados) {
          // Encontrar a raiz com menos filhos para balancear
          raizes.sort((a, b) => a.filhos.length - b.filhos.length);
          raizes[0].filhos.push(registro);
          console.log(`API BaseLiderancas: Adicionando registro ${registro.nome} (${registro.nivel}) à raiz ${raizes[0].nome}`);
        }
      } else {
        // Se não temos raízes, adicionar esses registros como raízes
        raizes.push(...registrosNaoProcessados);
        console.log(`API BaseLiderancas: Adicionando ${registrosNaoProcessados.length} registros como raízes`);
      }
    }
    
    // Verifica novamente se todos os registros estão na hierarquia
    idsProcessados.clear();
    for (const raiz of raizes) {
      contarProcessados(raiz);
    }
    
    console.log(`API BaseLiderancas: Hierarquia construída com ${raizes.length} raízes e ${idsProcessados.size}/${totalRegistros} registros totais incluídos`);
    
    // Adicionar log detalhado da estrutura hierárquica
    const estruturaHierarquica: Record<string, number> = {};
    ordemNiveis.forEach(nivel => {
      estruturaHierarquica[nivel] = 0;
    });
    
    const contarPorNivel = (lideranca: Lideranca) => {
      estruturaHierarquica[lideranca.nivel] = (estruturaHierarquica[lideranca.nivel] || 0) + 1;
      for (const filho of lideranca.filhos) {
        contarPorNivel(filho);
      }
    };
    
    for (const raiz of raizes) {
      contarPorNivel(raiz);
    }
    
    console.log("API BaseLiderancas: Estrutura hierárquica final (contagem por nível):", estruturaHierarquica);
    
    return raizes;
  } catch (error) {
    console.error("API BaseLiderancas: Erro ao processar dados:", error);
    return [];
  }
}

// Função otimizada para calcular estatísticas
function calcularEstatisticas(rawData: any[], dadosProcessados: Lideranca[]): DadosAgrupados['estatisticas'] {
  // Mapas para armazenar dados agrupados
  const municipiosMap = new Map<string, {votos: number, bairros: Map<string, number>}>();
  const niveisMap = new Map<string, {count: number, votos: number}>();
  
  let totalVotos = 0;
  let totalRegistros = 0;
  
  // Processar todos os registros em uma única passagem
  const processarRegistros = (items: Lideranca[]) => {
    const queue = [...items];
    
    while (queue.length > 0) {
      const item = queue.shift()!;
      totalRegistros++;
      
      // Adicionar votos ao total
      totalVotos += item.votosProjetados || 0;
      
      // Adicionar ao mapa de municípios
      if (item.municipio) {
        const municipio = item.municipio.trim();
        if (!municipiosMap.has(municipio)) {
          municipiosMap.set(municipio, {votos: 0, bairros: new Map()});
        }
        
        const dadosMunicipio = municipiosMap.get(municipio)!;
        dadosMunicipio.votos += item.votosProjetados || 0;
        
        // Adicionar ao mapa de bairros deste município
        if (item.bairro) {
          const bairro = item.bairro.trim();
          if (!dadosMunicipio.bairros.has(bairro)) {
            dadosMunicipio.bairros.set(bairro, 0);
          }
          
          dadosMunicipio.bairros.set(
            bairro, 
            dadosMunicipio.bairros.get(bairro)! + (item.votosProjetados || 0)
          );
        }
      }
      
      // Adicionar ao mapa de níveis
      if (item.nivel) {
        const nivel = item.nivel.trim().toLowerCase();
        if (!niveisMap.has(nivel)) {
          niveisMap.set(nivel, {count: 0, votos: 0});
        }
        
        const dadosNivel = niveisMap.get(nivel)!;
        dadosNivel.count++;
        dadosNivel.votos += item.votosProjetados || 0;
      }
      
      // Adicionar filhos à fila para processamento
      if (item.filhos && item.filhos.length > 0) {
        queue.push(...item.filhos);
      }
    }
  };
  
  // Processar todos os registros
  processarRegistros(dadosProcessados);
  
  // Calcular média de votos
  const votosPromedio = totalRegistros > 0 ? Math.round(totalVotos / totalRegistros) : 0;
  
  // Converter mapas para arrays e objetos para o formato final
  const municipios = Array.from(municipiosMap.entries()).map(([municipio, dados]) => ({
    municipio,
    votos: dados.votos,
    bairros: Array.from(dados.bairros.entries()).map(([bairro, votos]) => ({
      bairro,
      votos
    })).sort((a, b) => b.votos - a.votos) // Ordenar bairros por votos (decrescente)
  })).sort((a, b) => b.votos - a.votos); // Ordenar municípios por votos (decrescente)
  
  const niveis: {[key: string]: {count: number, votos: number}} = {};
  niveisMap.forEach((dados, nivel) => {
    niveis[nivel] = dados;
  });
  
  return {
    totalRegistros,
    totalVotos,
    votosPromedio,
    municipios,
    niveis
  };
}

// Função para gerar dados de demonstração
function gerarDadosDemonstracao(): DadosAgrupados {
  // Criar candidato (nível mais alto)
  const candidato: Lideranca = {
    id: 'candidato-1',
    nome: 'Jadyel Alencar',
    telefone: '(86) 9xxxx-xxxx',
    nivel: 'candidato',
    municipio: 'Teresina',
    votosProjetados: 2000,
    filhos: []
  };
  
  // Criar coordenadores regionais (nível 1)
  const regioes = [
    { nome: 'Norte', municipio: 'Teresina', votos: 600 },
    { nome: 'Sul', municipio: 'Picos', votos: 500 },
    { nome: 'Leste', municipio: 'Parnaíba', votos: 450 },
    { nome: 'Oeste', municipio: 'Floriano', votos: 400 }
  ];
  
  const coordenadores: Lideranca[] = regioes.map((regiao, index) => {
    return {
      id: `coord-${index+1}`,
      nome: `Coordenador ${regiao.nome}`,
      telefone: `(86) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      nivel: 'lideranca',
      municipio: regiao.municipio,
      votosProjetados: regiao.votos,
      filhos: []
    };
  });
  
  // Adicionar coordenadores como filhos do candidato
  candidato.filhos = coordenadores;
  
  // Criar lideranças de nível 1 para cada coordenador
  coordenadores.forEach((coordenador) => {
    const numLiderancas = Math.floor(Math.random() * 3) + 2; // 2 a 4 lideranças por coordenador
    
    for (let i = 0; i < numLiderancas; i++) {
      const liderancaN1: Lideranca = {
        id: `lid-n1-${coordenador.id}-${i+1}`,
        nome: `Liderança ${coordenador.municipio} ${i+1}`,
        telefone: `(86) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        nivel: 'liderancanivel1',
        municipio: coordenador.municipio,
        votosProjetados: Math.floor(coordenador.votosProjetados / (numLiderancas + 1)),
        filhos: []
      };
      
      // Adicionar lideranças nível 2
      const numLiderancasN2 = Math.floor(Math.random() * 3) + 1; // 1 a 3 lideranças nível 2
      
      for (let j = 0; j < numLiderancasN2; j++) {
        const liderancaN2: Lideranca = {
          id: `lid-n2-${liderancaN1.id}-${j+1}`,
          nome: `Subliderança ${coordenador.municipio} ${i+1}-${j+1}`,
          telefone: `(86) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          nivel: 'liderancanivel2',
          municipio: coordenador.municipio,
          votosProjetados: Math.floor(liderancaN1.votosProjetados / (numLiderancasN2 + 1)),
          filhos: []
        };
        
        liderancaN1.filhos.push(liderancaN2);
      }
      
      coordenador.filhos.push(liderancaN1);
    }
  });
  
  // Adicionar mais alguns municípios independentes
  const outrosMunicipios = [
    'Altos', 'Campo Maior', 'José de Freitas', 'União', 'Barras',
    'Piripiri', 'Pedro II', 'Oeiras', 'Simplício Mendes'
  ];
  
  outrosMunicipios.forEach((municipio, index) => {
    const liderancaMunicipio: Lideranca = {
      id: `lid-mun-${index+1}`,
      nome: `Coordenador ${municipio}`,
      telefone: `(86) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      nivel: 'lideranca',
      municipio,
      votosProjetados: Math.floor(Math.random() * 200) + 100,
      filhos: []
    };
    
    // Adicionar algumas sublideranças
    const numSubliderancas = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numSubliderancas; i++) {
      liderancaMunicipio.filhos.push({
        id: `sublid-mun-${index+1}-${i+1}`,
        nome: `Liderança ${municipio} ${i+1}`,
        telefone: `(86) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        nivel: 'liderancanivel1',
        municipio,
        votosProjetados: Math.floor(liderancaMunicipio.votosProjetados / (numSubliderancas + 1)),
        filhos: []
      });
    }
    
    candidato.filhos.push(liderancaMunicipio);
  });
  
  // Calcular estatísticas para os dados de demonstração
  // Converter a estrutura hierárquica para flat array para calcular estatísticas
  const flatData: any[] = [];
  
  function flattenData(lideranca: Lideranca, parentId: string | null = null) {
    flatData.push({
      id: lideranca.id,
      nome: lideranca.nome,
      telefone: lideranca.telefone,
      nivel: lideranca.nivel,
      municipio: lideranca.municipio,
      votos: lideranca.votosProjetados,
      liderancapai: parentId
    });
    
    lideranca.filhos.forEach(filho => flattenData(filho, lideranca.id));
  }
  
  flattenData(candidato);
  
  const dados = [candidato];
  const estatisticas = calcularEstatisticas(flatData, dados);
  
  return {
    dados,
    estatisticas
  };
}

// Verificar se a estrutura de dados está válida para JSON
function verificarProfundidadeJSON(obj: any, path = '', maxDepth = 20, visitedObjects = new WeakSet()): boolean {
  // Aumentamos o limite de profundidade para 20
  if (maxDepth <= 0) {
    console.error(`API: Estrutura muito profunda em ${path}. Possível problema de referência circular.`);
    return false;
  }
  
  if (obj === null || typeof obj !== 'object') {
    return true;
  }
  
  // Detectar referências circulares usando WeakSet
  if (visitedObjects.has(obj)) {
    console.error(`API: Referência circular detectada em ${path}`);
    return false;
  }
  
  // Adicionar este objeto ao conjunto de objetos visitados
  visitedObjects.add(obj);
  
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (!verificarProfundidadeJSON(obj[i], `${path}[${i}]`, maxDepth - 1, visitedObjects)) {
        return false;
      }
    }
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (!verificarProfundidadeJSON(obj[key], `${path}.${key}`, maxDepth - 1, visitedObjects)) {
          return false;
        }
      }
    }
  }
  
  return true;
}
