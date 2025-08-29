'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw, Search, Filter, ChevronDown, ChevronRight, ChevronUp, DollarSign, TrendingUp, CheckCircle, CreditCard, Printer, X, CheckCircle2, Shield } from 'lucide-react';
import { type Emenda } from '@/types/emenda';
import { EmendasTable } from '@/components/table/EmendasTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Save } from 'lucide-react';
import { getLimiteMacByMunicipio } from '@/utils/limitesmac';
import { getLimitePapByMunicipio } from '@/utils/limitepap';
import { PageLoading } from '@/components/ui/loading';



interface BlocoData {
  bloco: string;
  emendas: Emenda[];
  totalValorIndicado: number;
  totalValorAEmpenhar: number;
  totalValorEmpenhado: number;
  totalValorPago: number;
  totalValorContingenciado: number;
  totalMunicipios: number;
}

// Função utilitária para remover acentos (igual à página de tetos)
function normalizeString(str: string) {
  return (str || '')
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove tudo que não é letra, número ou espaço
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim();
}

// Função para mapear nomes de municípios com acentos para nomes sem acentos
function mapearNomeMunicipio(nomeOriginal: string): string {
  const mapeamento: { [key: string]: string } = {
    'PARNAÍBA': 'PARNAIBA',
    'Parnaíba': 'PARNAIBA',
    'parnaíba': 'PARNAIBA',
    'ÁGUA BRANCA': 'AGUA BRANCA',
    'Água Branca': 'AGUA BRANCA',
    'água branca': 'AGUA BRANCA',
    'SÃO PEDRO DO PIAUÍ': 'SAO PEDRO DO PIAUI',
    'São Pedro do Piauí': 'SAO PEDRO DO PIAUI',
    'são pedro do piauí': 'SAO PEDRO DO PIAUI',
    'CAPITÃO DE CAMPOS': 'CAPITAO DE CAMPOS',
    'Capitão de Campos': 'CAPITAO DE CAMPOS',
    'capitão de campos': 'CAPITAO DE CAMPOS',
    'CAPITÃO GERVÁSIO OLIVEIRA': 'CAPITAO GERVASIO OLIVEIRA',
    'Capitão Gervásio Oliveira': 'CAPITAO GERVASIO OLIVEIRA',
    'capitão gervásio oliveira': 'CAPITAO GERVASIO OLIVEIRA',
    'LUÍS CORREIA': 'LUIS CORREIA',
    'Luís Correia': 'LUIS CORREIA',
    'luís correia': 'LUIS CORREIA',
    'CASTELO DO PIAUÍ': 'CASTELO DO PIAUI',
    'Castelo do Piauí': 'CASTELO DO PIAUI',
    'castelo do piauí': 'CASTELO DO PIAUI'
  };

  return mapeamento[nomeOriginal] || nomeOriginal;
}

