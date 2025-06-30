"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Filter, FileDown, Plus, Pencil } from 'lucide-react';
import { getLimiteMacByMunicipio } from '@/utils/limitesmac';
import { getLimitePapByMunicipio } from '@/utils/limitepap';
import { disableConsoleLogging } from '@/lib/logger';

interface Proposta {
  nuProposta: string;
  acao: string;
  nmPrograma: string;
  nmTipoObjeto: string;
  snPrincipal: string;
  municipio: string;
  vlProposta: number;
  vlGlobal: number;
  coSituacaoProposta: string;
  dsSituacaoProposta: string;
  dtCadastramento: string;
  coTipoProposta: string;
  dsTipoRecurso: string;
  vlPagar: number;
}

interface EmendaSUAS {
  id?: string;
  municipio: string;
  tipo_proposta: string;
  tipo_recurso: string;
  valor_proposta: number;
  valor_pagar: number;
  created_at?: string;
  updated_at?: string;
}

interface PropostaExtendida extends Proposta {
  tipo: 'FNS' | 'SUAS';
  emendaSUASId?: string;
}

// Função utilitária para remover acentos
function normalizeString(str: string) {
  return (str || '')
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove tudo que não é letra, número ou espaço
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim();
}

// Função para buscar população do município selecionado no IBGE
async function fetchPopulacaoMunicipio(nomeMunicipio: string): Promise<number | null> {
  try {
    // Busca todos os municípios do Piauí
    const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/22/municipios');
    const municipios = await res.json();
    // Procura o município pelo nome, ignorando acentos e caixa
    const nomeNormalizado = normalizeString(nomeMunicipio);
    const municipio = municipios.find((m: any) => normalizeString(m.nome) === nomeNormalizado);
    if (!municipio) return null;
    // Busca a população do Censo 2022 do município
    const resPop = await fetch(`https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/29171/municipios/${municipio.id}`);
    const popData = await resPop.json();
    // O valor está em popData[0].res[0].resposta
    if (popData && popData[0] && popData[0].res && popData[0].res[0] && popData[0].res[0].resposta) {
      return Number(popData[0].res[0].resposta);
    }
    return null;
  } catch {
    return null;
  }
}

// Função para classificar porte e valor máximo
function classificaPorteESUAS(populacao: number | null) {
  if (populacao === null) return { porte: '-', valor: '-' };
  if (populacao <= 20000) return { porte: 'Pequeno Porte I', valor: 'R$ 1.000.000,00' };
  if (populacao <= 50000) return { porte: 'Pequeno Porte II', valor: 'R$ 2.300.000,00' };
  if (populacao <= 100000) return { porte: 'Médio Porte', valor: 'R$ 4.100.000,00' };
  if (populacao <= 900000) return { porte: 'Grande Porte', valor: 'R$ 8.800.000,00' };
  return { porte: 'Metrópole', valor: 'R$ 22.700.000,00' };
}

