"use client";

import React, { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { X, RefreshCw, Building, ArrowUpDown, CheckCircle2, Clock, AlertCircle, XCircle, HelpCircle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

// Interface para os dados de obras e demandas
interface ObraDemanda {
  [key: string]: string;
  'Coluna 1': string;
  'ID': string;
  'DATA DEMANDA': string;
  'STATUS': string;
  'SOLICITAÇÃO': string;
  'OBS STATUS': string;
  'MUNICIPIO': string;
  'LIDERANÇA': string;
  'LIDERANÇA URNA': string;
  'PAUTA': string;
  'AÇÃO/OBJETO': string;
  'NÍVEL ESPAÇO': string;
  'ESFERA': string;
  'VALOR ': string;
  'ÓRGAO ': string;
  'PREVISÃO': string;
}

// Função para obter configuração de status
const getStatusConfig = (status: string) => {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('finalizada') || statusLower.includes('concluída')) {
    return {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
    };
  }
  
  if (statusLower.includes('andamento') || statusLower.includes('análise')) {
    return {
      color: 'bg-blue-100 text-blue-800',
      icon: <Clock className="h-4 w-4 text-blue-600" />
    };
  }
  
  if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
    return {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <AlertCircle className="h-4 w-4 text-yellow-600" />
    };
  }
  
  if (statusLower.includes('cancelada') || statusLower.includes('negada')) {
    return {
      color: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-4 w-4 text-red-600" />
    };
  }
  
  return {
    color: 'bg-gray-100 text-gray-800',
    icon: <HelpCircle className="h-4 w-4 text-gray-600" />
  };
};

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
  urlImagem?: string;
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
  const [imagemExpandidaUrl, setImagemExpandidaUrl] = useState<string | null>(null);
  const [imagemExpandidaNome, setImagemExpandidaNome] = useState<string>('');

  const [populacaoSUAS, setPopulacaoSUAS] = useState<number | null>(null);
  const [porteSUAS, setPorteSUAS] = useState<string>('-');
  const [valorSUAS, setValorSUAS] = useState<string>('-');
  const [limiteMac, setLimiteMac] = useState<any>(null);
  const [limitePap, setLimitePap] = useState<any>(null);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [partidoSelecionado, setPartidoSelecionado] = useState<string | null>(null);
  const [buscaIniciada, setBuscaIniciada] = useState(false);
  const [emendasSUAS, setEmendasSUAS] = useState<any[]>([]);
  
  // Estados para lideranças e demandas
  const [liderancasSelecionadas, setLiderancasSelecionadas] = useState<any[]>([]);
  const [liderancaSelecionada, setLiderancaSelecionada] = useState<string>('');
  const [modalDemandasOpen, setModalDemandasOpen] = useState(false);
  const [demandas, setDemandas] = useState<ObraDemanda[]>([]);
  const [loadingDemandas, setLoadingDemandas] = useState(false);

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

  // Função para calcular totais das emendas SUAS
  const calcularTotaisSUAS = () => {
    if (!emendasSUAS || !Array.isArray(emendasSUAS) || !cidade) return { totalPropostas: 0, totalPagar: 0 };
    
    const emendasFiltradas = emendasSUAS.filter(e => 
      normalizeString(e.municipio) === normalizeString(cidade)
    );
    
    const totalPropostas = emendasFiltradas.reduce((acc, curr) => acc + (curr.valor_proposta || 0), 0);
    const totalPagar = emendasFiltradas.reduce((acc, curr) => acc + (curr.valor_pagar || 0), 0);
    
    return { totalPropostas, totalPagar };
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

  // Função para formatar valor em moeda brasileira
  const formatarValor = (valor: string | number | undefined | null) => {
    if (!valor || valor === '0' || valor === 0) return 'R$ 0,00';
    
    let numeroLimpo: number;
    
    if (typeof valor === 'string') {
      // Remove R$, espaços e outros caracteres, mantém apenas números, pontos e vírgulas
      let valorLimpo = valor.replace(/[^\d,.-]/g, '');
      
      // Se tem vírgula e ponto, assume que ponto é separador de milhares e vírgula é decimal
      if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
        // Ex: 1.000,50 -> 1000.50
        valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
      } else if (valorLimpo.includes(',')) {
        // Se só tem vírgula, pode ser decimal (100,50) ou milhares (1,000)
        const partes = valorLimpo.split(',');
        if (partes.length === 2 && partes[1].length <= 2) {
          // Provavelmente decimal: 100,50
          valorLimpo = valorLimpo.replace(',', '.');
      } else {
          // Provavelmente separador de milhares: 1,000
          valorLimpo = valorLimpo.replace(/,/g, '');
      }
      }
      
      numeroLimpo = parseFloat(valorLimpo);
    } else {
      numeroLimpo = valor;
    }
    
    if (isNaN(numeroLimpo)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numeroLimpo);
  };

  // Função para converter valor string para número
  const converterValorParaNumero = (valor: string | number | undefined | null): number => {
    if (!valor || valor === '0' || valor === 0) return 0;
    
    if (typeof valor === 'number') return valor;
    
    // Remove R$, espaços e outros caracteres, mantém apenas números, pontos e vírgulas
    let valorLimpo = valor.replace(/[^\d,.-]/g, '');
    
    // Se tem vírgula e ponto, assume que ponto é separador de milhares e vírgula é decimal
    if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
      // Ex: 1.000,50 -> 1000.50
      valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
    } else if (valorLimpo.includes(',')) {
      // Se só tem vírgula, pode ser decimal (100,50) ou milhares (1,000)
      const partes = valorLimpo.split(',');
      if (partes.length === 2 && partes[1].length <= 2) {
        // Provavelmente decimal: 100,50
        valorLimpo = valorLimpo.replace(',', '.');
      } else {
        // Provavelmente separador de milhares: 1,000
        valorLimpo = valorLimpo.replace(/,/g, '');
    }
    }
    
    const numero = parseFloat(valorLimpo);
    return isNaN(numero) ? 0 : numero;
  };

  // Função para buscar demandas das lideranças
  const buscarDemandasLideranca = async () => {
    if (!liderancaSelecionada || !cidade) return;
    
    setLoadingDemandas(true);
    try {
      const response = await fetch('/api/obras_demandas');
      const data = await response.json();
      
      if (data.success && data.data) {
        let demandasFiltradas;
        
        if (liderancaSelecionada === 'TODAS') {
          // Filtrar apenas pelo município - todas as lideranças
          demandasFiltradas = data.data.filter((demanda: ObraDemanda) => 
            normalizeString(demanda.MUNICIPIO) === normalizeString(cidade)
          );
        } else {
          // Filtrar demandas pelo município e liderança selecionada
          demandasFiltradas = data.data.filter((demanda: ObraDemanda) => 
            normalizeString(demanda.MUNICIPIO) === normalizeString(cidade) &&
            normalizeString(demanda['LIDERANÇA']) === normalizeString(liderancaSelecionada)
          );
        }
        
        setDemandas(demandasFiltradas);
        setModalDemandasOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar demandas:', error);
      // Silencioso por segurança
    } finally {
      setLoadingDemandas(false);
    }
  };

  // Função para buscar dados do Google Sheets
  const buscarDados = async () => {
      if (!cidade) return;
      
    setBuscaIniciada(true);
    setLoading(true);
    setError(null);
    setDados([]);
    
    // Limpar estados das lideranças e demandas
    setLiderancasSelecionadas([]);
    setLiderancaSelecionada('');
    setDemandas([]);
    setModalDemandasOpen(false);
      
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
        
        // Filtrar lideranças do município selecionado
        const liderancasMunicipio = jsonLiderancas.data.filter((lideranca: any) => 
          normalizeString(lideranca.municipio) === normalizeString(cidade)
        );
        setLiderancasSelecionadas(liderancasMunicipio);
        
        // Limpar seleção anterior
        setLiderancaSelecionada('');
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

  // Carregar emendas SUAS quando a página carregar
  useEffect(() => {
    loadEmendasSUAS();
  }, []);

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
      <div className="flex justify-center items-center gap-1 md:gap-2 mt-2">
        <button
          onClick={() => setCurrentPage(prev => ({ ...prev, [tipo]: Math.max(1, currentPage - 1) }))}
          disabled={currentPage === 1}
          className="px-1.5 md:px-2 py-1 text-[10px] md:text-xs bg-gray-100 rounded disabled:opacity-50 whitespace-nowrap"
        >
          Anterior
        </button>
        <span className="text-[10px] md:text-xs py-1 whitespace-nowrap">
          Pág {currentPage}/{totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => ({ ...prev, [tipo]: Math.min(totalPages, currentPage + 1) }))}
          disabled={currentPage === totalPages}
          className="px-1.5 md:px-2 py-1 text-[10px] md:text-xs bg-gray-100 rounded disabled:opacity-50 whitespace-nowrap"
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

  // Função para extrair o valor numérico do formato "R$ X.XXX.XXX,XX"
  const extrairValorNumerico = (valorFormatado: string): number => {
    if (valorFormatado === '-') return 0;
    // Remove "R$ " e converte para número
    const valor = valorFormatado
      .replace('R$ ', '')
      .replace(/\./g, '')
      .replace(',', '.');
    return parseFloat(valor);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 space-y-3 md:space-y-0">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Eleições Anteriores</span>
            <span className="text-xs text-gray-500 font-light">Análise de resultados eleitorais e projeções por município</span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm font-medium whitespace-nowrap">Cidade:</span>
              <select
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                className="text-sm border border-gray-200 rounded px-2 py-1 flex-1 md:flex-none min-w-[200px]"
              >
                <option value="">Selecione município...</option>
                {cidades.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={buscarDados}
                disabled={loading || !cidade}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-blue-50 text-blue-700 cursor-pointer border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Buscar
              </button>
            </div>

            {/* Dropdown de lideranças e botão de demandas */}
            {buscaIniciada && !loading && liderancasSelecionadas.length > 0 && (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto md:ml-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-sm font-medium whitespace-nowrap">Liderança:</span>
                  <Select value={liderancaSelecionada} onValueChange={setLiderancaSelecionada}>
                    <SelectTrigger className="w-full md:w-64 text-sm">
                      <SelectValue placeholder="Selecione uma liderança..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">
                        <strong>📋 Todas as lideranças</strong>
                      </SelectItem>
                      {liderancasSelecionadas.map((lideranca, index) => (
                        <SelectItem key={index} value={lideranca.lideranca}>
                          {lideranca.lideranca}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <button
                  onClick={buscarDemandasLideranca}
                  disabled={!liderancaSelecionada || loadingDemandas}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                >
                  {loadingDemandas ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building className="h-4 w-4" />
                  )}
                  Ver demandas lideranças
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="p-0 w-full flex-1">
        <div className="px-2 md:px-4 py-4 md:py-8">

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
              <div className="w-full mb-6 overflow-x-auto">
                <div className="bg-white rounded shadow p-1 min-w-[800px]">
                  
                    <div className="w-full">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="py-0.5 px-2 text-left font-medium bg-gray-50 whitespace-nowrap">Município</th>
                            <th className="py-0.5 px-2 text-left font-medium bg-gray-50 whitespace-nowrap">Lideranças Atuais</th>
                            <th className="py-0.5 px-2 text-right font-medium bg-gray-50 whitespace-nowrap">Votação 2022</th>
                            <th className="py-0.5 px-2 text-right font-medium bg-gray-50 whitespace-nowrap">Expectativa 2026</th>
                            <th className="py-0.5 px-2 text-right font-medium bg-gray-50 whitespace-nowrap">Crescimento</th>
                            <th className="py-0.5 px-2 text-right font-medium bg-gray-50 whitespace-nowrap">Eleitores</th>
                            <th className="py-0.5 px-2 text-right font-medium bg-gray-50 whitespace-nowrap">% Alcance</th>
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
              <div className="grid grid-cols-1 md:flex md:flex-nowrap gap-4 md:gap-1 overflow-x-auto min-w-0 pb-2">
                  {[
                  { grupo: 'Deputado Estadual 2022', tipo: 'deputado_estadual', containerClass: 'md:flex-1 min-w-[220px] max-w-full md:max-w-[280px]' },
                  { grupo: 'Deputado Federal 2022', tipo: 'deputado_federal', containerClass: 'md:flex-1 min-w-[220px] max-w-full md:max-w-[280px]' },
                  { grupo: 'Prefeito 2024', tipo: 'prefeito_2024', containerClass: 'md:flex-1 min-w-[220px] max-w-full md:max-w-[280px]' },
                  { grupo: 'Vereador 2024', tipo: 'vereador_2024', containerClass: 'md:flex-1 min-w-[250px] max-w-full md:max-w-[350px]' },
                  { grupo: 'Votação por Partido 2024', tipo: 'partido_2024', containerClass: 'md:flex-1 min-w-[250px] max-w-full md:max-w-[350px]' },
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
                  <span className="text-xs text-orange-700">Limite SUAS:</span>
                  <span className="text-sm font-bold text-orange-900">{valorSUAS}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-700">Total Propostas:</span>
                  <span className="text-sm font-bold text-orange-900">{formatCurrency(calcularTotaisSUAS().totalPropostas)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-700">Saldo SUAS:</span>
                  <span className="text-sm font-bold text-orange-900">
                    {valorSUAS === '-' ? '-' : formatCurrency(extrairValorNumerico(valorSUAS) - calcularTotaisSUAS().totalPropostas)}
                  </span>
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
                      .filter((lideranca: Lideranca) => lideranca.liderancaAtual === 'SIM')
                      .sort((a: Lideranca, b: Lideranca) => {
                        const expA = parseInt(a.expectativa2026 || '0');
                        const expB = parseInt(b.expectativa2026 || '0');
                        return expB - expA;
                      })
                      .map((lideranca: Lideranca, idx: number) => {
                        const expectativa2026 = parseInt(lideranca.expectativa2026 || '0');
                        return (
                          <TableRow key={idx}>
                            <TableCell className="py-1.5">
                              <div className="flex items-center gap-2">
                                {lideranca.urlImagem ? (
                                  <img 
                                    src={lideranca.urlImagem} 
                                    alt={`Foto de ${lideranca.lideranca}`}
                                    className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setImagemExpandidaUrl(lideranca.urlImagem || null);
                                      setImagemExpandidaNome(lideranca.lideranca);
                                    }}
                                    onError={(e) => {
                                      // Se a imagem falhar, remove o src para não mostrar o ícone de erro
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : null}
                                <span>{lideranca.lideranca}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5">
                              <Badge variant="default">
                                Atual
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

        {/* Modal de Demandas das Lideranças */}
        <Dialog open={modalDemandasOpen} onOpenChange={setModalDemandasOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {liderancaSelecionada === 'TODAS' 
                  ? `Todas as Demandas do Município` 
                  : `Demandas da Liderança: ${liderancaSelecionada}`
                }
                <Badge variant="outline" className="ml-2">
                  {cidade}
                </Badge>
                <button
                  onClick={buscarDemandasLideranca}
                  disabled={loadingDemandas}
                  className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingDemandas ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Atualizar
                </button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {demandas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma demanda encontrada para esta liderança.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Total de {demandas.length} demanda(s) encontrada(s)
                    </p>
                    <div className="text-sm text-gray-600">
                      Valor total: {formatarValor(demandas.reduce((acc, curr) => acc + converterValorParaNumero(curr['VALOR ']), 0))}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left border-b border-gray-200">Data</th>
                          <th className="px-4 py-3 text-left border-b border-gray-200">Status</th>
                          {liderancaSelecionada === 'TODAS' && (
                            <th className="px-4 py-3 text-left border-b border-gray-200">Liderança</th>
                          )}
                          <th className="px-4 py-3 text-left border-b border-gray-200">Solicitação</th>
                          <th className="px-4 py-3 text-left border-b border-gray-200">Ação/Objeto</th>
                          <th className="px-4 py-3 text-left border-b border-gray-200">Órgão</th>
                          <th className="px-4 py-3 text-right border-b border-gray-200">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demandas.map((demanda, index) => (
                          <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                            <td className="px-4 py-3 border-r border-gray-100">
                              {demanda['DATA DEMANDA']}
                            </td>
                            <td className="px-4 py-3 border-r border-gray-100">
                              <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs ${getStatusConfig(demanda.STATUS).color}`}>
                                {getStatusConfig(demanda.STATUS).icon}
                                {demanda.STATUS}
                              </div>
                            </td>
                            {liderancaSelecionada === 'TODAS' && (
                              <td className="px-4 py-3 border-r border-gray-100">
                                <span className="text-sm font-medium text-gray-900">
                                  {demanda['LIDERANÇA']}
                                </span>
                              </td>
                            )}
                            <td className="px-4 py-3 border-r border-gray-100 max-w-xs">
                              <div className="truncate" title={demanda['SOLICITAÇÃO']}>
                                {demanda['SOLICITAÇÃO']}
                              </div>
                            </td>
                            <td className="px-4 py-3 border-r border-gray-100">
                              {demanda['AÇÃO/OBJETO']}
                            </td>
                            <td className="px-4 py-3 border-r border-gray-100">
                              {demanda['ÓRGAO ']}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600 font-medium">
                              {formatarValor(demanda['VALOR '])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {demandas.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Resumo</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total de demandas:</span>
                          <span className="ml-2 font-medium">{demandas.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Valor total:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {formatarValor(demandas.reduce((acc, curr) => acc + converterValorParaNumero(curr['VALOR ']), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Imagem Expandida */}
        <Dialog open={!!imagemExpandidaUrl} onOpenChange={() => setImagemExpandidaUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => setImagemExpandidaUrl(null)}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative w-full h-full flex items-center justify-center bg-black/5">
                <img
                  src={imagemExpandidaUrl || ''}
                  alt={`Foto de ${imagemExpandidaNome}`}
                  className="max-w-full max-h-[80vh] object-contain"
                  loading="eager"
                  style={{
                    imageRendering: 'crisp-edges'
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 text-center">
                {imagemExpandidaNome}
              </div>
            </div>
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