export default function Emendas2025() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emendas, setEmendas] = useState<Emenda[]>([]);
  const [emendasFiltradas, setEmendasFiltradas] = useState<Emenda[]>([]);
  const [blocos, setBlocos] = useState<BlocoData[]>([]);
  const [blocosExpandidos, setBlocosExpandidos] = useState<Set<string>>(new Set());
  const [skipNextFilterProcessing, setSkipNextFilterProcessing] = useState(false);
  
  // Filtros
  const [filtroBloco, setFiltroBloco] = useState<string>('TODOS_BLOCOS');
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('TODOS_MUNICIPIOS');
  const [filtroEmenda, setFiltroEmenda] = useState<string>('TODAS_EMENDAS');
  const [filtroStatusEmpenho, setFiltroStatusEmpenho] = useState<string>('TODOS_STATUS');
  const [filtroMunicipioSaldo, setFiltroMunicipioSaldo] = useState<string>('');
  
  // Ordenação
  const [ordenacaoAtual, setOrdenacaoAtual] = useState<{ campo: string; direcao: 'asc' | 'desc' } | null>(null);
  
  // Filtros retráteis
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);



  // Estados do modal de edição
  const [modalAberto, setModalAberto] = useState(false);
  const [emendaEditando, setEmendaEditando] = useState<Emenda | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState<Partial<Emenda>>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Estados para saldos MAC e PAP
  const [saldosMac, setSaldosMac] = useState<{
    limite: number | null;
    propostas: number;
    valorPagar: number;
    saldo: number | null;
  }>({ limite: null, propostas: 0, valorPagar: 0, saldo: null });
  
  const [saldosPap, setSaldosPap] = useState<{
    limite: number | null;
    propostas: number;
    valorPagar: number;
    saldo: number | null;
  }>({ limite: null, propostas: 0, valorPagar: 0, saldo: null });

  // Estados para saldos dos blocos 2 e 3
  const [saldosBlocos, setSaldosBlocos] = useState<{
    [municipio: string]: {
      mac: { limite: number | null; propostas: number; valorPagar: number; saldo: number | null };
      pap: { limite: number | null; propostas: number; valorPagar: number; saldo: number | null };
    }
  }>({});


  
  // Estado para mostrar lista de municípios disponíveis para remanejamento
  const [mostrarMunicipiosDisponiveis, setMostrarMunicipiosDisponiveis] = useState(false);

  // Estado para controlar o contingenciamento
  const [contingenciamentoAtivo, setContingenciamentoAtivo] = useState(true);

  // Buscar dados das emendas do Firebase
  const fetchEmendas = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      // Adicionar cache busting para forçar busca de dados atualizados
      const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
      const res = await fetch(`/api/emendas${timestamp}`, {
        cache: 'no-store', // Evitar cache do browser
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.emendas) {
        setEmendas(data.emendas);
        setEmendasFiltradas(data.emendas);
        processarBlocos(data.emendas);
      } else {
        throw new Error(data.error || 'Erro ao carregar dados das emendas');
      }
    } catch (error: any) {
      console.error('Erro ao buscar emendas:', error);
      setError(error.message || 'Erro ao carregar dados das emendas');
      toast.error('Erro ao buscar dados. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Funções do modal de edição
  const abrirModalEdicao = (emenda: Emenda) => {
    setEmendaEditando(emenda);
    setDadosEdicao({...emenda});
    setModalAberto(true);
  };

  const fecharModalEdicao = () => {
    setModalAberto(false);
    setEmendaEditando(null);
    setDadosEdicao({});
    setSalvandoEdicao(false);
  };

  const handleDuploClic = (emenda: Emenda) => {
    abrirModalEdicao(emenda);
  };

  const handleCampoEdicao = (campo: keyof Emenda, valor: any) => {
    setDadosEdicao(prev => {
      let novo = { ...prev, [campo]: valor };
      if (campo === 'valorEmpenhado' || campo === 'valorIndicado') {
        const valorIndicado = campo === 'valorIndicado' ? valor : novo.valorIndicado ?? 0;
        const valorEmpenhado = campo === 'valorEmpenhado' ? valor : novo.valorEmpenhado ?? 0;
        novo.valorAEmpenhar = (valorIndicado || 0) - (valorEmpenhado || 0);
        if (novo.valorAEmpenhar < 0) novo.valorAEmpenhar = 0;
      }
      return novo;
    });
  };

  const salvarEdicao = async () => {
    if (!emendaEditando || !dadosEdicao.id) {
      toast.error('Erro: Dados da emenda não encontrados');
      return;
    }

    setSalvandoEdicao(true);

    try {
      const response = await fetch(`/api/emendas/${dadosEdicao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dadosEdicao,
          updatedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        toast.success('Emenda atualizada com sucesso!');
        
        // Atualização local imediata e silenciosa
        const emendaAtualizada = { ...emendaEditando, ...dadosEdicao };
        
        // Sinalizar para pular o próximo processamento de filtros
        setSkipNextFilterProcessing(true);
        
        // 1. Primeiro atualizar o estado principal das emendas
        setEmendas(prev => {
          const novasEmendas = prev.map(emenda => 
            emenda.id === dadosEdicao.id ? emendaAtualizada : emenda
          );
          return novasEmendas;
        });
        
        // 2. Depois atualizar as emendas filtradas separadamente
        setEmendasFiltradas(prev => 
          prev.map(emenda => 
            emenda.id === dadosEdicao.id ? emendaAtualizada : emenda
          )
        );
        
        // 3. Forçar reprocessamento dos blocos usando a emenda atualizada
        // Atualizar os blocos diretamente sem depender do useEffect
        setBlocos(prev => 
          prev.map(bloco => {
            const emendasAtualizadas = bloco.emendas.map(emenda => 
              emenda.id === dadosEdicao.id ? emendaAtualizada : emenda
            );
            
            const totalValorIndicado = emendasAtualizadas
              .reduce((acc, emenda) => acc + (emenda.valorIndicado || 0), 0);
            const totalValorAEmpenhar = emendasAtualizadas
              .reduce((acc, emenda) => acc + (emenda.valorAEmpenhar || 0), 0);
            const totalValorEmpenhado = emendasAtualizadas
              .reduce((acc, emenda) => acc + (emenda.valorEmpenhado || 0), 0);
            const totalValorPago = emendasAtualizadas
              .reduce((acc, emenda) => acc + (emenda.valorPago || 0), 0);
            
            // Calcular total contingenciado apenas para Bloco 3 e se estiver ativo
            const totalValorContingenciado = (bloco.bloco === 'BLOCO 3' && contingenciamentoAtivo) ? 
              totalValorIndicado * (17.14 / 100) : 0;
            
            return {
              ...bloco,
              emendas: emendasAtualizadas,
              totalValorIndicado,
              totalValorAEmpenhar,
              totalValorEmpenhado,
              totalValorPago,
              totalValorContingenciado
            };
          })
        );
        
        // Resetar o flag após um pequeno delay
        setTimeout(() => setSkipNextFilterProcessing(false), 100);
        
        fecharModalEdicao();
      } else {
        throw new Error(resultado.error || 'Erro ao salvar alterações');
      }
    } catch (error: any) {
      console.error('Erro ao salvar emenda:', error);
      toast.error(error.message || 'Erro ao salvar alterações');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Processar dados e agrupar por blocos
  const processarBlocos = (dados: Emenda[]) => {

    
    const blocoMap = new Map<string, Emenda[]>();
    
    dados.forEach(emenda => {
      const bloco = emenda.bloco || 'SEM BLOCO';
      if (!blocoMap.has(bloco)) {
        blocoMap.set(bloco, []);
      }
      blocoMap.get(bloco)!.push(emenda);
    });

    const blocosProcessados: BlocoData[] = Array.from(blocoMap.entries()).map(([bloco, emendas]) => {
      // Aplicar ordenação se houver
      let emendasOrdenadas = [...emendas];
      if (ordenacaoAtual) {
        emendasOrdenadas.sort((a, b) => {
          const valorA = a[ordenacaoAtual.campo as keyof Emenda];
          const valorB = b[ordenacaoAtual.campo as keyof Emenda];
          
          // Tratar valores nulos
          if (valorA === null && valorB === null) return 0;
          if (valorA === null) return ordenacaoAtual.direcao === 'asc' ? 1 : -1;
          if (valorB === null) return ordenacaoAtual.direcao === 'asc' ? -1 : 1;
          
          // Ordenação numérica para valores numéricos
          if (typeof valorA === 'number' && typeof valorB === 'number') {
            return ordenacaoAtual.direcao === 'asc' ? valorA - valorB : valorB - valorA;
          }
          
          // Ordenação alfabética para strings
          const comparison = String(valorA).localeCompare(String(valorB));
          return ordenacaoAtual.direcao === 'asc' ? comparison : -comparison;
        });
      }

      const totalValorIndicado = emendasOrdenadas.reduce((acc, emenda) => acc + (emenda.valorIndicado || 0), 0);
      const totalValorAEmpenhar = emendasOrdenadas.reduce((acc, emenda) => acc + (emenda.valorAEmpenhar || 0), 0);
      const totalValorEmpenhado = emendasOrdenadas.reduce((acc, emenda) => acc + (emenda.valorEmpenhado || 0), 0);
      const totalValorPago = emendasOrdenadas.reduce((acc, emenda) => acc + (emenda.valorPago || 0), 0);
      const municipiosUnicos = new Set(emendasOrdenadas.map(e => e.municipioBeneficiario).filter(Boolean));
      
      // Calcular total contingenciado apenas para Bloco 3 e se estiver ativo
      const totalValorContingenciado = (bloco === 'BLOCO 3' && contingenciamentoAtivo) ? 
        totalValorIndicado * (17.14 / 100) : 0;
      

      

      
      return {
        bloco,
        emendas: emendasOrdenadas,
        totalValorIndicado,
        totalValorAEmpenhar,
        totalValorEmpenhado,
        totalValorPago,
        totalValorContingenciado,
        totalMunicipios: municipiosUnicos.size
      };
    });

    // Ordenar blocos
    blocosProcessados.sort((a, b) => a.bloco.localeCompare(b.bloco, 'pt-BR', { 
      sensitivity: 'base', 
      ignorePunctuation: true,
      numeric: true 
    }));
    setBlocos(blocosProcessados);
  };



  // Aplicar filtros
  useEffect(() => {
    // Se devemos pular este processamento (devido a uma atualização manual), retornar
    if (skipNextFilterProcessing) {
      return;
    }

    // Primeiro, vamos agrupar as emendas por bloco
    const blocoMap = new Map<string, Emenda[]>();
    emendas.forEach(emenda => {
      const bloco = emenda.bloco || 'SEM BLOCO';
      if (!blocoMap.has(bloco)) {
        blocoMap.set(bloco, []);
      }
      blocoMap.get(bloco)!.push(emenda);
    });

    // Agora vamos aplicar os filtros dentro de cada bloco
    const dadosFiltrados: Emenda[] = [];
    blocoMap.forEach((emendasDoBloco, bloco) => {
      // Se tiver filtro de bloco e não for o bloco atual, pula
      if (filtroBloco && filtroBloco !== 'TODOS_BLOCOS' && bloco !== filtroBloco) {
        return;
      }

      // Aplica os demais filtros nas emendas do bloco
      let emendasFiltradas = [...emendasDoBloco];

      // Filtro por município
      if (filtroMunicipio && filtroMunicipio !== 'TODOS_MUNICIPIOS') {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          filtroMunicipio === 'SEM_MUNICIPIO' 
            ? !emenda.municipioBeneficiario 
            : emenda.municipioBeneficiario?.trim().toUpperCase() === filtroMunicipio.trim().toUpperCase()
        );
      }

      // Filtro por emenda
      if (filtroEmenda && filtroEmenda !== 'TODAS_EMENDAS') {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          emenda.emenda === filtroEmenda
        );
      }

      // Filtro por status de empenho
      if (filtroStatusEmpenho && filtroStatusEmpenho !== 'TODOS_STATUS') {
        emendasFiltradas = emendasFiltradas.filter(emenda => {
          switch (filtroStatusEmpenho) {
            case 'EMPENHADO':
              return (emenda.valorEmpenhado || 0) > 0;
            case 'A_EMPENHAR':
              return (emenda.valorAEmpenhar || 0) > 0;
            case 'PAGO':
              return (emenda.valorPago || 0) > 0;
            default:
              return true;
          }
        });
      }

      // Filtro por município dos saldos
      if (filtroMunicipioSaldo) {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          emenda.municipioBeneficiario?.trim().toUpperCase() === filtroMunicipioSaldo.trim().toUpperCase()
        );
      }

      // Adiciona as emendas filtradas ao resultado final
      dadosFiltrados.push(...emendasFiltradas);
    });

    setEmendasFiltradas(dadosFiltrados);
    processarBlocos(dadosFiltrados);
  }, [emendas, filtroBloco, filtroMunicipio, filtroEmenda, filtroStatusEmpenho, ordenacaoAtual, skipNextFilterProcessing, filtroMunicipioSaldo]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchEmendas();
  }, []);

  // Calcular saldos dos blocos 2 e 3 quando as emendas forem carregadas
  useEffect(() => {
    if (emendas.length > 0) {
      calcularSaldosBlocos();
    }
  }, [emendas]);



  // Função para calcular saldos MAC e PAP para todos os municípios dos blocos 2 e 3
  const calcularSaldosBlocos = async () => {
    try {
      // Obter municípios únicos dos blocos 2 e 3 das emendas originais (não filtradas)
      const municipiosBlocos = new Set<string>();
      
      emendas.forEach(emenda => {
        if (emenda.bloco === 'BLOCO 2' || emenda.bloco === 'BLOCO 3') {
          if (emenda.municipioBeneficiario) {
            municipiosBlocos.add(emenda.municipioBeneficiario);
          }
        }
      });

      const municipiosArray = Array.from(municipiosBlocos);

      const novosSaldos: typeof saldosBlocos = {};

      // Calcular saldos para cada município
      for (const municipio of municipiosArray) {
        try {
          // Normalizar o nome do município antes de buscar os limites (igual à página de tetos)
          const nomeNormalizado = normalizeString(municipio);
          const nomeMapeado = mapearNomeMunicipio(municipio);
          
          // Buscar limites do município usando o nome mapeado
          const limiteMac = getLimiteMacByMunicipio(nomeMapeado);
          const limitePap = getLimitePapByMunicipio(nomeMapeado);

          // Buscar propostas do município na API usando o nome original
          const res = await fetch(`/api/consultar-tetos?municipio=${encodeURIComponent(municipio)}`);
          if (!res.ok) {
            console.warn(`Erro ao buscar propostas para ${municipio}:`, res.status);
            continue;
          }

          const data = await res.json();
          const propostas = data.propostas || [];

          // Aplicar filtros (igual à página de tetos)
          const propostasFiltradas = propostas.filter((p: any) => 
            p.dsTipoRecurso !== 'PROGRAMA'
          );

          // Calcular propostas MAC (igual à página de tetos)
          const propostasMac = propostasFiltradas.filter((p: any) => 
            p.coTipoProposta && p.coTipoProposta.toUpperCase().includes('MAC')
          );
          const somaPropostasMac = propostasMac.reduce((acc: number, curr: any) => acc + (curr.vlProposta || 0), 0);
          const somaValorPagarMac = propostasMac.reduce((acc: number, curr: any) => acc + (curr.vlPagar || 0), 0);
          const saldoMac = limiteMac ? limiteMac.valor - somaPropostasMac : null;

          // Calcular propostas PAP (igual à página de tetos)
          const propostasPap = propostasFiltradas.filter((p: any) => 
            p.coTipoProposta && p.coTipoProposta.toUpperCase().includes('PAP')
          );
          const somaPropostasPap = propostasPap.reduce((acc: number, curr: any) => acc + (curr.vlProposta || 0), 0);
          const somaValorPagarPap = propostasPap.reduce((acc: number, curr: any) => acc + (curr.vlPagar || 0), 0);
          const saldoPap = limitePap ? limitePap.valor - somaPropostasPap : null;

          novosSaldos[municipio] = {
            mac: {
              limite: limiteMac?.valor || null,
              propostas: somaPropostasMac,
              valorPagar: somaValorPagarMac,
              saldo: saldoMac
            },
            pap: {
              limite: limitePap?.valor || null,
              propostas: somaPropostasPap,
              valorPagar: somaValorPagarPap,
              saldo: saldoPap
            }
          };

        } catch (error) {
          console.error(`Erro ao calcular saldos para ${municipio}:`, error);
        }
      }

      setSaldosBlocos(novosSaldos);

    } catch (error) {
      console.error('Erro ao calcular saldos dos blocos:', error);
    }
  };

  const formatarValor = (valor: number | null) => {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    if (valor === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number, total: number) => {
    if (!total || total === 0) return '0%';
    const percentual = (valor / total) * 100;
    return `${percentual.toFixed(1)}%`;
  };

  const calcularPercentual = (valor: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.min((valor / total) * 100, 100);
  };

  const isBlocoTotalmentePago = (bloco: BlocoData) => {
    if (!bloco.totalValorIndicado || bloco.totalValorIndicado === 0) return false;
    const percentualPago = (bloco.totalValorPago / bloco.totalValorIndicado) * 100;
    return percentualPago >= 100;
  };

  const BarraProgresso = ({ valor, total, className = "", tipo = "normal" }: { valor: number, total: number, className?: string, tipo?: "normal" | "pago" }) => {
    const percentual = calcularPercentual(valor, total);
    const isSmall = className.includes('h-1');
    const isPago = tipo === "pago";
    const is100Percent = percentual >= 100;
    
    // Definir cor da barra baseada no tipo e se está 100%
    let barColor = "bg-gradient-to-r from-blue-600 to-blue-700";
    if (isPago && is100Percent) {
      barColor = "bg-gradient-to-r from-green-500 to-green-600";
    }
    
    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className={`w-full bg-gray-200 rounded-full mt-1 overflow-hidden ${isSmall ? 'h-1' : 'h-1.5'} ${className.replace('h-1', '')}`}>
          <div 
            className={`${barColor} rounded-full ${isSmall ? 'h-1' : 'h-1.5'}`}
            style={{ 
              width: '0%',
              maxWidth: '100%',
              '--final-width': `${Math.min(percentual, 100)}%`,
              animation: 'progress-fill 1.5s ease-out 0.5s forwards'
            } as React.CSSProperties}
          ></div>
        </div>
        <div className={`text-xs mt-1 break-words overflow-hidden ${isPago && is100Percent ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
          {formatarPercentual(valor, total)}
          {isPago && is100Percent && (
            <span className="ml-1">✓</span>
          )}
        </div>
      </div>
    );
  };

  const toggleBloco = (bloco: string) => {
    setBlocosExpandidos(prev => {
      const novos = new Set(prev);
      if (novos.has(bloco)) {
        novos.delete(bloco);
      } else {
        novos.add(bloco);
      }
      return novos;
    });
  };

  const expandirTodosBlocos = () => {
    setBlocosExpandidos(new Set(blocos.map(b => b.bloco)));
  };

  const recolherTodosBlocos = () => {
    setBlocosExpandidos(new Set());
  };

  const limparFiltros = () => {
    setFiltroBloco('TODOS_BLOCOS');
    setFiltroMunicipio('TODOS_MUNICIPIOS');
    setFiltroEmenda('TODAS_EMENDAS');
    setFiltroStatusEmpenho('TODOS_STATUS');
    setOrdenacaoAtual(null);
  };

  const ordenarPorCampo = (campo: string) => {
    const novaOrdenacao = ordenacaoAtual?.campo === campo && ordenacaoAtual.direcao === 'asc' 
      ? { campo, direcao: 'desc' as const }
      : { campo, direcao: 'asc' as const };
    
    setOrdenacaoAtual(novaOrdenacao);
  };

  const obterIconeOrdenacao = (campo: string) => {
    if (ordenacaoAtual?.campo !== campo) {
      return '↕️';
    }
    return ordenacaoAtual.direcao === 'asc' ? '↑' : '↓';
  };

  // Obter listas para filtros - usando emendas não filtradas para os dropdowns
  const blocosDisponiveis = Array.from(new Set(emendas.map(e => e.bloco).filter((bloco): bloco is string => Boolean(bloco)))).sort((a, b) => a.localeCompare(b, 'pt-BR', { 
    sensitivity: 'base', 
    ignorePunctuation: true,
    numeric: true 
  }));
  
  // Normaliza os municípios antes de criar o Set para evitar duplicatas por case ou espaços
  const municipiosNormalizados = emendas
    .map(e => e.municipioBeneficiario?.trim().toUpperCase())
    .filter((municipio): municipio is string => Boolean(municipio));
  const municipiosUnicos = Array.from(new Set(municipiosNormalizados));
  const municipiosDisponiveis = municipiosUnicos
    .map(m => emendas.find(e => e.municipioBeneficiario?.trim().toUpperCase() === m)?.municipioBeneficiario?.trim() || m)
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { 
      sensitivity: 'base', 
      ignorePunctuation: true,
      numeric: true 
    }));
  
  const emendasDisponiveis = Array.from(new Set(emendas.map(e => e.emenda).filter((emenda): emenda is string => Boolean(emenda)))).sort((a, b) => a.localeCompare(b, 'pt-BR', { 
    sensitivity: 'base', 
    ignorePunctuation: true,
    numeric: true 
  }));

  // Função utilitária para corrigir todos os valores a empenhar já preenchidos
  const corrigirValoresAEmpenhar = async () => {
    if (!emendas.length) return;
    let count = 0;
    for (const emenda of emendas) {
      const valorIndicado = emenda.valorIndicado || 0;
      const valorEmpenhado = emenda.valorEmpenhado || 0;
      const valorAEmpenharCorreto = Math.max(valorIndicado - valorEmpenhado, 0);
      if (emenda.valorAEmpenhar !== valorAEmpenharCorreto) {
        try {
          const response = await fetch(`/api/emendas/${emenda.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...emenda, valorAEmpenhar: valorAEmpenharCorreto, updatedAt: new Date().toISOString() })
          });
          if (response.ok) count++;
        } catch (e) { /* ignorar erro individual */ }
      }
    }
    toast.success(`${count} emendas corrigidas!`);
    fetchEmendas();
  };

  // Função para imprimir todas as emendas em PDF
  const imprimirEmendasPDF = () => {
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Erro ao abrir janela de impressão');
      return;
    }

    // Gerar o HTML para impressão
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Emendas 2025 - Relatório</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          
          .header .date {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
          }
          
          .resumo-geral {
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            border: 1px solid #dee2e6;
          }
          
          .resumo-geral h2 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #333;
          }
          
          .resumo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          
          .resumo-item {
            padding: 10px;
            background: white;
            border-radius: 3px;
            border: 1px solid #dee2e6;
          }
          
          .resumo-item .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .resumo-item .value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          
          .bloco {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .bloco-header {
            background: #e9ecef;
            padding: 10px 15px;
            border-radius: 5px 5px 0 0;
            border: 1px solid #dee2e6;
            border-bottom: none;
          }
          
          .bloco-header h3 {
            margin: 0;
            font-size: 16px;
            color: #333;
          }
          
          .bloco-header .info {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
          }
          
          .bloco-content {
            border: 1px solid #dee2e6;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          
          .emenda-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          
          .emenda-table th {
            background: #f8f9fa;
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
            font-weight: bold;
            color: #333;
          }
          
          .emenda-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          
          .emenda-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .valor {
            text-align: right;
            font-family: monospace;
          }
          
          .objeto {
            max-width: 200px;
            word-wrap: break-word;
          }
          
          .liderancas {
            max-width: 150px;
            word-wrap: break-word;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Emendas 2025</h1>
          <div class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
        </div>
        
        <div class="resumo-geral">
          <h2>Resumo Geral</h2>
          <div class="resumo-grid">
            <div class="resumo-item">
              <div class="label">Valor Total Indicado</div>
              <div class="value">${formatarValor(totaisGerais.valorIndicado)}</div>
            </div>
            <div class="resumo-item">
              <div class="label">Valor Total a Empenhar</div>
              <div class="value">${formatarValor(totaisGerais.valorAEmpenhar)}</div>
            </div>
            <div class="resumo-item">
              <div class="label">Valor Total Empenhado</div>
              <div class="value">${formatarValor(totaisGerais.valorEmpenhado)}</div>
            </div>
            <div class="resumo-item">
              <div class="label">Valor Total Pago</div>
              <div class="value">${formatarValor(totaisGerais.valorPago)}</div>
            </div>
            <div class="resumo-item">
              <div class="label">Total de Municípios</div>
              <div class="value">${totaisGerais.totalMunicipios}</div>
            </div>
            <div class="resumo-item">
              <div class="label">Total de Emendas</div>
              <div class="value">${emendasFiltradas.length}</div>
            </div>
          </div>
        </div>
        
        ${blocos.map((bloco, index) => `
          <div class="bloco ${index > 0 ? 'page-break' : ''}">
            <div class="bloco-header">
              <h3>${bloco.bloco}</h3>
              <div class="info">
                ${bloco.emendas.length} emendas • ${bloco.totalMunicipios} municípios • 
                Valor Indicado: ${formatarValor(bloco.totalValorIndicado)} • 
                Valor Empenhado: ${formatarValor(bloco.totalValorEmpenhado)} • 
                Valor Pago: ${formatarValor(bloco.totalValorPago)}
              </div>
            </div>
            <div class="bloco-content">
              <table class="emenda-table">
                <thead>
                  <tr>
                    <th>Emenda</th>
                    <th>Município/Beneficiário</th>
                    <th>Valor Indicado</th>
                    <th>Valor a Empenhar</th>
                    ${bloco.bloco === 'BLOCO 3' ? '<th>Conting.17,14%</th>' : ''}
                    <th>Valor Empenhado</th>
                    <th>Valor Pago</th>
                    <th>Saldo MAC</th>
                    <th>Saldo PAP</th>
                    <th>Lideranças</th>
                    <th>Objeto</th>
                  </tr>
                </thead>
                <tbody>
                  ${bloco.emendas.map(emenda => {
                    const saldoMac = saldosBlocos[emenda.municipioBeneficiario || '']?.mac?.saldo || null;
                    const saldoPap = saldosBlocos[emenda.municipioBeneficiario || '']?.pap?.saldo || null;
                    return `
                      <tr>
                        <td>${emenda.emenda || 'N/A'}</td>
                        <td>${emenda.municipioBeneficiario || 'N/A'}</td>
                        <td class="valor">${formatarValor(emenda.valorIndicado)}</td>
                        <td class="valor">${formatarValor(emenda.valorAEmpenhar)}</td>
                        ${bloco.bloco === 'BLOCO 3' && contingenciamentoAtivo ? `<td class="valor">${formatarValor((emenda.valorIndicado || 0) * (17.14 / 100))}</td>` : ''}
                        <td class="valor">${formatarValor(emenda.valorEmpenhado)}</td>
                        <td class="valor">${formatarValor(emenda.valorPago)}</td>
                        <td class="valor">${formatarValor(saldoMac)}</td>
                        <td class="valor">${formatarValor(saldoPap)}</td>
                        <td class="liderancas">${emenda.liderancas || 'N/A'}</td>
                        <td class="objeto">${emenda.objeto || 'N/A'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            Imprimir PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
            Fechar
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar o carregamento e mostrar a janela
    printWindow.onload = () => {
      printWindow.focus();
    };
  };



  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Emendas 2025</span>
              <span className="text-xs text-gray-500 font-light">Carregando dados do Firebase...</span>
            </div>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando dados das emendas...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Emendas 2025</span>
              <span className="text-xs text-red-500 font-light">Erro ao carregar dados</span>
            </div>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <p className="text-lg font-semibold">Erro ao carregar dados</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={() => fetchEmendas(true)} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const totaisGerais = {
    valorIndicado: blocos.reduce((acc, bloco) => acc + bloco.totalValorIndicado, 0),
    valorAEmpenhar: blocos.reduce((acc, bloco) => acc + bloco.totalValorAEmpenhar, 0),
    valorEmpenhado: blocos.reduce((acc, bloco) => acc + bloco.totalValorEmpenhado, 0),
    valorPago: blocos.reduce((acc, bloco) => acc + bloco.totalValorPago, 0),
    totalMunicipios: new Set(emendasFiltradas.map(e => e.municipioBeneficiario).filter(Boolean)).size
  };

  // Função para lidar com clique nos saldos
  const handleCliqueSaldo = (municipio: string) => {
    if (filtroMunicipioSaldo === municipio) {
      // Se clicar no mesmo município, remove o filtro
      setFiltroMunicipioSaldo('');
    } else {
      // Aplica o filtro para o município clicado
      setFiltroMunicipioSaldo(municipio);
    }
  };

  // Função para limpar filtro de saldo
  const limparFiltroSaldo = () => {
    setFiltroMunicipioSaldo('');
  };

  // Função para calcular municípios disponíveis para remanejamento
  const calcularMunicipiosDisponiveis = () => {
    const municipiosComSaldos = Object.keys(saldosBlocos);
    
    return municipiosComSaldos
      .map(municipio => {
        const saldoMac = saldosBlocos[municipio].mac;
        const saldoPap = saldosBlocos[municipio].pap;
        
        return {
          municipio,
          saldoMac: saldoMac.saldo || 0,
          saldoPap: saldoPap.saldo || 0,
          limiteMac: saldoMac.limite || 0,
          limitePap: saldoPap.limite || 0,
          propostasMac: saldoMac.propostas || 0,
          propostasPap: saldoPap.propostas || 0,
          // Calcular percentual de utilização
          percentualMac: saldoMac.limite ? ((saldoMac.propostas / saldoMac.limite) * 100) : 0,
          percentualPap: saldoPap.limite ? ((saldoPap.propostas / saldoPap.limite) * 100) : 0
        };
      })
      .filter(m => m.saldoMac > 0 || m.saldoPap > 0) // Apenas municípios com saldo disponível
      .sort((a, b) => {
        // Ordenar por maior saldo disponível primeiro
        const saldoTotalA = a.saldoMac + a.saldoPap;
        const saldoTotalB = b.saldoMac + b.saldoPap;
        return saldoTotalB - saldoTotalA;
      });
  };



  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <PageLoading message="Carregando emendas..." />
        ) : error ? (
          <div className="text-center text-red-500 mt-8">
            <p>{error}</p>
            <Button onClick={() => fetchEmendas(true)} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {isRefreshing && <PageLoading message="Atualizando emendas..." />}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-lg font-semibold text-gray-900">Emendas 2025</h1>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => fetchEmendas(true)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Atualizar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={expandirTodosBlocos}
                  disabled={isRefreshing}
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="ml-2">Expandir Todos</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={recolherTodosBlocos}
                  disabled={isRefreshing}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="ml-2">Recolher Todos</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={imprimirEmendasPDF}
                  disabled={isRefreshing}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <Printer className="h-4 w-4" />
                  <span className="ml-2">Imprimir PDF</span>
                </Button>
                <Button
                  variant={contingenciamentoAtivo ? "default" : "outline"}
                  onClick={() => setContingenciamentoAtivo(!contingenciamentoAtivo)}
                  disabled={isRefreshing}
                  className={contingenciamentoAtivo ? "bg-orange-600 hover:bg-orange-700 text-white" : "border-orange-200 text-orange-700 hover:bg-orange-50"}
                >
                  <Shield className="h-4 w-4" />
                  <span className="ml-2">
                    {contingenciamentoAtivo ? "Contingenciamento Ativo" : "Contingenciamento Inativo"}
                  </span>
                </Button>

              </div>
            </div>

            {/* Resumo geral */}
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium">Resumo Geral</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total Indicado</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatarValor(totaisGerais.valorIndicado)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total a Empenhar</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">{formatarValor(totaisGerais.valorAEmpenhar)}</p>
                    <BarraProgresso 
                      valor={totaisGerais.valorAEmpenhar} 
                      total={totaisGerais.valorIndicado} 
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total Empenhado</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">{formatarValor(totaisGerais.valorEmpenhado)}</p>
                    <BarraProgresso 
                      valor={totaisGerais.valorEmpenhado} 
                      total={totaisGerais.valorIndicado} 
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total Pago</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">{formatarValor(totaisGerais.valorPago)}</p>
                    <BarraProgresso 
                      valor={totaisGerais.valorPago} 
                      total={totaisGerais.valorIndicado} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Filtros</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
                    className="h-6 w-6 p-0"
                  >
                    {filtrosVisiveis ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {filtrosVisiveis && (
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select
                        value={filtroBloco}
                        onValueChange={setFiltroBloco}
                        disabled={isRefreshing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por bloco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODOS_BLOCOS">Todos os blocos</SelectItem>
                          {blocos.map((bloco) => (
                            <SelectItem key={bloco.bloco} value={bloco.bloco}>
                              {bloco.bloco}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select
                        value={filtroMunicipio}
                        onValueChange={setFiltroMunicipio}
                        disabled={isRefreshing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por município" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODOS_MUNICIPIOS">Todos os municípios</SelectItem>
                          {Array.from(new Set(emendas
                            .map(e => e.municipioBeneficiario?.toUpperCase().trim())
                            .filter((municipio): municipio is string => 
                              municipio !== null && municipio !== undefined && municipio !== ''
                            )
                          ))
                          .sort((a, b) => a.localeCompare(b, 'pt-BR', { 
                            sensitivity: 'base', 
                            ignorePunctuation: true,
                            numeric: true 
                          }))
                          .map(municipio => {
                            // Encontrar a primeira ocorrência do município para manter a capitalização original
                            const municipioOriginal = emendas.find(e => 
                              e.municipioBeneficiario?.toUpperCase().trim() === municipio
                            )?.municipioBeneficiario || municipio;
                            
                            return (
                              <SelectItem key={municipio} value={municipioOriginal}>
                                {municipioOriginal}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select
                        value={filtroEmenda}
                        onValueChange={setFiltroEmenda}
                        disabled={isRefreshing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por emenda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODAS_EMENDAS">Todas as emendas</SelectItem>
                          {emendasDisponiveis.map(emenda => (
                            <SelectItem key={emenda} value={emenda}>
                              {emenda}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select
                        value={filtroStatusEmpenho}
                        onValueChange={setFiltroStatusEmpenho}
                        disabled={isRefreshing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status do Empenho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODOS_STATUS">Todos os status</SelectItem>
                          <SelectItem value="EMPENHADO">Empenhado</SelectItem>
                          <SelectItem value="A_EMPENHAR">A Empenhar</SelectItem>
                          <SelectItem value="PAGO">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Cards de Saldo MAC e PAP */}
            {(() => {
              // Mostrar cards apenas se há saldos calculados para blocos 2 e 3
              const municipiosComSaldos = Object.keys(saldosBlocos);
              
              if (municipiosComSaldos.length > 0) {
                // Se há filtro por município dos saldos, mostrar apenas esse município
                let municipiosParaCalcular = municipiosComSaldos;
                let tituloCards = `Blocos 2 e 3 (${municipiosComSaldos.length} municípios)`;

                if (filtroMunicipioSaldo) {
                  municipiosParaCalcular = municipiosComSaldos.filter(municipio => 
                    municipio.trim().toUpperCase() === filtroMunicipioSaldo.trim().toUpperCase()
                  );
                  tituloCards = `Município: ${filtroMunicipioSaldo}`;
                }

                // Calcular totais dos municípios selecionados
                const totaisMac = municipiosParaCalcular.reduce((acc, municipio) => {
                  const saldo = saldosBlocos[municipio].mac;
                  return {
                    limite: (acc.limite || 0) + (saldo.limite || 0),
                    propostas: acc.propostas + (saldo.propostas || 0),
                    valorPagar: acc.valorPagar + (saldo.valorPagar || 0),
                    saldo: (acc.saldo || 0) + (saldo.saldo || 0)
                  };
                }, { limite: 0, propostas: 0, valorPagar: 0, saldo: 0 });

                const totaisPap = municipiosParaCalcular.reduce((acc, municipio) => {
                  const saldo = saldosBlocos[municipio].pap;
                  return {
                    limite: (acc.limite || 0) + (saldo.limite || 0),
                    propostas: acc.propostas + (saldo.propostas || 0),
                    valorPagar: acc.valorPagar + (saldo.valorPagar || 0),
                    saldo: (acc.saldo || 0) + (saldo.saldo || 0)
                  };
                }, { limite: 0, propostas: 0, valorPagar: 0, saldo: 0 });

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Card MAC */}
                    <Card className="border-gray-200 bg-gray-50">
                      <CardHeader className="py-2 pb-1">
                        <CardTitle className="text-xs font-medium text-gray-700">
                          MAC - {tituloCards}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Limite</p>
                            <p className="font-semibold text-gray-900">
                              {formatarValor(totaisMac.limite)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Propostas</p>
                            <p className="font-semibold text-gray-900">{formatarValor(totaisMac.propostas)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">A Pagar</p>
                            <p className="font-semibold text-gray-900">{formatarValor(totaisMac.valorPagar)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Saldo</p>
                            <p className={`font-semibold ${totaisMac.saldo < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatarValor(totaisMac.saldo)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card PAP */}
                    <Card className="border-gray-200 bg-gray-50">
                      <CardHeader className="py-2 pb-1">
                        <CardTitle className="text-xs font-medium text-gray-700">
                          PAP - {tituloCards}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Limite</p>
                            <p className="font-semibold text-gray-900">
                              {formatarValor(totaisPap.limite)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Propostas</p>
                            <p className="font-semibold text-gray-900">{formatarValor(totaisPap.propostas)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">A Pagar</p>
                            <p className="font-semibold text-gray-900">{formatarValor(totaisPap.valorPagar)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Saldo</p>
                            <p className={`font-semibold ${totaisPap.saldo < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatarValor(totaisPap.saldo)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              }
              return null;
            })()}

            {/* Indicador de filtro por município dos saldos */}
            {filtroMunicipioSaldo && (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">
                        Filtrado: <span className="font-semibold">{filtroMunicipioSaldo}</span>
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={limparFiltroSaldo}
                      className="h-5 px-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                      <span className="ml-1 text-xs">Limpar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botão para mostrar municípios disponíveis para remanejamento */}
            {Object.keys(saldosBlocos).length > 0 && (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">
                        Municípios disponíveis para remanejamento
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarMunicipiosDisponiveis(!mostrarMunicipiosDisponiveis)}
                      className="h-5 px-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      {mostrarMunicipiosDisponiveis ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      <span className="ml-1 text-xs">
                        {mostrarMunicipiosDisponiveis ? 'Ocultar' : 'Mostrar'}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de municípios disponíveis para remanejamento */}
            {mostrarMunicipiosDisponiveis && Object.keys(saldosBlocos).length > 0 && (
              <Card className="border-gray-200">
                <CardContent className="py-3">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Municípios com saldo disponível (ordenados por maior disponibilidade):
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {calcularMunicipiosDisponiveis().map((municipio, index) => (
                        <div 
                          key={municipio.municipio}
                          className="border border-gray-200 rounded p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleCliqueSaldo(municipio.municipio)}
                          title="Clique para filtrar por este município"
                        >
                          <div className="text-xs font-semibold text-gray-900 mb-1">
                            {municipio.municipio}
                          </div>
                          
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">MAC:</span>
                              <span className={`font-medium ${municipio.saldoMac > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {formatarValor(municipio.saldoMac)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">PAP:</span>
                              <span className={`font-medium ${municipio.saldoPap > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {formatarValor(municipio.saldoPap)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className={`font-semibold ${(municipio.saldoMac + municipio.saldoPap) > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                {formatarValor(municipio.saldoMac + municipio.saldoPap)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Barras de progresso para visualização rápida */}
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">MAC</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1">
                                <div 
                                  className={`h-1 rounded-full ${municipio.percentualMac > 90 ? 'bg-red-500' : municipio.percentualMac > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(municipio.percentualMac, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{municipio.percentualMac.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">PAP</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1">
                                <div 
                                  className={`h-1 rounded-full ${municipio.percentualPap > 90 ? 'bg-red-500' : municipio.percentualPap > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(municipio.percentualPap, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{municipio.percentualPap.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {calcularMunicipiosDisponiveis().length === 0 && (
                      <div className="text-center text-gray-500 text-sm py-4">
                        Nenhum município com saldo disponível encontrado.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blocos de emendas */}
            <div className="space-y-2">
              {blocos.map((bloco) => (
                <div key={bloco.bloco} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Cabeçalho do bloco */}
                  <div 
                    className="p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleBloco(bloco.bloco)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                      <div className="flex items-center gap-2">
                        {blocosExpandidos.has(bloco.bloco) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <h3 className="text-sm font-medium text-gray-900">{bloco.bloco}</h3>
                        {isBlocoTotalmentePago(bloco) && (
                          <div title="Bloco 100% pago">
                            <CheckCircle2 className="h-4 w-4 text-green-600 opacity-70" />
                          </div>
                        )}
                        <span className="text-xs text-gray-500">
                          ({bloco.emendas.length} emendas • {bloco.totalMunicipios} municípios)
                        </span>
                      </div>
                      
                      {/* Menu de contexto para exportação */}
                      <div className="flex items-center gap-2">
                        <div className="hidden md:flex md:gap-2 text-sm">
                          <div className="w-36">
                            <span className="text-gray-500 text-sm">Valor Indicado:</span>
                            <span className="block font-medium text-gray-900 text-xs">
                              {formatarValor(bloco.totalValorIndicado)}
                            </span>
                          </div>
                          {bloco.bloco === 'BLOCO 3' && contingenciamentoAtivo && (
                            <div className="w-36">
                              <span className="text-gray-500 text-sm">Conting.17,14%:</span>
                              <span className="block font-medium text-orange-700 text-xs">
                                {formatarValor(bloco.totalValorContingenciado)}
                              </span>
                            </div>
                          )}
                          <div className="w-36">
                            <span className="text-gray-500 text-sm">Empenhado:</span>
                            <span className="block font-medium text-gray-900 mb-1 text-xs">
                              {formatarValor(bloco.totalValorEmpenhado)}
                            </span>
                            <div className="w-full">
                              <BarraProgresso 
                                valor={bloco.totalValorEmpenhado} 
                                total={bloco.totalValorIndicado}
                                className="h-1"
                              />
                            </div>
                          </div>
                          <div className="w-36">
                            <span className="text-gray-500 text-sm">A Empenhar:</span>
                            <span className="block font-medium text-gray-900 mb-1 text-xs">
                              {formatarValor(bloco.totalValorAEmpenhar)}
                            </span>
                            <div className="w-full">
                              <BarraProgresso 
                                valor={bloco.totalValorAEmpenhar} 
                                total={bloco.totalValorIndicado}
                                className="h-1"
                              />
                            </div>
                          </div>
                          <div className="w-36">
                            <span className="text-gray-500 text-sm">Valor Pago:</span>
                            <span className="block font-medium text-gray-900 mb-1 text-xs">
                              {formatarValor(bloco.totalValorPago)}
                            </span>
                            <div className="w-full">
                              <BarraProgresso 
                                valor={bloco.totalValorPago} 
                                total={bloco.totalValorIndicado}
                                className="h-1"
                                tipo="pago"
                              />
                            </div>
                          </div>
                        </div>
                        

                      </div>
                    </div>
                  </div>

                  {/* Conteúdo do bloco */}
                  {blocosExpandidos.has(bloco.bloco) && (
                    <div className="overflow-x-auto">
                      {/* Layout para desktop */}
                      <div className="hidden md:block">
                        <EmendasTable
                          data={bloco.emendas}
                          blocoName={bloco.bloco}
                          ordenacaoAtual={ordenacaoAtual}
                          onDoubleClick={handleDuploClic}
                          saldosBlocos={saldosBlocos}
                          onCliqueSaldo={handleCliqueSaldo}
                          contingenciamentoAtivo={contingenciamentoAtivo}
                        />
                      </div>

                      {/* Layout de cards para mobile */}
                      <div className="block md:hidden">
                        <div className="divide-y divide-gray-200">
                          {bloco.emendas.map((emenda, index) => (
                            <div 
                              key={emenda.id || index}
                              className="p-2 hover:bg-gray-50"
                              onClick={() => handleDuploClic(emenda)}
                            >
                              <div className="space-y-2">
                                {/* Emenda e Município */}
                                <div>
                                  <div className="font-medium text-gray-900">{emenda.emenda || 'N/A'}</div>
                                  <div className="text-sm text-gray-600">{emenda.municipioBeneficiario || 'N/A'}</div>
                                </div>

                                {/* Valores em grid */}
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <div className="text-gray-500 text-xs">Valor Indicado</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorIndicado)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 text-xs">A Empenhar</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorAEmpenhar)}</div>
                                  </div>
                                  {bloco.bloco === 'BLOCO 3' && contingenciamentoAtivo && (
                                    <div>
                                      <div className="text-gray-500 text-xs">Conting.17,14%</div>
                                      <div className="font-medium text-orange-700 bg-orange-50 px-1 rounded">
                                        {formatarValor((emenda.valorIndicado || 0) * (17.14 / 100))}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-gray-500 text-xs">Empenhado</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorEmpenhado)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 text-xs">Valor Pago</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorPago)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 text-xs">Saldo MAC</div>
                                    <div 
                                      className="font-medium text-gray-900 cursor-pointer hover:text-blue-700 transition-colors"
                                      onClick={() => handleCliqueSaldo(emenda.municipioBeneficiario || '')}
                                      title="Clique para filtrar por este município"
                                    >
                                      {formatarValor(saldosBlocos[emenda.municipioBeneficiario || '']?.mac?.saldo || null)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 text-xs">Saldo PAP</div>
                                    <div 
                                      className="font-medium text-gray-900 cursor-pointer hover:text-green-700 transition-colors"
                                      onClick={() => handleCliqueSaldo(emenda.municipioBeneficiario || '')}
                                      title="Clique para filtrar por este município"
                                    >
                                      {formatarValor(saldosBlocos[emenda.municipioBeneficiario || '']?.pap?.saldo || null)}
                                    </div>
                                  </div>
                                </div>

                                {/* Lideranças */}
                                {emenda.liderancas && (
                                  <div>
                                    <div className="text-gray-500 text-xs mb-1">Lideranças</div>
                                    <div className="text-sm text-gray-900">{emenda.liderancas}</div>
                                  </div>
                                )}

                                {/* Objeto */}
                                {emenda.objeto && (
                                  <div>
                                    <div className="text-gray-500 text-xs mb-1">Objeto</div>
                                    <div className="text-sm text-gray-900">{emenda.objeto}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {emendasFiltradas.length === 0 && !isLoading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Nenhuma emenda encontrada com os filtros aplicados.</p>
                <Button onClick={limparFiltros} className="mt-4" variant="outline">
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>

          {/* Modal de edição */}
          <Dialog open={modalAberto} onOpenChange={fecharModalEdicao}>
            <DialogContent className="max-w-[900px] w-[90vw]">
              <DialogHeader>
                <DialogTitle>Editar Emenda</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 py-2 max-h-[80vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  {/* Coluna 1 */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="bloco" className="text-right text-sm">
                        Bloco
                      </Label>
                      <Input
                        id="bloco"
                        value={dadosEdicao.bloco || ''}
                        onChange={(e) => handleCampoEdicao('bloco', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="emenda" className="text-right text-sm">
                        Emenda
                      </Label>
                      <Input
                        id="emenda"
                        value={dadosEdicao.emenda || ''}
                        onChange={(e) => handleCampoEdicao('emenda', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="municipioBeneficiario" className="text-right text-sm">
                        Município/Beneficiário
                      </Label>
                      <Input
                        id="municipioBeneficiario"
                        value={dadosEdicao.municipioBeneficiario || ''}
                        onChange={(e) => handleCampoEdicao('municipioBeneficiario', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="funcional" className="text-right text-sm">
                        Funcional
                      </Label>
                      <Input
                        id="funcional"
                        value={dadosEdicao.funcional || ''}
                        onChange={(e) => handleCampoEdicao('funcional', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="gnd" className="text-right text-sm">
                        GND
                      </Label>
                      <Input
                        id="gnd"
                        value={dadosEdicao.gnd || ''}
                        onChange={(e) => handleCampoEdicao('gnd', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="valorIndicado" className="text-right text-sm">
                        Valor Indicado
                      </Label>
                      <Input
                        id="valorIndicado"
                        type="number"
                        value={dadosEdicao.valorIndicado || ''}
                        onChange={(e) => handleCampoEdicao('valorIndicado', Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="valorEmpenhado" className="text-right text-sm">
                        Valor Empenhado
                      </Label>
                      <Input
                        id="valorEmpenhado"
                        type="number"
                        value={dadosEdicao.valorEmpenhado || ''}
                        onChange={(e) => handleCampoEdicao('valorEmpenhado', Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="valorAEmpenhar" className="text-right text-sm">
                        Valor a Empenhar
                      </Label>
                      <Input
                        id="valorAEmpenhar"
                        type="number"
                        value={dadosEdicao.valorAEmpenhar || ''}
                        disabled
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Coluna 2 */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="valorPago" className="text-right text-sm">
                        Valor Pago
                      </Label>
                      <Input
                        id="valorPago"
                        type="number"
                        value={dadosEdicao.valorPago || ''}
                        onChange={(e) => handleCampoEdicao('valorPago', Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="valorASerPago" className="text-right text-sm">
                        Valor a Ser Pago
                      </Label>
                      <Input
                        id="valorASerPago"
                        type="number"
                        value={dadosEdicao.valorASerPago || ''}
                        onChange={(e) => handleCampoEdicao('valorASerPago', Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="empenho" className="text-right text-sm">
                        Empenho
                      </Label>
                      <Input
                        id="empenho"
                        value={dadosEdicao.empenho || ''}
                        onChange={(e) => handleCampoEdicao('empenho', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="dataEmpenho" className="text-right text-sm">
                        Data do Empenho
                      </Label>
                      <Input
                        id="dataEmpenho"
                        type="date"
                        value={dadosEdicao.dataEmpenho?.split('T')[0] || ''}
                        onChange={(e) => handleCampoEdicao('dataEmpenho', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="portariaConvenioContrato" className="text-right text-sm">
                        Portaria/Convênio
                      </Label>
                      <Input
                        id="portariaConvenioContrato"
                        value={dadosEdicao.portariaConvenioContrato || ''}
                        onChange={(e) => handleCampoEdicao('portariaConvenioContrato', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="numeroProposta" className="text-right text-sm">
                        Nº da Proposta
                      </Label>
                      <Input
                        id="numeroProposta"
                        value={dadosEdicao.numeroProposta || ''}
                        onChange={(e) => handleCampoEdicao('numeroProposta', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="pagamento" className="text-right text-sm">
                        Pagamento
                      </Label>
                      <Input
                        id="pagamento"
                        value={dadosEdicao.pagamento || ''}
                        onChange={(e) => handleCampoEdicao('pagamento', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                      <Label htmlFor="liderancas" className="text-right text-sm">
                        Lideranças
                      </Label>
                      <Input
                        id="liderancas"
                        value={dadosEdicao.liderancas || ''}
                        onChange={(e) => handleCampoEdicao('liderancas', e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Campos que ocupam largura total */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-1">
                    <Label htmlFor="alteracao" className="text-right text-sm">
                      Alteração
                    </Label>
                    <Input
                      id="alteracao"
                      value={dadosEdicao.alteracao || ''}
                      onChange={(e) => handleCampoEdicao('alteracao', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-start gap-1">
                    <Label htmlFor="objeto" className="text-right text-sm pt-1.5">
                      Objeto
                    </Label>
                    <Textarea
                      id="objeto"
                      value={dadosEdicao.objeto || ''}
                      onChange={(e) => handleCampoEdicao('objeto', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={fecharModalEdicao}>
                  Cancelar
                </Button>
                <Button 
                  onClick={salvarEdicao} 
                  disabled={salvandoEdicao}
                >
                  {salvandoEdicao ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Mensagem quando não há resultados */}
          {emendasFiltradas.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma emenda encontrada com os filtros atuais.</p>
              <Button onClick={limparFiltros} className="mt-4">
                Limpar Filtros
              </Button>
            </div>
          )}
        </>
      )}
      </div>

      <style jsx>{`
        @keyframes progress-fill {
          from {
            width: 0%;
          }
          to {
            width: var(--final-width);
          }
        }
      `}</style>
    </>
  );
} 