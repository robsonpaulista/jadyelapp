'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Search, Filter, ChevronDown, ChevronRight, DollarSign, TrendingUp, CheckCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LoadingOverlay } from "@/components/ui/loading";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Save,
  X
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';

interface Emenda {
  id: string;
  bloco: string | null;
  emenda: string | null;
  municipioBeneficiario: string | null;
  funcional: string | null;
  gnd: string | null;
  valorIndicado: number | null;
  objeto: string | null;
  alteracao: string | null;
  numeroProposta: string | null;
  valorEmpenhado: number | null;
  empenho: string | null;
  dataEmpenho: string | null;
  portariaConvenioContrato: string | null;
  valorAEmpenhar: number | null;
  pagamento: string | null;
  valorPago: number | null;
  valorASerPago: number | null;
  liderancas: string | null;
  createdAt: any;
  updatedAt: any;
}

interface BlocoData {
  bloco: string;
  emendas: Emenda[];
  totalValorIndicado: number;
  totalValorAEmpenhar: number;
  totalValorEmpenhado: number;
  totalValorPago: number;
  totalMunicipios: number;
}

export default function Emendas2025() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emendas, setEmendas] = useState<Emenda[]>([]);
  const [emendasFiltradas, setEmendasFiltradas] = useState<Emenda[]>([]);
  const [blocos, setBlocos] = useState<BlocoData[]>([]);
  const [blocosExpandidos, setBlocosExpandidos] = useState<Set<string>>(new Set());
  
  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroBloco, setFiltroBloco] = useState('TODOS_BLOCOS');
  const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS_MUNICIPIOS');
  const [filtroEmenda, setFiltroEmenda] = useState('TODAS_EMENDAS');
  
  // Ordenação
  const [ordenacaoAtual, setOrdenacaoAtual] = useState<{campo: string, direcao: 'asc' | 'desc'} | null>(null);

  // Estados do modal de edição
  const [modalAberto, setModalAberto] = useState(false);
  const [emendaEditando, setEmendaEditando] = useState<Emenda | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState<Partial<Emenda>>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

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
        setEmendas(prev => prev.map(emenda => 
          emenda.id === dadosEdicao.id ? emendaAtualizada : emenda
        ));
        
        // Reprocessar filtros com dados atualizados
        const novasEmendas = emendas.map(emenda => 
          emenda.id === dadosEdicao.id ? emendaAtualizada : emenda
        );
        setEmendasFiltradas(novasEmendas);
        processarBlocos(novasEmendas);
        
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
      const municipiosUnicos = new Set(emendasOrdenadas.map(e => e.municipioBeneficiario).filter(Boolean));
      
      return {
        bloco,
        emendas: emendasOrdenadas,
        totalValorIndicado,
        totalValorAEmpenhar,
        totalValorEmpenhado,
        totalValorPago: emendasOrdenadas.reduce((acc, emenda) => acc + (emenda.valorPago || 0), 0),
        totalMunicipios: municipiosUnicos.size
      };
    });

    // Ordenar blocos
    blocosProcessados.sort((a, b) => a.bloco.localeCompare(b.bloco));
    setBlocos(blocosProcessados);
  };

  // Aplicar filtros
  useEffect(() => {
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

      // Filtro por texto
      if (filtroTexto) {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          emenda.emenda?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
          emenda.municipioBeneficiario?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
          emenda.liderancas?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
          emenda.objeto?.toLowerCase().includes(filtroTexto.toLowerCase())
        );
      }

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

      // Adiciona as emendas filtradas ao resultado final
      dadosFiltrados.push(...emendasFiltradas);
    });

    setEmendasFiltradas(dadosFiltrados);
    processarBlocos(dadosFiltrados);
  }, [emendas, filtroTexto, filtroBloco, filtroMunicipio, filtroEmenda, ordenacaoAtual]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchEmendas();
  }, []);

  const formatarValor = (valor: number | null) => {
    if (!valor || valor === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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
    setFiltroTexto('');
    setFiltroBloco('TODOS_BLOCOS');
    setFiltroMunicipio('TODOS_MUNICIPIOS');
    setFiltroEmenda('TODAS_EMENDAS');
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
  const blocosDisponiveis = Array.from(new Set(emendas.map(e => e.bloco).filter((bloco): bloco is string => Boolean(bloco)))).sort();
  
  // Normaliza os municípios antes de criar o Set para evitar duplicatas por case ou espaços
  const municipiosNormalizados = emendas
    .map(e => e.municipioBeneficiario?.trim().toUpperCase())
    .filter((municipio): municipio is string => Boolean(municipio));
  const municipiosUnicos = Array.from(new Set(municipiosNormalizados));
  const municipiosDisponiveis = municipiosUnicos
    .map(m => emendas.find(e => e.municipioBeneficiario?.trim().toUpperCase() === m)?.municipioBeneficiario?.trim() || m)
    .sort();
  
  const emendasDisponiveis = Array.from(new Set(emendas.map(e => e.emenda).filter((emenda): emenda is string => Boolean(emenda)))).sort();

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <LoadingOverlay message="Carregando emendas..." />
      ) : error ? (
        <div className="text-center text-red-500 mt-8">
          <p>{error}</p>
          <Button onClick={() => fetchEmendas(true)} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {isRefreshing && <LoadingOverlay message="Atualizando emendas..." />}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center py-3">
              <h1 className="text-lg font-semibold text-gray-900">Emendas 2025</h1>
              <div className="flex gap-2">
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
              </div>
            </div>

            {/* Resumo geral */}
            <Card className="mt-2">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Resumo Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total Indicado</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorIndicado)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total a Empenhar</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorAEmpenhar)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total Empenhado</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorEmpenhado)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-600">Valor Total Pago</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorPago)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card className="mt-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar..."
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      disabled={isRefreshing}
                      className="w-full"
                    />
                  </div>

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
                        .sort()
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
                    <Button
                      variant="outline"
                      onClick={limparFiltros}
                      disabled={isRefreshing}
                      className="w-full justify-center"
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-2">Limpar Filtros</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blocos das emendas */}
            <div className="space-y-4">
              {blocos.map((bloco) => (
                <div key={bloco.bloco} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Cabeçalho do bloco */}
                  <div 
                    className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleBloco(bloco.bloco)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                      <div className="flex items-center gap-2">
                        {blocosExpandidos.has(bloco.bloco) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <h3 className="text-sm font-medium text-gray-900">{bloco.bloco}</h3>
                        <span className="text-xs text-gray-500">
                          ({bloco.emendas.length} emendas • {bloco.totalMunicipios} municípios)
                        </span>
                      </div>
                      <div className="hidden md:grid md:grid-cols-4 gap-8 text-sm">
                        <div className="w-[200px]">
                          <span className="text-gray-500 text-sm">Valor Indicado:</span>
                          <span className="block font-medium text-gray-900">
                            {formatarValor(bloco.totalValorIndicado)}
                          </span>
                        </div>
                        <div className="w-[200px]">
                          <span className="text-gray-500 text-sm">Empenhado:</span>
                          <span className="block font-medium text-gray-900">
                            {formatarValor(bloco.totalValorEmpenhado)}
                          </span>
                        </div>
                        <div className="w-[200px]">
                          <span className="text-gray-500 text-sm">A Empenhar:</span>
                          <span className="block font-medium text-gray-900">
                            {formatarValor(bloco.totalValorAEmpenhar)}
                          </span>
                        </div>
                        <div className="w-[200px]">
                          <span className="text-gray-500 text-sm">Valor Pago:</span>
                          <span className="block font-medium text-gray-900">
                            {formatarValor(bloco.totalValorPago)}
                          </span>
                        </div>
                      </div>
                      {/* Layout mobile */}
                      <div className="grid grid-cols-2 gap-4 md:hidden text-sm pl-8">
                        <div>
                          <span className="block text-gray-500 text-xs mb-1">Valor Indicado:</span>
                          <span className="font-medium text-gray-900">
                            {formatarValor(bloco.totalValorIndicado)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-xs mb-1">Empenhado:</span>
                          <span className="font-medium text-gray-900">
                            {formatarValor(bloco.totalValorEmpenhado)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-xs mb-1">A Empenhar:</span>
                          <span className="font-medium text-gray-900">
                            {formatarValor(bloco.totalValorAEmpenhar)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-xs mb-1">Valor Pago:</span>
                          <span className="font-medium text-gray-900">
                            {formatarValor(bloco.totalValorPago)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo do bloco */}
                  {blocosExpandidos.has(bloco.bloco) && (
                    <div className="overflow-x-auto">
                      {/* Layout para desktop */}
                      <div className="hidden md:block">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('emenda')}>
                                Emenda {obterIconeOrdenacao('emenda')}
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('municipioBeneficiario')}>
                                Município/Beneficiário {obterIconeOrdenacao('municipioBeneficiario')}
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('valorIndicado')}>
                                Valor Indicado {obterIconeOrdenacao('valorIndicado')}
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('valorAEmpenhar')}>
                                Valor a Empenhar {obterIconeOrdenacao('valorAEmpenhar')}
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('valorEmpenhado')}>
                                Valor Empenhado {obterIconeOrdenacao('valorEmpenhado')}
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('valorPago')}>
                                Valor Pago {obterIconeOrdenacao('valorPago')}
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('liderancas')}>
                                Lideranças {obterIconeOrdenacao('liderancas')}
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => ordenarPorCampo('objeto')}>
                                Objeto {obterIconeOrdenacao('objeto')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {bloco.emendas.map((emenda, index) => (
                              <tr 
                                key={emenda.id || index} 
                                className="hover:bg-gray-50 cursor-pointer"
                                onDoubleClick={() => handleDuploClic(emenda)}
                                title="Duplo clique para editar"
                              >
                                <td className="px-4 py-3 font-medium text-gray-900">{emenda.emenda || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-900">{emenda.municipioBeneficiario || 'N/A'}</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatarValor(emenda.valorIndicado)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatarValor(emenda.valorAEmpenhar)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatarValor(emenda.valorEmpenhado)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatarValor(emenda.valorPago)}
                                </td>
                                <td className="px-4 py-3 text-gray-900">{emenda.liderancas || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-900 max-w-xs truncate" title={emenda.objeto || ''}>
                                  {emenda.objeto || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Layout de cards para mobile */}
                      <div className="block md:hidden">
                        <div className="divide-y divide-gray-200">
                          {bloco.emendas.map((emenda, index) => (
                            <div 
                              key={emenda.id || index}
                              className="p-4 hover:bg-gray-50"
                              onClick={() => handleDuploClic(emenda)}
                            >
                              <div className="space-y-3">
                                {/* Emenda e Município */}
                                <div>
                                  <div className="font-medium text-gray-900">{emenda.emenda || 'N/A'}</div>
                                  <div className="text-sm text-gray-600">{emenda.municipioBeneficiario || 'N/A'}</div>
                                </div>

                                {/* Valores em grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <div className="text-gray-500 text-xs">Valor Indicado</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorIndicado)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 text-xs">A Empenhar</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorAEmpenhar)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 text-xs">Empenhado</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorEmpenhado)}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 text-xs">Valor Pago</div>
                                    <div className="font-medium text-gray-900">{formatarValor(emenda.valorPago)}</div>
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
  );
} 