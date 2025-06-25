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
  totalMunicipios: number;
}

export default function Emendas2025() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emendas, setEmendas] = useState<Emenda[]>([]);
  const [emendasFiltradas, setEmendasFiltradas] = useState<Emenda[]>([]);
  const [blocos, setBlocos] = useState<BlocoData[]>([]);
  const [blocosExpandidos, setBlocosExpandidos] = useState<Set<string>>(new Set(['BLOCO 1']));
  
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
  const fetchEmendas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/emendas');
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log('Dados recebidos da API Firebase:', data);
      
      if (data.success && data.emendas) {
        setEmendas(data.emendas);
        setEmendasFiltradas(data.emendas);
        processarBlocos(data.emendas);
        toast.success(`${data.emendas.length} emendas carregadas com sucesso do Firebase!`);
      } else {
        throw new Error(data.error || 'Erro ao carregar dados das emendas');
      }
    } catch (error: any) {
      console.error('Erro ao buscar emendas:', error);
      setError(error.message || 'Erro ao carregar dados das emendas');
      toast.error('Erro ao buscar dados. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
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
        
        // Atualizar a lista local
        setEmendas(prev => prev.map(emenda => 
          emenda.id === dadosEdicao.id ? {...emenda, ...dadosEdicao} : emenda
        ));
        
        // Reprocessar filtros
        fetchEmendas();
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
      const municipiosUnicos = new Set(emendasOrdenadas.map(e => e.municipioBeneficiario).filter(Boolean));
      
      return {
        bloco,
        emendas: emendasOrdenadas,
        totalValorIndicado,
        totalValorAEmpenhar,
        totalMunicipios: municipiosUnicos.size
      };
    });

    // Ordenar blocos
    blocosProcessados.sort((a, b) => a.bloco.localeCompare(b.bloco));
    setBlocos(blocosProcessados);
  };

  // Aplicar filtros
  useEffect(() => {
    let dados = [...emendas];

    // Filtro por texto
    if (filtroTexto) {
      dados = dados.filter(emenda => 
        emenda.emenda?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        emenda.municipioBeneficiario?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        emenda.liderancas?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        emenda.objeto?.toLowerCase().includes(filtroTexto.toLowerCase())
      );
    }

    // Filtro por bloco
    if (filtroBloco && filtroBloco !== 'TODOS_BLOCOS') {
      dados = dados.filter(emenda => emenda.bloco === filtroBloco);
    }

    // Filtro por município
    if (filtroMunicipio && filtroMunicipio !== 'TODOS_MUNICIPIOS') {
      dados = dados.filter(emenda => emenda.municipioBeneficiario === filtroMunicipio);
    }

    // Filtro por emenda
    if (filtroEmenda && filtroEmenda !== 'TODAS_EMENDAS') {
      dados = dados.filter(emenda => emenda.emenda === filtroEmenda);
    }

    setEmendasFiltradas(dados);
    processarBlocos(dados);
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

  // Obter listas para filtros
  const blocosDisponiveis = Array.from(new Set(emendas.map(e => e.bloco).filter((bloco): bloco is string => Boolean(bloco)))).sort();
  const municipiosDisponiveis = Array.from(new Set(emendas.map(e => e.municipioBeneficiario).filter((municipio): municipio is string => Boolean(municipio)))).sort();
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
      <div className="flex-1 flex flex-col min-h-screen">
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
      <div className="flex-1 flex flex-col min-h-screen">
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
            <Button onClick={() => fetchEmendas()} className="bg-blue-600 hover:bg-blue-700">
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
    valorEmpenhado: emendasFiltradas.reduce((acc, emenda) => acc + (emenda.valorEmpenhado || 0), 0),
    valorPago: emendasFiltradas.reduce((acc, emenda) => acc + (emenda.valorPago || 0), 0),
    totalMunicipios: new Set(emendasFiltradas.map(e => e.municipioBeneficiario).filter(Boolean)).size
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Emendas 2025 - Firebase</span>
            <span className="text-xs text-gray-500 font-light">
              {blocos.length} bloco(s) • {totaisGerais.totalMunicipios} municípios • Dados do Firebase
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={corrigirValoresAEmpenhar}
              variant="destructive"
              size="sm"
            >
              Corrigir valores a empenhar
            </Button>
            <Button
              onClick={expandirTodosBlocos}
              variant="outline"
              size="sm"
            >
              Expandir Todos
            </Button>
            <Button
              onClick={recolherTodosBlocos}
              variant="outline"
              size="sm"
            >
              Recolher Todos
            </Button>
            <Button
              onClick={fetchEmendas}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="p-6 w-full flex-1">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
              <Button
                onClick={limparFiltros}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Limpar Filtros
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar texto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por emenda, município, lideranças..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bloco</label>
                <Select value={filtroBloco} onValueChange={setFiltroBloco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os blocos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS_BLOCOS">Todos os blocos</SelectItem>
                    {blocosDisponiveis.map(bloco => (
                      <SelectItem key={bloco} value={bloco}>{bloco}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Município</label>
                <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os municípios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS_MUNICIPIOS">Todos os municípios</SelectItem>
                    {municipiosDisponiveis.map(municipio => (
                      <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emenda</label>
                <Select value={filtroEmenda} onValueChange={setFiltroEmenda}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as emendas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS_EMENDAS">Todas as emendas</SelectItem>
                    {emendasDisponiveis.map(emenda => (
                      <SelectItem key={emenda} value={emenda}>{emenda}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo geral */}
        <div className="mb-6">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Valor Total Indicado</p>
                </div>
                <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorIndicado)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Valor Total a Empenhar</p>
                </div>
                <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorAEmpenhar)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Valor Total Empenhado</p>
                </div>
                <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorEmpenhado)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Valor Total Pago</p>
                </div>
                <p className="text-base font-semibold text-gray-900">{formatarValor(totaisGerais.valorPago)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blocos das emendas */}
        <div className="space-y-4">
          {blocos.map((bloco) => (
            <div key={bloco.bloco} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Cabeçalho do bloco */}
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBloco(bloco.bloco)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {blocosExpandidos.has(bloco.bloco) ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{bloco.bloco}</h3>
                    <span className="text-sm text-gray-500">
                      ({bloco.emendas.length} emendas • {bloco.totalMunicipios} municípios)
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Valor Indicado:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatarValor(bloco.totalValorIndicado)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">A Empenhar:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatarValor(bloco.totalValorAEmpenhar)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteúdo do bloco */}
              {blocosExpandidos.has(bloco.bloco) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('emenda')}
                        >
                          Emenda {obterIconeOrdenacao('emenda')}
                        </th>
                        <th 
                          className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('municipioBeneficiario')}
                        >
                          Município/Beneficiário {obterIconeOrdenacao('municipioBeneficiario')}
                        </th>
                        <th 
                          className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('valorIndicado')}
                        >
                          Valor Indicado {obterIconeOrdenacao('valorIndicado')}
                        </th>
                        <th 
                          className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('valorAEmpenhar')}
                        >
                          Valor a Empenhar {obterIconeOrdenacao('valorAEmpenhar')}
                        </th>
                        <th 
                          className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('valorEmpenhado')}
                        >
                          Valor Empenhado {obterIconeOrdenacao('valorEmpenhado')}
                        </th>
                        <th 
                          className="px-4 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('valorPago')}
                        >
                          Valor Pago {obterIconeOrdenacao('valorPago')}
                        </th>
                        <th 
                          className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('liderancas')}
                        >
                          Lideranças {obterIconeOrdenacao('liderancas')}
                        </th>
                        <th 
                          className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => ordenarPorCampo('objeto')}
                        >
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
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-500 border-t border-gray-100">
        © 2025 86 Dynamics - Dados importados do Firebase
      </footer>

      {/* Modal de Edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Editar Emenda
            </DialogTitle>
          </DialogHeader>
          
          {emendaEditando && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Bloco */}
              <div>
                <Label htmlFor="bloco">Bloco</Label>
                <Input
                  id="bloco"
                  value={dadosEdicao.bloco || ''}
                  onChange={(e) => handleCampoEdicao('bloco', e.target.value)}
                />
              </div>

              {/* Emenda */}
              <div>
                <Label htmlFor="emenda">Emenda</Label>
                <Input
                  id="emenda"
                  value={dadosEdicao.emenda || ''}
                  onChange={(e) => handleCampoEdicao('emenda', e.target.value)}
                />
              </div>

              {/* Município Beneficiário */}
              <div>
                <Label htmlFor="municipioBeneficiario">Município/Beneficiário</Label>
                <Input
                  id="municipioBeneficiario"
                  value={dadosEdicao.municipioBeneficiario || ''}
                  onChange={(e) => handleCampoEdicao('municipioBeneficiario', e.target.value)}
                />
              </div>

              {/* Funcional */}
              <div>
                <Label htmlFor="funcional">Funcional</Label>
                <Input
                  id="funcional"
                  value={dadosEdicao.funcional || ''}
                  onChange={(e) => handleCampoEdicao('funcional', e.target.value)}
                />
              </div>

              {/* GND */}
              <div>
                <Label htmlFor="gnd">GND</Label>
                <Input
                  id="gnd"
                  value={dadosEdicao.gnd || ''}
                  onChange={(e) => handleCampoEdicao('gnd', e.target.value)}
                />
              </div>

              {/* Valor Indicado */}
              <div>
                <Label htmlFor="valorIndicado">Valor Indicado</Label>
                <Input
                  id="valorIndicado"
                  type="number"
                  step="0.01"
                  value={dadosEdicao.valorIndicado || ''}
                  onChange={(e) => handleCampoEdicao('valorIndicado', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Valor Empenhado */}
              <div>
                <Label htmlFor="valorEmpenhado">Valor Empenhado</Label>
                <Input
                  id="valorEmpenhado"
                  type="number"
                  step="0.01"
                  value={dadosEdicao.valorEmpenhado || ''}
                  onChange={(e) => handleCampoEdicao('valorEmpenhado', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Valor a Empenhar */}
              <div>
                <Label htmlFor="valorAEmpenhar">Valor a Empenhar</Label>
                <Input
                  id="valorAEmpenhar"
                  type="number"
                  step="0.01"
                  value={dadosEdicao.valorAEmpenhar || ''}
                  onChange={(e) => handleCampoEdicao('valorAEmpenhar', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Valor Pago */}
              <div>
                <Label htmlFor="valorPago">Valor Pago</Label>
                <Input
                  id="valorPago"
                  type="number"
                  step="0.01"
                  value={dadosEdicao.valorPago || ''}
                  onChange={(e) => handleCampoEdicao('valorPago', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Valor a Ser Pago */}
              <div>
                <Label htmlFor="valorASerPago">Valor a Ser Pago</Label>
                <Input
                  id="valorASerPago"
                  type="number"
                  step="0.01"
                  value={dadosEdicao.valorASerPago || ''}
                  onChange={(e) => handleCampoEdicao('valorASerPago', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Empenho */}
              <div>
                <Label htmlFor="empenho">Empenho</Label>
                <Input
                  id="empenho"
                  value={dadosEdicao.empenho || ''}
                  onChange={(e) => handleCampoEdicao('empenho', e.target.value)}
                />
              </div>

              {/* Data Empenho */}
              <div>
                <Label htmlFor="dataEmpenho">Data Empenho</Label>
                <Input
                  id="dataEmpenho"
                  type="date"
                  value={dadosEdicao.dataEmpenho || ''}
                  onChange={(e) => handleCampoEdicao('dataEmpenho', e.target.value)}
                />
              </div>

              {/* Portaria/Convênio/Contrato */}
              <div>
                <Label htmlFor="portariaConvenioContrato">Portaria/Convênio/Contrato</Label>
                <Input
                  id="portariaConvenioContrato"
                  value={dadosEdicao.portariaConvenioContrato || ''}
                  onChange={(e) => handleCampoEdicao('portariaConvenioContrato', e.target.value)}
                />
              </div>

              {/* Pagamento */}
              <div>
                <Label htmlFor="pagamento">Pagamento</Label>
                <Input
                  id="pagamento"
                  value={dadosEdicao.pagamento || ''}
                  onChange={(e) => handleCampoEdicao('pagamento', e.target.value)}
                />
              </div>

              {/* Número Proposta */}
              <div>
                <Label htmlFor="numeroProposta">Número Proposta</Label>
                <Input
                  id="numeroProposta"
                  value={dadosEdicao.numeroProposta || ''}
                  onChange={(e) => handleCampoEdicao('numeroProposta', e.target.value)}
                />
              </div>

              {/* Lideranças */}
              <div>
                <Label htmlFor="liderancas">Lideranças</Label>
                <Input
                  id="liderancas"
                  value={dadosEdicao.liderancas || ''}
                  onChange={(e) => handleCampoEdicao('liderancas', e.target.value)}
                />
              </div>

              {/* Objeto */}
              <div className="md:col-span-2">
                <Label htmlFor="objeto">Objeto</Label>
                <Textarea
                  id="objeto"
                  value={dadosEdicao.objeto || ''}
                  onChange={(e) => handleCampoEdicao('objeto', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Alteração */}
              <div className="md:col-span-2">
                <Label htmlFor="alteracao">Alteração</Label>
                <Textarea
                  id="alteracao"
                  value={dadosEdicao.alteracao || ''}
                  onChange={(e) => handleCampoEdicao('alteracao', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={fecharModalEdicao}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={salvarEdicao} disabled={salvandoEdicao}>
              {salvandoEdicao ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 