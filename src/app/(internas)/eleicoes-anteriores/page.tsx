"use client";

import React, { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { X, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getLimiteMacByMunicipio } from '@/utils/limitesmac';
import { getLimitePapByMunicipio } from '@/utils/limitepap';
import { disableConsoleLogging } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Função para normalizar texto (remover acentos e padronizar capitalização)
function normalizeString(str: string) {
  return (str || '')
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove tudo que não é letra, número ou espaço
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim();
}

// Função para classificar porte e valor SUAS
function classificaPorteESUAS(populacao: number | null) {
  if (populacao === null) return { porte: '-', valor: '-' };
  if (populacao <= 20000) return { porte: 'Pequeno Porte I', valor: 'R$ 1.000.000,00' };
  if (populacao <= 50000) return { porte: 'Pequeno Porte II', valor: 'R$ 2.300.000,00' };
  if (populacao <= 100000) return { porte: 'Médio Porte', valor: 'R$ 4.100.000,00' };
  if (populacao <= 900000) return { porte: 'Grande Porte', valor: 'R$ 8.800.000,00' };
  return { porte: 'Metrópole', valor: 'R$ 22.700.000,00' };
}

// Função para buscar população do município selecionado no arquivo JSON local
async function fetchPopulacaoMunicipio(nomeMunicipio: string): Promise<number | null> {
  try {
    const res = await fetch('/populacaoibge.json');
    const municipios = await res.json();
    const nomeNormalizado = normalizeString(nomeMunicipio);
    const municipio = municipios.find((m: any) => normalizeString(m.nome) === nomeNormalizado);
    return municipio ? Number(municipio.populacao) : null;
  } catch {
    return null;
  }
}

const cidades = [
  'Acauã', 'Agricolândia', 'Água Branca', 'Alagoinha do Piauí', 'Alegrete do Piauí', 'Alto Longá',
  'Altos', 'Alvorada do Gurguéia', 'Amarante', 'Angical do Piauí', 'Anísio de Abreu', 'Antônio Almeida',
  'Aroazes', 'Aroeiras do Itaim', 'Arraial', 'Assunção do Piauí', 'Avelino Lopes', 'Baixa Grande do Ribeiro',
  'Barra D\'Alcântara', 'Barras', 'Barreiras do Piauí', 'Barro Duro', 'Batalha', 'Bela Vista do Piauí',
  'Belém do Piauí', 'Beneditinos', 'Bertolínia', 'Betânia do Piauí', 'Boa Hora', 'Bocaina',
  'Bom Jesus', 'Bom Princípio do Piauí', 'Bonfim do Piauí', 'Boqueirão do Piauí', 'Brasileira',
  'Brejo do Piauí', 'Buriti dos Lopes', 'Buriti dos Montes', 'Cabeceiras do Piauí', 'Cajazeiras do Piauí',
  'Cajueiro da Praia', 'Caldeirão Grande do Piauí', 'Campinas do Piauí', 'Campo Alegre do Fidalgo',
  'Campo Grande do Piauí', 'Campo Largo do Piauí', 'Campo Maior', 'Canavieira', 'Canto do Buriti',
  'Capitão de Campos', 'Capitão Gervásio Oliveira', 'Caracol', 'Caraúbas do Piauí', 'Caridade do Piauí',
  'Castelo do Piauí', 'Caxingó', 'Cocal', 'Cocal de Telha', 'Cocal dos Alves', 'Coivaras',
  'Colônia do Gurguéia', 'Colônia do Piauí', 'Conceição do Canindé', 'Coronel José Dias',
  'Corrente', 'Cristalândia do Piauí', 'Cristino Castro', 'Curimatá', 'Currais', 'Curral Novo do Piauí',
  'Curralinhos', 'Demerval Lobão', 'Dirceu Arcoverde', 'Dom Expedito Lopes', 'Dom Inocêncio',
  'Domingos Mourão', 'Elesbão Veloso', 'Eliseu Martins', 'Esperantina', 'Fartura do Piauí',
  'Flores do Piauí', 'Floresta do Piauí', 'Floriano', 'Francinópolis', 'Francisco Ayres', 'Francisco Macedo', 'Francisco Santos',
  'Fronteiras', 'Geminiano', 'Gilbués', 'Guadalupe', 'Guaribas', 'Hugo Napoleão', 'Ilha Grande',
  'Inhuma', 'Ipiranga do Piauí', 'Isaías Coelho', 'Itainópolis', 'Itaueira', 'Jacobina do Piauí',
  'Jaicós', 'Jardim do Mulato', 'Jatobá do Piauí', 'Jerumenha', 'João Costa', 'Joaquim Pires',
  'Joca Marques', 'José de Freitas', 'Juazeiro do Piauí', 'Júlio Borges', 'Jurema', 'Lagoa Alegre',
  'Lagoa de São Francisco', 'Lagoa do Barro do Piauí', 'Lagoa do Piauí', 'Lagoa do Sítio',
  'Lagoinha do Piauí', 'Landri Sales', 'Luís Correia', 'Luzilândia', 'Madeiro', 'Manoel Emídio',
  'Marcolândia', 'Marcos Parente', 'Massapê do Piauí', 'Matias Olímpio', 'Miguel Alves',
  'Miguel Leão', 'Milton Brandão', 'Monsenhor Gil', 'Monsenhor Hipólito', 'Monte Alegre do Piauí',
  'Morro Cabeça no Tempo', 'Morro do Chapéu do Piauí', 'Murici dos Portelas', 'Nazaré do Piauí',
  'Nazária', 'Nossa Senhora de Nazaré', 'Nossa Senhora dos Remédios', 'Nova Santa Rita',
  'Novo Oriente do Piauí', 'Novo Santo Antônio', 'Oeiras', 'Olho D\'Água do Piauí', 'Padre Marcos',
  'Paes Landim', 'Pajeú do Piauí', 'Palmeira do Piauí', 'Palmeirais', 'Paquetá', 'Parnaguá',
  'Parnaíba', 'Passagem Franca do Piauí', 'Patos do Piauí', 'Pau D\'Arco do Piauí', 'Paulistana',
  'Pavussu', 'Pedro II', 'Pedro Laurentino', 'Picos', 'Pimenteiras', 'Pio IX', 'Piracuruca',
  'Piripiri', 'Porto', 'Porto Alegre do Piauí', 'Prata do Piauí', 'Queimada Nova',
  'Redenção do Gurguéia', 'Regeneração', 'Riacho Frio', 'Ribeira do Piauí', 'Ribeiro Gonçalves',
  'Rio Grande do Piauí', 'Santa Cruz do Piauí', 'Santa Cruz dos Milagres', 'Santa Filomena',
  'Santa Luz', 'Santa Rosa do Piauí', 'Santana do Piauí', 'Santo Antônio de Lisboa',
  'Santo Antônio dos Milagres', 'Santo Inácio do Piauí', 'São Braz do Piauí', 'São Félix do Piauí',
  'São Francisco de Assis do Piauí', 'São Francisco do Piauí', 'São Gonçalo do Gurguéia',
  'São Gonçalo do Piauí', 'São João da Canabrava', 'São João da Fronteira', 'São João da Serra',
  'São João da Varjota', 'São João do Arraial', 'São João do Piauí', 'São José do Divino',
  'São José do Peixe', 'São José do Piauí', 'São Julião', 'São Lourenço do Piauí', 'São Luis do Piauí',
  'São Miguel da Baixa Grande', 'São Miguel do Fidalgo', 'São Miguel do Tapuio', 'São Pedro do Piauí',
  'São Raimundo Nonato', 'Sebastião Barros', 'Sebastião Leal', 'Sigefredo Pacheco', 'Simões',
  'Simplício Mendes', 'Socorro do Piauí', 'Sussuapara', 'Tamboril do Piauí', 'Tanque do Piauí',
  'Teresina', 'União', 'Uruçuí', 'Valença do Piauí', 'Várzea Branca', 'Várzea Grande',
  'Vera Mendes', 'Vila Nova do Piauí', 'Wall Ferraz'
].sort();

interface DadosEleitores {
  [key: string]: {
    municipio: string;
    eleitores_2024: number;
  };
}

interface Lideranca {
  lideranca: string;
  liderancaAtual: string;
  cargo2024?: string;
  expectativa2026?: string;
}

export default function EleicoesAnterioresPage() {
  // Desabilitar logs de console para proteção de dados
  disableConsoleLogging();
  
  const router = useRouter();
  const [cidade, setCidade] = useState("");
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dadosLiderancas, setDadosLiderancas] = useState<any[]>([]);
  const [dadosEleitores, setDadosEleitores] = useState<DadosEleitores>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    deputado_estadual: 1,
    deputado_federal: 1,
    prefeito_2024: 1,
    vereador_2024: 1,
    partido_2024: 1,
    liderancas: 1
  });
  const itemsPerPage = 10;
  
  // Estados para o modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLideranca, setSelectedLideranca] = useState<any>(null);

  const [populacaoSUAS, setPopulacaoSUAS] = useState<number | null>(null);
  const [porteSUAS, setPorteSUAS] = useState<string>('-');
  const [valorSUAS, setValorSUAS] = useState<string>('-');
  const [limiteMac, setLimiteMac] = useState<any>(null);
  const [limitePap, setLimitePap] = useState<any>(null);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [partidoSelecionado, setPartidoSelecionado] = useState<string | null>(null);
  const [buscaIniciada, setBuscaIniciada] = useState(false);
  const [emendasSUAS, setEmendasSUAS] = useState<any[]>([]);

  // Função para formatar valor em moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para carregar as emendas SUAS
  const loadEmendasSUAS = async () => {
    try {
      const res = await fetch('/api/emendassuas');
      if (!res.ok) throw new Error('Erro ao carregar emendas SUAS');
      const data = await res.json();
      setEmendasSUAS(data);
    } catch (error) {
      // Erro silencioso - não exibir logs por segurança
    }
  };

  // Função para calcular totais das propostas
  const calcularTotaisPropostas = (tipo: string) => {
    if (!propostas || !Array.isArray(propostas) || !cidade) return { total: 0, valorPagar: 0, saldo: 0 };
    
    const propostasFiltradas = propostas.filter(p => 
      p.municipio.toUpperCase() === cidade.toUpperCase() && 
      p.coTipoProposta && 
      p.coTipoProposta.toUpperCase().includes(tipo)
    );
    
    const total = propostasFiltradas.reduce((acc, curr) => acc + (curr.vlProposta || 0), 0);
    const valorPagar = propostasFiltradas.reduce((acc, curr) => acc + (curr.vlPagar || 0), 0);
    
    if (tipo === 'MAC' && limiteMac) {
      return { total, valorPagar, saldo: limiteMac.valor - total };
    } else if (tipo === 'PAP' && limitePap) {
      return { total, valorPagar, saldo: limitePap.valor - total };
    }
    
    return { total, valorPagar, saldo: 0 };
  };

  // Função para calcular totais das emendas SUAS
  const calcularTotaisSUAS = () => {
    if (!emendasSUAS || !Array.isArray(emendasSUAS) || !cidade) return { totalPropostas: 0, totalPagar: 0 };
    
    const emendasFiltradas = emendasSUAS.filter(e => 
      e.municipio.toUpperCase() === cidade.toUpperCase()
    );
    
    const totalPropostas = emendasFiltradas.reduce((acc, curr) => acc + (curr.valor_proposta || 0), 0);
    const totalPagar = emendasFiltradas.reduce((acc, curr) => acc + (curr.valor_pagar || 0), 0);
    
    return { totalPropostas, totalPagar };
  };

  // Função para buscar dados do Google Sheets
  const buscarDados = async () => {
    if (!cidade) return;
    
    setBuscaIniciada(true);
    setLoading(true);
    setError(null);
    setDados([]);

    try {
      // Buscar dados da planilha
      const resEleicoes = await fetch(`/api/resultado-eleicoes?cidade=${encodeURIComponent(cidade)}`);
      const jsonEleicoes = await resEleicoes.json();
      if (resEleicoes.ok) {
        setDados(jsonEleicoes.resultados);
      } else {
        throw new Error(jsonEleicoes.error || "Erro ao buscar dados da planilha.");
      }

      // Buscar dados de lideranças
      const resLiderancas = await fetch('/api/liderancas-votacao');
      const jsonLiderancas = await resLiderancas.json();
      if (resLiderancas.ok) {
        setDadosLiderancas(jsonLiderancas.data);
      }

      // Buscar dados de eleitores
      const resEleitores = await fetch(`/api/eleitores-municipio?municipio=${encodeURIComponent(cidade)}`);
      const jsonEleitores = await resEleitores.json();
      if (resEleitores.ok && jsonEleitores.municipio) {
        setDadosEleitores(prev => ({
          ...prev,
          [normalizeString(jsonEleitores.municipio.municipio)]: jsonEleitores.municipio
        }));
      }

      // Buscar população e calcular limites
      const populacao = await fetchPopulacaoMunicipio(cidade);
      const mac = getLimiteMacByMunicipio(cidade);
      const pap = getLimitePapByMunicipio(cidade);
      
      setLimiteMac(mac);
      setLimitePap(pap);

      if (populacao) {
        const suas = classificaPorteESUAS(populacao);
        setPopulacaoSUAS(populacao);
        setPorteSUAS(suas.porte);
        setValorSUAS(suas.valor);
      }

      // Buscar propostas
      const resPropostas = await fetch(`/api/consultar-tetos?municipio=${encodeURIComponent(cidade)}`);
      if (!resPropostas.ok) throw new Error('Erro ao buscar propostas');
      const responsePropostas = await resPropostas.json();
      // A API agora retorna um objeto com propostas e municípios
      let dataPropostas = responsePropostas.propostas || responsePropostas;
      // Garantir que dataPropostas é um array antes de filtrar
      if (Array.isArray(dataPropostas)) {
        dataPropostas = dataPropostas.filter((p: any) => p.dsTipoRecurso !== 'PROGRAMA');
      } else {
        dataPropostas = [];
      }
      setPropostas(dataPropostas);

      // Carregar emendas SUAS
      await loadEmendasSUAS();

    } catch (err: any) {
      setError(err.message || "Erro ao buscar dados.");
      // Erro silencioso - não exibir logs por segurança
    } finally {
      setLoading(false);
    }
  };

  // Fechar modal com tecla ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };

    if (modalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll do body quando modal estiver aberto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen]);

  // Função para paginar os dados
  const paginateData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  // Função para renderizar os botões de paginação
  const PaginationButtons = ({ totalItems, currentPage, tipo }: { totalItems: number, currentPage: number, tipo: string }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center gap-2 mt-2">
        <button
          onClick={() => setCurrentPage(prev => ({ ...prev, [tipo]: Math.max(1, currentPage - 1) }))}
          disabled={currentPage === 1}
          className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-xs py-1">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => ({ ...prev, [tipo]: Math.min(totalPages, currentPage + 1) }))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    );
  };

  // Função para abrir o modal com dados da liderança
  const handleExpectativaClick = (lideranca: any) => {
    // Buscar todas as lideranças do mesmo município
    const liderancasMunicipio = Array.isArray(dadosLiderancas) ? dadosLiderancas.filter(item => 
      normalizeString(item.municipio) === normalizeString(lideranca.municipio)
    ) : [];
    setSelectedLideranca({ ...lideranca, todasLiderancas: liderancasMunicipio });
    setModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedLideranca(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Eleições Anteriores</span>
            <span className="text-xs text-gray-500 font-light">Análise de resultados eleitorais e projeções por município</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={cidade}
              onChange={e => setCidade(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1"
            >
              <option value="">Selecione município...</option>
              {cidades.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={buscarDados}
              disabled={loading || !cidade}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-blue-50 text-blue-700 cursor-pointer border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Buscar
            </button>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="p-0 w-full flex-1">
        <div className="px-4 py-8">

        {buscaIniciada && loading && (
          <div className="flex items-center justify-center mt-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Carregando dados...</p>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-red-500">{error}</p>}

        {buscaIniciada && cidade && !loading && !error && dados.length === 0 && (
          <p className="mt-4">Nenhum resultado encontrado para "{cidade}".</p>
        )}



        {cidade && !loading && dados.length > 0 && (
          <>
            <div className="w-full px-1 mb-6">
              <div className="bg-white rounded shadow p-1">
                <h2 className="text-sm font-semibold mb-2 text-center">Lideranças e Projeção de Votos</h2>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="py-0.5 px-2 text-left font-medium bg-gray-50">Município</th>
                        <th className="py-0.5 px-2 text-left font-medium bg-gray-50">Lideranças Atuais</th>
                        <th className="py-0.5 px-2 text-right font-medium bg-gray-50">Votação 2022</th>
                        <th className="py-0.5 px-2 text-right font-medium bg-gray-50">Expectativa 2026</th>
                        <th className="py-0.5 px-2 text-right font-medium bg-gray-50">Crescimento</th>
                        <th className="py-0.5 px-2 text-right font-medium bg-gray-50">Eleitores</th>
                        <th className="py-0.5 px-2 text-right font-medium bg-gray-50">% Alcance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Agrupar dados por município
                        const dadosAgrupados = dadosLiderancas
                          .filter(item => 
                            !cidade || normalizeString(item.municipio) === normalizeString(cidade)
                          )
                          .reduce((acc: any, item) => {
                            const municipio = item.municipio;
                            if (!acc[municipio]) {
                              acc[municipio] = {
                                municipio,
                                liderancasAtuais: 0,
                                votacao2022: 0,
                                expectativa2026: 0
                              };
                            }
                            
                            // Contar lideranças atuais
                            if (item.liderancaAtual === 'SIM') {
                              acc[municipio].liderancasAtuais++;
                            }
                            
                            // Somar votação 2022
                            const votacao2022 = parseInt(item.votacao2022 || '0');
                            acc[municipio].votacao2022 += votacao2022;
                            
                            // Somar expectativa 2026
                            const expectativa2026 = parseInt(item.expectativa2026 || '0');
                            acc[municipio].expectativa2026 += expectativa2026;
                            
                            return acc;
                          }, {});
                        
                        // Converter para array e ordenar por município
                        const dadosConsolidados = Object.values(dadosAgrupados)
                          .sort((a: any, b: any) => a.municipio.localeCompare(b.municipio));
                        
                        const rows = paginateData(dadosConsolidados, currentPage.liderancas).map((item: any, idx: number): JSX.Element => {
                          // Calcular percentual de crescimento
                          const crescimento = item.votacao2022 > 0 
                            ? ((item.expectativa2026 - item.votacao2022) / item.votacao2022) * 100
                            : 0;

                          // Buscar dados de eleitores do município
                          const dadosMunicipio = dadosEleitores[normalizeString(item.municipio)];
                          const totalEleitores = dadosMunicipio?.eleitores_2024 || 0;
                          const percentualAlcance = totalEleitores > 0 
                            ? (item.expectativa2026 / totalEleitores) * 100 
                            : 0;
                          
                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="py-0.5 px-2">{item.municipio}</td>
                              <td className="py-0.5 px-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.liderancasAtuais > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                onClick={() => handleExpectativaClick({ municipio: item.municipio })}
                                title="Clique para ver detalhes"
                                style={{ cursor: 'pointer' }}
                                >
                                  {item.liderancasAtuais}
                                </span>
                              </td>
                              <td className="py-0.5 px-2 text-right">
                                {item.votacao2022.toLocaleString()}
                              </td>
                              <td className="py-0.5 px-2 text-right">
                                {item.expectativa2026.toLocaleString()}
                              </td>
                              <td className="py-0.5 px-2 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  crescimento > 0 
                                    ? 'bg-green-100 text-green-800'
                                    : crescimento < 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {crescimento > 0 ? '+' : ''}{crescimento.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-0.5 px-2 text-right">
                                {totalEleitores.toLocaleString()}
                              </td>
                              <td className="py-0.5 px-2 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  percentualAlcance >= 50
                                    ? 'bg-green-100 text-green-800'
                                    : percentualAlcance >= 30
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {percentualAlcance.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        });
                        
                        return rows;
                      })()}
                    </tbody>
                  </table>
                  <PaginationButtons 
                    totalItems={(() => {
                      const dadosAgrupados = dadosLiderancas
                        .filter(item => 
                          !cidade || normalizeString(item.municipio) === normalizeString(cidade)
                        )
                        .reduce((acc: any, item) => {
                          const municipio = item.municipio;
                          if (!acc[municipio]) {
                            acc[municipio] = true;
                          }
                          return acc;
                        }, {});
                      return Object.keys(dadosAgrupados).length;
                    })()} 
                    currentPage={currentPage.liderancas} 
                    tipo="liderancas"
                  />
                </div>
              </div>
            </div>

            <div className="w-full px-1">
              <div className="flex flex-nowrap gap-1 overflow-x-auto min-w-0 pb-2">
                {[
                  { grupo: 'Deputado Estadual 2022', tipo: 'deputado_estadual', containerClass: 'flex-1 min-w-[220px] max-w-[280px]' },
                  { grupo: 'Deputado Federal 2022', tipo: 'deputado_federal', containerClass: 'flex-1 min-w-[220px] max-w-[280px]' },
                  { grupo: 'Prefeito 2024', tipo: 'prefeito_2024', containerClass: 'flex-1 min-w-[220px] max-w-[280px]' },
                  { grupo: 'Vereador 2024', tipo: 'vereador_2024', containerClass: 'flex-1 min-w-[250px] max-w-[350px]' },
                  { grupo: 'Votação por Partido 2024', tipo: 'partido_2024', containerClass: 'flex-1 min-w-[250px] max-w-[350px]' },
                ].map(({ grupo, tipo, containerClass }) => {
                  // Filtrar os dados conforme o grupo
                  let lista: any[] = [];
                  if (tipo === 'deputado_estadual') {
                    lista = dados
                      .filter(item => 
                        item.cargo?.toLowerCase().includes('estadual') && 
                        item.anoEleicao === '2022'
                      )
                      .sort((a, b) => (b.quantidadeVotosNominais || 0) - (a.quantidadeVotosNominais || 0));
                  } else if (tipo === 'deputado_federal') {
                    lista = dados
                      .filter(item => 
                        item.cargo?.toLowerCase().includes('federal') && 
                        item.anoEleicao === '2022'
                      )
                      .sort((a, b) => (b.quantidadeVotosNominais || 0) - (a.quantidadeVotosNominais || 0));
                  } else if (tipo === 'prefeito_2024') {
                    lista = dados
                      .filter(item => 
                        item.cargo?.toLowerCase().includes('prefeito') && 
                        item.anoEleicao === '2024' &&
                        (!partidoSelecionado || item.partido === partidoSelecionado)
                      )
                      .sort((a, b) => (b.quantidadeVotosNominais || 0) - (a.quantidadeVotosNominais || 0));
                  } else if (tipo === 'vereador_2024') {
                    lista = dados
                      .filter(item => 
                        item.cargo?.toLowerCase().includes('vereador') && 
                        item.anoEleicao === '2024' &&
                        (!partidoSelecionado || item.partido === partidoSelecionado)
                      )
                      .sort((a, b) => (b.quantidadeVotosNominais || 0) - (a.quantidadeVotosNominais || 0));
                  } else if (tipo === 'partido_2024') {
                    // Agrupar por partido e somar votos
                    const partidos: Record<string, { partido: string, votos: number, eleitos: number }> = {};
                    dados
                      .filter(item => item.anoEleicao === '2024')
                      .forEach(item => {
                        const partido = item.partido || '-';
                        if (!partidos[partido]) {
                          partidos[partido] = { partido, votos: 0, eleitos: 0 };
                        }
                        partidos[partido].votos += parseInt(item.quantidadeVotosNominais) || 0;
                        if (item.situacao?.toLowerCase().includes('eleito')) {
                          partidos[partido].eleitos++;
                        }
                      });
                    lista = Object.values(partidos).sort((a, b) => b.votos - a.votos);
                  }

                  return (
                    <div key={tipo} className={`bg-white rounded shadow p-1 ${containerClass}`}>
                      <h2 className="text-xs font-semibold mb-1 text-center truncate px-2">{grupo}</h2>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className={`py-0.5 px-1 text-left font-medium bg-gray-50 ${
                                ['deputado_estadual', 'deputado_federal', 'prefeito_2024'].includes(tipo) 
                                ? 'max-w-[120px] truncate' 
                                : ''
                              }`}>
                                {tipo === 'partido_2024' ? 'Partido' : 'Candidato'}
                              </th>
                              <th className="py-0.5 px-1 text-right font-medium bg-gray-50">Votos</th>
                              {tipo === 'partido_2024' && (
                                <th className="py-0.5 px-1 text-right font-medium bg-gray-50">Eleitos</th>
                              )}
                              {tipo === 'vereador_2024' && (
                                <th className="py-0.5 px-1 text-center font-medium bg-gray-50">Situação</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {paginateData(lista, currentPage[tipo]).map((item, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className={`py-0.5 px-1 ${
                                  ['deputado_estadual', 'deputado_federal', 'prefeito_2024'].includes(tipo) 
                                  ? 'max-w-[120px] truncate' 
                                  : ''
                                }`}>
                                  {tipo === 'partido_2024' ? (
                                    <button
                                      onClick={() => setPartidoSelecionado(partidoSelecionado === item.partido ? null : item.partido)}
                                      className={`text-left w-full hover:text-blue-600 ${partidoSelecionado === item.partido ? 'text-blue-600 font-medium' : ''}`}
                                    >
                                      {item.partido}
                                    </button>
                                  ) : (
                                    tipo === 'deputado_federal' && 
                                    item.nomeUrnaCandidato?.toUpperCase() === 'JADYEL DA JUPI' ? (
                                      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {item.nomeUrnaCandidato}
                                      </span>
                                    ) : (
                                      <span title={item.nomeUrnaCandidato}>{item.nomeUrnaCandidato}</span>
                                    )
                                  )}
                                </td>
                                <td className="py-0.5 px-1 text-right">
                                  {tipo === 'partido_2024' 
                                    ? item.votos.toLocaleString()
                                    : parseInt(item.quantidadeVotosNominais || '0').toLocaleString()
                                  }
                                </td>
                                {tipo === 'partido_2024' && (
                                  <td className="py-0.5 px-1 text-right">
                                    {item.eleitos}
                                  </td>
                                )}
                                {tipo === 'vereador_2024' && (
                                  <td className="py-0.5 px-1 text-center">
                                    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                                      item.situacao?.toLowerCase().includes('eleito') 
                                        ? 'bg-green-100 text-green-800'
                                        : item.situacao?.toLowerCase().includes('suplente')
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {item.situacao}
                                    </span>
                                  </td>
                                )}
                              </tr>
                            ))}
                            {/* Linha de Total */}
                            {(() => {
                              if (tipo === 'partido_2024') {
                                const totalVotos = lista.reduce((acc, item) => acc + item.votos, 0);
                                const totalEleitos = lista.reduce((acc, item) => acc + item.eleitos, 0);
                                return (
                                  <tr className="border-t border-gray-400 bg-gray-100 font-semibold">
                                    <td className="py-1 px-1">TOTAL</td>
                                    <td className="py-1 px-1 text-right">{totalVotos.toLocaleString()}</td>
                                    <td className="py-1 px-1 text-right">{totalEleitos}</td>
                                  </tr>
                                );
                              } else if (tipo === 'vereador_2024') {
                                const totalVotos = lista.reduce((acc, item) => acc + parseInt(item.quantidadeVotosNominais || '0'), 0);
                                const totalEleitos = lista.filter(item => item.situacao?.toLowerCase().includes('eleito')).length;
                                return (
                                  <tr className="border-t border-gray-400 bg-gray-100 font-semibold">
                                    <td className="py-1 px-1">TOTAL</td>
                                    <td className="py-1 px-1 text-right">{totalVotos.toLocaleString()}</td>
                                    <td className="py-1 px-1 text-center">{totalEleitos} eleitos</td>
                                  </tr>
                                );
                              } else {
                                const totalVotos = lista.reduce((acc, item) => acc + parseInt(item.quantidadeVotosNominais || '0'), 0);
                                return (
                                  <tr className="border-t border-gray-400 bg-gray-100 font-semibold">
                                    <td className="py-1 px-1">TOTAL</td>
                                    <td className="py-1 px-1 text-right">{totalVotos.toLocaleString()}</td>
                                  </tr>
                                );
                              }
                            })() as React.JSX.Element}
                          </tbody>
                        </table>
                        <PaginationButtons 
                          totalItems={lista.length} 
                          currentPage={currentPage[tipo]} 
                          tipo={tipo}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Cards de Limite MAC, PAP e SUAS - aparece sempre que uma cidade for selecionada */}
        {cidade && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Card Limite MAC */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Limite MAC - {cidade}</h3>
              {limiteMac ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700">Limite MAC:</span>
                    <span className="text-sm font-bold text-blue-900">{formatCurrency(limiteMac.valor)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700">Propostas MAC:</span>
                    <span className="text-sm font-bold text-blue-900">{formatCurrency(calcularTotaisPropostas('MAC').total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700">Valor a Pagar MAC:</span>
                    <span className="text-sm font-bold text-blue-900">{formatCurrency(calcularTotaisPropostas('MAC').valorPagar)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700">Saldo MAC:</span>
                    <span className="text-sm font-bold text-blue-900">{formatCurrency(calcularTotaisPropostas('MAC').saldo)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-blue-700">Nenhum limite MAC encontrado para este município.</div>
              )}
            </div>
            
            {/* Card Limite PAP */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">Limite PAP - {cidade}</h3>
              {limitePap ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700">Limite PAP:</span>
                    <span className="text-sm font-bold text-green-900">{formatCurrency(limitePap.valor)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700">Propostas PAP:</span>
                    <span className="text-sm font-bold text-green-900">{formatCurrency(calcularTotaisPropostas('PAP').total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700">Valor a Pagar PAP:</span>
                    <span className="text-sm font-bold text-green-900">{formatCurrency(calcularTotaisPropostas('PAP').valorPagar)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700">Saldo PAP:</span>
                    <span className="text-sm font-bold text-green-900">{formatCurrency(calcularTotaisPropostas('PAP').saldo)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-green-700">Nenhum limite PAP encontrado para este município.</div>
              )}
            </div>

            {/* Card Limite SUAS */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">Limite SUAS - {cidade}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-700">População Estimada:</span>
                  <span className="text-sm font-bold text-orange-900">
                    {populacaoSUAS !== null ? populacaoSUAS.toLocaleString('pt-BR') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-700">Porte:</span>
                  <span className="text-sm font-bold text-orange-900">{porteSUAS}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-700">Valor Máximo SUAS (MDS):</span>
                  <span className="text-sm font-bold text-orange-900">{valorSUAS}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-700">Propostas SUAS:</span>
                  <span className="text-sm font-bold text-orange-900">{formatCurrency(calcularTotaisSUAS().totalPropostas)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-700">Valor a Pagar SUAS:</span>
                  <span className="text-sm font-bold text-orange-900">{formatCurrency(calcularTotaisSUAS().totalPagar)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Lideranças */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Lideranças de {selectedLideranca?.municipio}</DialogTitle>
            </DialogHeader>
            
            {selectedLideranca && (
              <div className="mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Liderança</TableHead>
                      <TableHead className="py-2">Status</TableHead>
                      <TableHead className="py-2">Cargo 2024</TableHead>
                      <TableHead className="py-2 text-right">Expectativa 2026</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...selectedLideranca.todasLiderancas]
                      .sort((a: Lideranca, b: Lideranca) => {
                        const expA = parseInt(a.expectativa2026 || '0');
                        const expB = parseInt(b.expectativa2026 || '0');
                        return expB - expA;
                      })
                      .map((lideranca: Lideranca, idx: number) => {
                        const expectativa2026 = parseInt(lideranca.expectativa2026 || '0');
                        return (
                          <TableRow key={idx}>
                            <TableCell className="py-1.5">{lideranca.lideranca}</TableCell>
                            <TableCell className="py-1.5">
                              <Badge variant={lideranca.liderancaAtual === 'SIM' ? 'default' : 'secondary'}>
                                {lideranca.liderancaAtual === 'SIM' ? 'Atual' : 'Anterior'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-1.5">{lideranca.cargo2024 || 'Não definido'}</TableCell>
                            <TableCell className="py-1.5 text-right">{expectativa2026.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © 2025 86 Dynamics - Todos os direitos reservados
        </div>
        </div>
      </main>
    </div>
  );
} 