export default function ConsultarTetosPage() {
  // Desabilitar logs de console para proteção de dados
  disableConsoleLogging();
  

  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [filteredPropostas, setFilteredPropostas] = useState<Proposta[]>([]);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoPropostaFilter, setTipoPropostaFilter] = useState('todos');
  const [tipoRecursoFilter, setTipoRecursoFilter] = useState('todos');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Proposta, direction: 'asc' | 'desc' } | null>(null);
  const [municipiosPopulacao, setMunicipiosPopulacao] = useState<any[]>([]);
  const [populacaoSUAS, setPopulacaoSUAS] = useState<number | null>(null);
  const [porteSUAS, setPorteSUAS] = useState<string>('-');
  const [valorSUAS, setValorSUAS] = useState<string>('-');
  const [emendasSUAS, setEmendasSUAS] = useState<EmendaSUAS[]>([]);
  const [showEmendasSUASModal, setShowEmendasSUASModal] = useState(false);
  const [novaEmendaSUAS, setNovaEmendaSUAS] = useState<EmendaSUAS>({
    id: undefined,
    municipio: '',
    tipo_proposta: 'INCREMENTO SUAS',
    tipo_recurso: 'EMENDA/PROJETO',
    valor_proposta: 0,
    valor_pagar: 0,
    created_at: undefined,
    updated_at: undefined
  });
  
  // Lista completa de municípios do PI 
  const [todosOsMunicipios, setTodosOsMunicipios] = useState<string[]>(['todos']);

  // Valores fixos para emendas SUAS
  const TIPO_PROPOSTA_SUAS = 'INCREMENTO SUAS';
  const TIPO_RECURSO_SUAS = 'EMENDA/PROJETO';

  // Função para limpar o formulário
  const limparFormularioSUAS = () => {
    setNovaEmendaSUAS({
      id: undefined,
      municipio: '',
      tipo_proposta: TIPO_PROPOSTA_SUAS,
      tipo_recurso: TIPO_RECURSO_SUAS,
      valor_proposta: 0,
      valor_pagar: 0,
      created_at: undefined,
      updated_at: undefined
    });
  };

  // Função para carregar os dados das propostas
  const loadPropostas = async (municipio?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/consultar-tetos';
      
      if (municipio && municipio !== 'todos' && !municipio.includes('force_update')) {
        // Busca específica por município
        url += `?municipio=${encodeURIComponent(municipio)}`;
      } else if (municipio && municipio.includes('&force_update=')) {
        // Busca específica por município com force update
        const [nomeMunicipio, forceParam] = municipio.split('&force_update=');
        url += `?municipio=${encodeURIComponent(nomeMunicipio)}&${forceParam}`;
      } else {
        // Busca limitada para carregamento inicial
        url += '?limit=30';
        // Se for força atualização geral, adicionar timestamp para quebrar cache
        if (municipio && municipio.includes('force_update')) {
          url += `&${municipio}`;
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
      
      const res = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 504) {
          throw new Error('Timeout: A consulta demorou muito para responder. Tente filtrar por um município específico.');
        }
        throw new Error(`Erro ao buscar dados: ${res.status}`);
      }
      const data = await res.json();
      
      // A API agora retorna um objeto com propostas e municípios
      setPropostas(data.propostas || data);
      setTodosOsMunicipios(['todos', ...(data.municipios || [])]);
      applyFilter(data.propostas || data, filter);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Consulta cancelada por timeout. Tente filtrar por um município específico.');
      } else {
        setError(err.message || 'Erro ao carregar propostas');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Aplicar filtro por município
  const applyFilter = (data: Proposta[], municipioFilter: string) => {
    if (municipioFilter === 'todos') {
      setFilteredPropostas(data);
    } else {
      setFilteredPropostas(data.filter(item => item.municipio === municipioFilter));
    }
  };

  // Formatar valor para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data para o formato brasileiro
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Baixar dados em CSV
  const downloadCSV = () => {
    // Cabeçalho do CSV
    const headers = [
      'Município',
      'Tipo de Proposta', 
      'Tipo de Recurso', 
      'Valor da Proposta', 
      'Valor a Pagar'
    ];

    // Converter dados para formato CSV
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const item of filteredPropostas) {
      const row = [
        `"${item.municipio}"`,
        `"${item.coTipoProposta}"`,
        `"${item.dsTipoRecurso || 'N/A'}"`,
        `"${item.vlProposta}"`,
        `"${item.vlPagar || 0}"`
      ];
      csvRows.push(row.join(','));
    }

    // Criar blob e link para download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `propostas_fns_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Carregar propostas (que já incluem a lista de municípios)
    loadPropostas();
  }, []);
  
  useEffect(() => {
    applyFilter(propostas, filter);
  }, [filter, propostas]);
  
  // Usar a lista completa de municípios do arquivo local
  const municipios = todosOsMunicipios;

  // Função para aplicar todos os filtros
  const applyAllFilters = (data: Proposta[], municipio: string, tipoProposta: string, tipoRecurso: string) => {
    let filtered = data;
    if (municipio !== 'todos') {
      filtered = filtered.filter(item => item.municipio === municipio);
    }
    if (tipoProposta !== 'todos') {
      filtered = filtered.filter(item => item.coTipoProposta === tipoProposta);
    }
    if (tipoRecurso !== 'todos') {
      filtered = filtered.filter(item => item.dsTipoRecurso === tipoRecurso);
    }
    // Remover registros com dsTipoRecurso igual a 'PROGRAMA'
    filtered = filtered.filter(item => item.dsTipoRecurso !== 'PROGRAMA');
    return filtered;
  };

  // Função para ordenar os dados
  const sortData = (data: Proposta[]) => {
    if (!sortConfig) return data;
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue), 'pt-BR')
        : String(bValue).localeCompare(String(aValue), 'pt-BR');
    });
    return sorted;
  };

  // Função para agrupar propostas por município e tipo de proposta
  const groupPropostas = (data: Proposta[]) => {
    const grouped = data.reduce((acc: { [key: string]: Proposta[] }, proposta) => {
      const key = proposta.municipio;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(proposta);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  };

  // Atualizar filtros e ordenação
  useEffect(() => {
    let filtered = applyAllFilters(propostas, filter, tipoPropostaFilter, tipoRecursoFilter);
    filtered = sortData(filtered);
    setFilteredPropostas(filtered);
  }, [filter, tipoPropostaFilter, tipoRecursoFilter, sortConfig, propostas]);

  // Listas únicas para filtros
  const tiposProposta = propostas.length > 0
    ? ['todos', ...Array.from(new Set(propostas.map(p => p.coTipoProposta))).sort()]
    : ['todos'];
  const tiposRecurso = propostas.length > 0
    ? ['todos', ...Array.from(new Set(propostas.map(p => p.dsTipoRecurso))).sort()]
    : ['todos'];

  // Função para alternar ordenação
  const handleSort = (key: keyof Proposta) => {
    setSortConfig(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  // Agrupar propostas para exibição
  const groupedPropostas = groupPropostas(filteredPropostas);

  // Cálculo dos dados do card MAC
  let municipioSelecionado = filter !== 'todos' ? filter : null;
  let limiteMac = municipioSelecionado ? getLimiteMacByMunicipio(municipioSelecionado) : null;
  let propostasMac = filteredPropostas.filter(p => municipioSelecionado ? p.municipio === municipioSelecionado : true).filter(p => p.coTipoProposta && p.coTipoProposta.toUpperCase().includes('MAC'));
  let somaPropostasMac = propostasMac.reduce((acc, curr) => acc + (curr.vlProposta || 0), 0);
  let somaValorPagarMac = propostasMac.reduce((acc, curr) => acc + (curr.vlPagar || 0), 0);
  let saldoMac = limiteMac ? limiteMac.valor - somaPropostasMac : null;

  // Cálculo dos dados do card PAP
  let limitePap = municipioSelecionado ? getLimitePapByMunicipio(municipioSelecionado) : null;
  let propostasPap = filteredPropostas.filter(p => municipioSelecionado ? p.municipio === municipioSelecionado : true).filter(p => p.coTipoProposta && p.coTipoProposta.toUpperCase().includes('PAP'));
  let somaPropostasPap = propostasPap.reduce((acc, curr) => acc + (curr.vlProposta || 0), 0);
  let somaValorPagarPap = propostasPap.reduce((acc, curr) => acc + (curr.vlPagar || 0), 0);
  let saldoPap = limitePap ? limitePap.valor - somaPropostasPap : null;

  useEffect(() => {
    // Carrega o JSON de população apenas uma vez
    fetch('/populacaoibge.json')
      .then(res => res.json())
      .then(data => setMunicipiosPopulacao(data));
    
    // Carrega as propostas iniciais
    loadPropostas();
  }, []);

  function getPopulacaoMunicipio(nomeMunicipio: string): number | null {
    if (!nomeMunicipio || municipiosPopulacao.length === 0) return null;
    const nomeNormalizado = normalizeString(nomeMunicipio);
    const municipio = municipiosPopulacao.find(
      (m) => normalizeString(m.nome) === nomeNormalizado || m.nome_normalizado === nomeNormalizado
    );
    return municipio ? Number(municipio.populacao) : null;
  }

  useEffect(() => {
    if (municipioSelecionado && municipiosPopulacao.length > 0) {
      const pop = getPopulacaoMunicipio(municipioSelecionado);
      setPopulacaoSUAS(pop);
      const { porte, valor } = classificaPorteESUAS(pop);
      setPorteSUAS(porte);
      setValorSUAS(valor);
    } else {
      setPopulacaoSUAS(null);
      setPorteSUAS('-');
      setValorSUAS('-');
    }
  }, [municipioSelecionado, municipiosPopulacao]);

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

  // Função para adicionar nova emenda SUAS
  const handleAddEmendaSUAS = async () => {
    try {
      const res = await fetch('/api/emendassuas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novaEmendaSUAS,
          municipio: filter !== 'todos' ? filter : novaEmendaSUAS.municipio
        })
      });
      
      if (!res.ok) throw new Error('Erro ao adicionar emenda SUAS');
      
      const { id } = await res.json();
      
      // Atualiza o estado local com a nova emenda
      setEmendasSUAS(prev => [...prev, {
        id,
        ...novaEmendaSUAS,
        municipio: filter !== 'todos' ? filter : novaEmendaSUAS.municipio,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

      setShowEmendasSUASModal(false);
      limparFormularioSUAS();
    } catch (error) {
      console.error('Erro ao adicionar emenda SUAS:', error);
    }
  };

  // Carregar emendas SUAS quando o município for selecionado
  useEffect(() => {
    if (filter !== 'todos') {
      loadEmendasSUAS();
    }
  }, [filter]);

  // Calcular totais das emendas SUAS
  const emendasSUASFiltradas = emendasSUAS.filter(e => e.municipio === filter);
  const totalPropostasSUAS = emendasSUASFiltradas.reduce((acc, curr) => acc + curr.valor_proposta, 0);
  const totalPagarSUAS = emendasSUASFiltradas.reduce((acc, curr) => acc + curr.valor_pagar, 0);

  // Combinar propostas FNS com emendas SUAS
  const todasPropostas = useMemo(() => {
    const propostasFNS = propostas.map(p => ({
      ...p,
      tipo: 'FNS' as const
    }));

    const propostasSUAS = emendasSUAS.map(e => ({
      nuProposta: `SUAS-${e.id}`,
      acao: '',
      nmPrograma: '',
      nmTipoObjeto: '',
      snPrincipal: '',
      municipio: e.municipio,
      vlProposta: e.valor_proposta,
      vlGlobal: e.valor_proposta,
      coSituacaoProposta: '',
      dsSituacaoProposta: '',
      dtCadastramento: e.created_at || new Date().toISOString(),
      coTipoProposta: e.tipo_proposta,
      dsTipoRecurso: e.tipo_recurso,
      vlPagar: e.valor_pagar,
      tipo: 'SUAS' as const,
      emendaSUASId: e.id
    }));

    return [...propostasFNS, ...propostasSUAS] as PropostaExtendida[];
  }, [propostas, emendasSUAS]);

  // Função para editar emenda SUAS
  const handleEditEmendaSUAS = async (emenda: EmendaSUAS) => {
    setNovaEmendaSUAS(emenda);
    setShowEmendasSUASModal(true);
  };

  // Função para atualizar emenda SUAS
  const handleUpdateEmendaSUAS = async () => {
    try {
      const res = await fetch('/api/emendassuas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaEmendaSUAS)
      });
      
      if (!res.ok) throw new Error('Erro ao atualizar emenda SUAS');
      
      // Atualiza o estado local
      setEmendasSUAS(prev => prev.map(e => 
        e.id === novaEmendaSUAS.id ? novaEmendaSUAS : e
      ));

      setShowEmendasSUASModal(false);
      limparFormularioSUAS();
    } catch (error) {
      console.error('Erro ao atualizar emenda SUAS:', error);
    }
  };

  // Função para extrair o valor numérico do formato "R$ X.XXX.XXX,XX"
  const extrairValorNumerico = (valorFormatado: string): number => {
    if (valorFormatado === '-') return 0;
    return Number(valorFormatado.replace('R$ ', '').replace('.', '').replace(',', '.'));
  };

  // Calcular saldo SUAS
  const calcularSaldoSUAS = (): number => {
    const limiteNumerico = extrairValorNumerico(valorSUAS);
    return limiteNumerico - totalPropostasSUAS;
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col md:flex-row">
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar interna do conteúdo */}
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Consultar Tetos</span>
              <span className="text-xs text-gray-500 font-light">Consulta de Propostas do Fundo Nacional de Saúde</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Forçar atualização respeitando município selecionado
                  const timestamp = new Date().getTime();
                  if (filter !== 'todos') {
                    // Se há município selecionado, buscar só ele com force update
                    loadPropostas(`${filter}&force_update=${timestamp}`);
                  } else {
                    // Se "todos", buscar geral com force update
                    loadPropostas(`force_update=${timestamp}`);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-gray-50 text-gray-700 cursor-pointer border-gray-200"
                title="Atualizar dados (força nova busca)"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCSV()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-green-50 text-green-700 cursor-pointer border-gray-200"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar CSV
                </button>
                {filter !== 'todos' && (
                  <button
                    onClick={() => setShowEmendasSUASModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-orange-50 text-orange-700 cursor-pointer border-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Emenda SUAS
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Conteúdo principal */}
        <main className="p-0 w-full">
          {/* Seção de filtros */}
          <div className="px-4 py-3 mb-2 space-y-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select 
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                  value={filter}
                  onChange={(e) => {
                    const municipio = e.target.value;
                    setFilter(municipio);
                    if (municipio !== 'todos') {
                      loadPropostas(municipio);
                    }
                  }}
                  disabled={loading}
                >
                  {municipios.map((municipio, index) => (
                    <option key={index} value={municipio}>
                      {municipio === 'todos' ? 'Todos os municípios' : municipio}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                  value={tipoPropostaFilter}
                  onChange={e => setTipoPropostaFilter(e.target.value)}
                  disabled={loading}
                >
                  {tiposProposta.map((tipo, idx) => (
                    <option key={idx} value={tipo}>
                      {tipo === 'todos' ? 'Todos os tipos de proposta' : tipo}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                  value={tipoRecursoFilter}
                  onChange={e => setTipoRecursoFilter(e.target.value)}
                  disabled={loading}
                >
                  {tiposRecurso.map((tipo, idx) => (
                    <option key={idx} value={tipo}>
                      {tipo === 'todos' ? 'Todos os tipos de recurso' : tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="text-xs text-gray-500">
                Total: {filteredPropostas.length} proposta(s)
                {filter !== 'todos' && ` em ${filter}`}
              </div>
              <button
                onClick={downloadCSV}
                className="w-full md:w-auto flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-green-50 text-green-700 cursor-pointer border-gray-200"
                title="Exportar dados para CSV"
                disabled={loading || filteredPropostas.length === 0}
              >
                <FileDown className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Estados de loading e erro */}
          {loading && (
            <div className="px-4 text-center text-gray-500 py-6">
              <div className="inline-block animate-spin mr-2">⟳</div>
              Carregando propostas...
            </div>
          )}
          
          {error && (
            <div className="mx-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
              Erro ao carregar propostas: {error}
            </div>
          )}
          
          {/* Tabela de propostas */}
          {!loading && !error && filteredPropostas.length === 0 ? (
            <div className="px-4 text-center text-gray-500 py-16">
              {filter !== 'todos' 
                ? `Nenhuma proposta encontrada para ${filter}.` 
                : 'Nenhuma proposta encontrada. Tente atualizar os dados.'}
            </div>
          ) : !loading && (
            <>
              {/* Tabela para desktop */}
              <div className="hidden md:block overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Município</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Proposta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Recurso</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Proposta</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor a Pagar</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todasPropostas.map((proposta, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{proposta.municipio}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{proposta.coTipoProposta}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{proposta.dsTipoRecurso || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 text-right whitespace-nowrap">{formatCurrency(proposta.vlProposta)}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 text-right whitespace-nowrap">{formatCurrency(proposta.vlPagar || 0)}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 text-right whitespace-nowrap">
                          {proposta.tipo === 'SUAS' && (
                            <button
                              onClick={() => handleEditEmendaSUAS({
                                id: proposta.emendaSUASId,
                                municipio: proposta.municipio,
                                tipo_proposta: proposta.coTipoProposta,
                                tipo_recurso: proposta.dsTipoRecurso,
                                valor_proposta: proposta.vlProposta,
                                valor_pagar: proposta.vlPagar
                              })}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards para mobile */}
              <div className="block md:hidden">
                <div className="divide-y divide-gray-200">
                  {filteredPropostas.map((proposta, idx) => (
                    <div key={idx} className="p-4 bg-white">
                      <div className="space-y-2">
                        <div>
                          <div className="font-medium text-gray-900">{proposta.municipio}</div>
                          <div className="text-sm text-gray-600">{proposta.coTipoProposta}</div>
                        </div>
                        <div className="text-sm text-gray-600">{proposta.dsTipoRecurso || "N/A"}</div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <div className="text-xs text-gray-500">Valor Proposta</div>
                            <div className="font-medium text-gray-900">{formatCurrency(proposta.vlProposta)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Valor a Pagar</div>
                            <div className="font-medium text-gray-900">{formatCurrency(proposta.vlPagar || 0)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Cards de Limite MAC, PAP e SUAS */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {/* Card MAC */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
              <div className="text-xs text-blue-900 font-semibold mb-1">
                {municipioSelecionado ? `Município: ${municipioSelecionado}` : 'Selecione um município para ver o Limite MAC'}
              </div>
              {municipioSelecionado && limiteMac ? (
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-blue-800 font-medium">Limite MAC</div>
                    <div className="text-base md:text-lg font-bold text-blue-900">{formatCurrency(limiteMac.valor)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-blue-800 font-medium">Propostas MAC</div>
                    <div className="text-base md:text-lg font-bold text-blue-900">{formatCurrency(somaPropostasMac)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-blue-800 font-medium">Valor a Pagar MAC</div>
                    <div className="text-base md:text-lg font-bold text-blue-900">{formatCurrency(somaValorPagarMac)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-blue-800 font-medium">Saldo MAC</div>
                    <div className="text-base md:text-lg font-bold text-blue-900">{saldoMac !== null ? formatCurrency(saldoMac) : '-'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-blue-700">Nenhum limite MAC encontrado para o município selecionado.</div>
              )}
            </div>

            {/* Card PAP */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
              <div className="text-xs text-green-900 font-semibold mb-1">
                {municipioSelecionado ? `Município: ${municipioSelecionado}` : 'Selecione um município para ver o Limite PAP'}
              </div>
              {municipioSelecionado && limitePap ? (
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-green-800 font-medium">Limite PAP</div>
                    <div className="text-base md:text-lg font-bold text-green-900">{formatCurrency(limitePap.valor)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-green-800 font-medium">Propostas PAP</div>
                    <div className="text-base md:text-lg font-bold text-green-900">{formatCurrency(somaPropostasPap)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-green-800 font-medium">Valor a Pagar PAP</div>
                    <div className="text-base md:text-lg font-bold text-green-900">{formatCurrency(somaValorPagarPap)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-green-800 font-medium">Saldo PAP</div>
                    <div className="text-base md:text-lg font-bold text-green-900">{saldoPap !== null ? formatCurrency(saldoPap) : '-'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-green-700">Nenhum limite PAP encontrado para o município selecionado.</div>
              )}
            </div>

            {/* Card SUAS */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
              <div className="text-xs text-purple-900 font-semibold mb-1">
                {municipioSelecionado ? `Município: ${municipioSelecionado}` : 'Selecione um município para ver o Limite SUAS'}
              </div>
              {municipioSelecionado ? (
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-purple-800 font-medium">Porte</div>
                    <div className="text-base md:text-lg font-bold text-purple-900">{porteSUAS}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-purple-800 font-medium">Limite SUAS</div>
                    <div className="text-base md:text-lg font-bold text-purple-900">{valorSUAS}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-purple-800 font-medium">Total Propostas</div>
                    <div className="text-base md:text-lg font-bold text-purple-900">{formatCurrency(totalPropostasSUAS)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-purple-800 font-medium">Saldo SUAS</div>
                    <div className="text-base md:text-lg font-bold text-purple-900">{formatCurrency(calcularSaldoSUAS())}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-purple-700">Nenhum limite SUAS encontrado para o município selecionado.</div>
              )}
            </div>
          </div>

          {/* Modal de Adicionar/Editar Emenda SUAS */}
          {showEmendasSUASModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                  {novaEmendaSUAS.id ? 'Editar Emenda SUAS' : 'Adicionar Emenda SUAS'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Proposta</label>
                    <input
                      type="text"
                      value={novaEmendaSUAS.tipo_proposta}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Recurso</label>
                    <input
                      type="text"
                      value={novaEmendaSUAS.tipo_recurso}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor da Proposta</label>
                    <input
                      type="number"
                      value={novaEmendaSUAS.valor_proposta}
                      onChange={(e) => setNovaEmendaSUAS(prev => ({ ...prev, valor_proposta: Number(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor a Pagar</label>
                    <input
                      type="number"
                      value={novaEmendaSUAS.valor_pagar}
                      onChange={(e) => setNovaEmendaSUAS(prev => ({ ...prev, valor_pagar: Number(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowEmendasSUASModal(false);
                      limparFormularioSUAS();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={novaEmendaSUAS.id ? handleUpdateEmendaSUAS : handleAddEmendaSUAS}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md"
                  >
                    {novaEmendaSUAS.id ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="mt-auto text-center py-3 text-xs text-gray-500 border-t border-gray-100">
          © 2025 86 Dynamics - Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
} 