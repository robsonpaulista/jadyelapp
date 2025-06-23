'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, RefreshCw, DollarSign, Wallet, CreditCard, Receipt, ChevronDown, ArrowUpDown, ChevronUp, Pencil, Save, X as XIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { disableConsoleLogging } from '@/lib/logger';

interface Emenda {
  id: string;
  emenda: string;
  municipio: string;
  funcional: string;
  gnd: string;
  valor_total: number;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
  objeto: string;
  processo: string;
  contrato: string;
  tipo: string;
  natureza: string;
  classificacao_emenda: string;
}

interface MatrizNatureza {
  natureza: string;
  total_valor_total: number;
  total_valor_empenhado: number;
  total_valor_liquidado: number;
  total_valor_pago: number;
  emendas: Emenda[];
}

interface Filtros {
  municipio: string[];
  classificacao_emenda: string[];
  natureza: string[];
  tipo: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Emendas2025() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emendas, setEmendas] = useState<Emenda[]>([]);
  const [matrizNaturezas, setMatrizNaturezas] = useState<MatrizNatureza[]>([]);
  const [filtros, setFiltros] = useState<Filtros>({
    municipio: [],
    classificacao_emenda: [],
    natureza: [],
    tipo: [],
  });
  const [opcoesUnicas, setOpcoesUnicas] = useState<Filtros>({
    municipio: [],
    classificacao_emenda: [],
    natureza: [],
    tipo: [],
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Estados para usuário logado
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estado para controlar quais naturezas estão expandidas
  const [naturezasExpandidas, setNaturezasExpandidas] = useState<Set<string>>(new Set());

  // Estados para a edição inline
  const [editandoEmenda, setEditandoEmenda] = useState<string | null>(null);
  const [emendasEditadas, setEmendasEditadas] = useState<Record<string, any>>({});
  const [salvandoEmenda, setSalvandoEmenda] = useState<string | null>(null);
  
  // Carregar informações do usuário
  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    try {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser({
          name: "ROBSON MEDEIROS SANTOS",
          role: "admin"
        });
      }
    } catch (error) {
      setCurrentUser({
        name: "ROBSON MEDEIROS SANTOS",
        role: "admin"
      });
    }
  }, []);

  // Buscar dados das emendas
  const fetchEmendas = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = forceRefresh ? '/api/emendas?forceRefresh=true' : '/api/emendas';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.sucesso && data.dados) {
        setEmendas(data.dados);
        
        // Atualizar opções únicas para filtros
        const opcoesUnicas = data.dados.reduce((acc: Filtros, emenda: Emenda) => {
          if (!acc.municipio.includes(emenda.municipio)) acc.municipio.push(emenda.municipio);
          if (emenda.classificacao_emenda && !acc.classificacao_emenda.includes(emenda.classificacao_emenda)) 
            acc.classificacao_emenda.push(emenda.classificacao_emenda);
          if (emenda.natureza && !acc.natureza.includes(emenda.natureza)) 
            acc.natureza.push(emenda.natureza);
          if (emenda.tipo && !acc.tipo.includes(emenda.tipo)) 
            acc.tipo.push(emenda.tipo);
          
          return acc;
        }, { municipio: [], classificacao_emenda: [], natureza: [], tipo: [] });

        // Ordenar as opções alfabeticamente
        opcoesUnicas.municipio.sort();
        opcoesUnicas.classificacao_emenda.sort();
        opcoesUnicas.natureza.sort();
        opcoesUnicas.tipo.sort();

        setOpcoesUnicas(opcoesUnicas);

        if (forceRefresh) {
          toast.success('Dados atualizados com sucesso!');
        }
      } else {
        setError('Erro ao carregar dados das emendas');
        toast.error('Erro ao buscar dados. Tente novamente.');
      }
    } catch (error) {
      setError('Erro ao carregar dados das emendas');
      toast.error('Erro ao buscar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarMatriz = useCallback(() => {
    if (!emendas.length) return;

    // Aplicar filtros
    let emendasFiltradas = emendas;

    if (filtros.municipio.length > 0) {
      emendasFiltradas = emendasFiltradas.filter(emenda => 
        filtros.municipio.includes(emenda.municipio)
      );
    }

    if (filtros.classificacao_emenda.length > 0) {
      emendasFiltradas = emendasFiltradas.filter(emenda => 
        filtros.classificacao_emenda.includes(emenda.classificacao_emenda)
      );
    }

    if (filtros.natureza.length > 0) {
      emendasFiltradas = emendasFiltradas.filter(emenda => 
        filtros.natureza.includes(emenda.natureza)
      );
    }

    if (filtros.tipo.length > 0) {
      emendasFiltradas = emendasFiltradas.filter(emenda => 
        filtros.tipo.includes(emenda.tipo)
      );
    }

    // Agrupar por natureza
    const matrizPorNatureza = emendasFiltradas.reduce((acc, emenda) => {
      const natureza = emenda.natureza || 'SEM NATUREZA';
      
      if (!acc[natureza]) {
        acc[natureza] = {
          natureza,
          total_valor_total: 0,
          total_valor_empenhado: 0,
          total_valor_liquidado: 0,
          total_valor_pago: 0,
          emendas: []
        };
      }
      
      acc[natureza].total_valor_total += emenda.valor_total || 0;
      acc[natureza].total_valor_empenhado += emenda.valor_empenhado || 0;
      acc[natureza].total_valor_liquidado += emenda.valor_liquidado || 0;
      acc[natureza].total_valor_pago += emenda.valor_pago || 0;
      acc[natureza].emendas.push(emenda);
      
      return acc;
    }, {} as Record<string, MatrizNatureza>);

    // Converter para array e ordenar por valor total decrescente
    const matrizArray = Object.values(matrizPorNatureza).sort((a, b) => 
      b.total_valor_total - a.total_valor_total
    );

    setMatrizNaturezas(matrizArray);
  }, [emendas, filtros]);

  // Recarregar matriz quando filtros mudarem
  useEffect(() => {
    atualizarMatriz();
  }, [atualizarMatriz]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchEmendas();
  }, []);

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const toggleFiltro = (tipo: keyof Filtros, valor: string) => {
    setFiltros(prev => {
      const novosFiltros = { ...prev };
      const index = novosFiltros[tipo].indexOf(valor);
      
      if (index > -1) {
        novosFiltros[tipo] = novosFiltros[tipo].filter(item => item !== valor);
      } else {
        novosFiltros[tipo] = [...novosFiltros[tipo], valor];
      }
      
      return novosFiltros;
    });
  };

  const sortData = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    
    setMatrizNaturezas(prev => {
      const sorted = [...prev].sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (key) {
          case 'natureza':
            aValue = a.natureza;
            bValue = b.natureza;
            break;
          case 'total_valor_total':
            aValue = a.total_valor_total;
            bValue = b.total_valor_total;
            break;
          case 'total_valor_empenhado':
            aValue = a.total_valor_empenhado;
            bValue = b.total_valor_empenhado;
            break;
          case 'total_valor_liquidado':
            aValue = a.total_valor_liquidado;
            bValue = b.total_valor_liquidado;
            break;
          case 'total_valor_pago':
            aValue = a.total_valor_pago;
            bValue = b.total_valor_pago;
            break;
          default:
            return 0;
        }
        
        if (direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      return sorted;
    });
  };

  const toggleExpansao = (natureza: string) => {
    setNaturezasExpandidas(prev => {
      const novas = new Set(prev);
      if (novas.has(natureza)) {
        novas.delete(natureza);
      } else {
        novas.add(natureza);
      }
      return novas;
    });
  };

  const expandirTodasNaturezas = () => {
    const todasNaturezas = new Set(matrizNaturezas.map(m => m.natureza));
    setNaturezasExpandidas(todasNaturezas);
  };

  const recolherTodasNaturezas = () => {
    setNaturezasExpandidas(new Set());
  };

  const iniciarEdicao = (emendaId: string, emenda: any) => {
    setEditandoEmenda(emendaId);
    setEmendasEditadas({
      [emendaId]: { ...emenda }
    });
  };

  const atualizarCampoEmenda = (emendaId: string, campo: string, valor: any) => {
    setEmendasEditadas(prev => ({
      ...prev,
      [emendaId]: {
        ...prev[emendaId],
        [campo]: valor
      }
    }));
  };

  const cancelarEdicao = () => {
    setEditandoEmenda(null);
    setEmendasEditadas({});
  };

  const salvarEmenda = async (emendaId: string, rowIndex: number) => {
    setSalvandoEmenda(emendaId);
    try {
      const emendaEditada = emendasEditadas[emendaId];
      
      const response = await fetch('/api/emendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emenda: emendaEditada,
          rowIndex: rowIndex
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Atualizar os dados locais
        setEmendas(prev => prev.map(e => e.id === emendaId ? emendaEditada : e));
        setEditandoEmenda(null);
        setEmendasEditadas({});
        toast.success('Emenda atualizada com sucesso!');
        
        // Recarregar dados após salvar
        await fetchEmendas(true);
      } else {
        toast.error('Erro ao salvar emenda: ' + result.message);
      }
    } catch (error) {
      toast.error('Erro ao salvar emenda');
    } finally {
      setSalvandoEmenda(null);
    }
  };

  // Preparar dados para gráficos
  const dadosGraficoNaturezas = useMemo(() => {
    return matrizNaturezas.map(matriz => ({
      name: matriz.natureza.length > 20 ? `${matriz.natureza.substring(0, 20)}...` : matriz.natureza,
      valor: matriz.total_valor_total,
      fullName: matriz.natureza
    }));
  }, [matrizNaturezas]);

  const dadosGraficoMunicipios = useMemo(() => {
    const municipiosData = emendas.reduce((acc, emenda) => {
      if (!acc[emenda.municipio]) {
        acc[emenda.municipio] = 0;
      }
      acc[emenda.municipio] += emenda.valor_total || 0;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(municipiosData)
      .map(([municipio, valor]) => ({ name: municipio, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10); // Top 10 municípios
  }, [emendas]);

  const totaisGerais = useMemo(() => {
    return emendas.reduce((acc, emenda) => {
      acc.valorTotal += emenda.valor_total || 0;
      acc.valorEmpenhado += emenda.valor_empenhado || 0;
      acc.valorLiquidado += emenda.valor_liquidado || 0;
      acc.valorPago += emenda.valor_pago || 0;
      return acc;
    }, {
      valorTotal: 0,
      valorEmpenhado: 0,
      valorLiquidado: 0,
      valorPago: 0
    });
  }, [emendas]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Emendas 2025</span>
              <span className="text-xs text-gray-500 font-light">Controle e acompanhamento de emendas parlamentares</span>
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
              <span className="text-xs text-gray-500 font-light">Controle e acompanhamento de emendas parlamentares</span>
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Emendas 2025</span>
            <span className="text-xs text-gray-500 font-light">Controle e acompanhamento de emendas parlamentares</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmendas(true)}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-blue-50 text-blue-700 cursor-pointer border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </button>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="p-0 w-full flex-1">
        <div className="px-4 py-8">
          {/* Resumo dos totais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatarValor(totaisGerais.valorTotal)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Empenhado</p>
                    <p className="text-2xl font-bold text-blue-600">{formatarValor(totaisGerais.valorEmpenhado)}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Liquidado</p>
                    <p className="text-2xl font-bold text-purple-600">{formatarValor(totaisGerais.valorLiquidado)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Pago</p>
                    <p className="text-2xl font-bold text-orange-600">{formatarValor(totaisGerais.valorPago)}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filtros</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                  {mostrarFiltros ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {mostrarFiltros ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {mostrarFiltros && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Filtro por Município */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Município</Label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`${filtros.municipio.length} selecionados`} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {opcoesUnicas.municipio.map(opcao => (
                              <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`municipio-${opcao}`}
                                  checked={filtros.municipio.includes(opcao)}
                                  onCheckedChange={() => toggleFiltro('municipio', opcao)}
                                />
                                <label htmlFor={`municipio-${opcao}`} className="text-sm cursor-pointer">{opcao}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtro por Classificação */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Classificação</Label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`${filtros.classificacao_emenda.length} selecionados`} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {opcoesUnicas.classificacao_emenda.map(opcao => (
                              <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`classificacao-${opcao}`}
                                  checked={filtros.classificacao_emenda.includes(opcao)}
                                  onCheckedChange={() => toggleFiltro('classificacao_emenda', opcao)}
                                />
                                <label htmlFor={`classificacao-${opcao}`} className="text-sm cursor-pointer">{opcao}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtro por Natureza */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Natureza</Label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`${filtros.natureza.length} selecionados`} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {opcoesUnicas.natureza.map(opcao => (
                              <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`natureza-${opcao}`}
                                  checked={filtros.natureza.includes(opcao)}
                                  onCheckedChange={() => toggleFiltro('natureza', opcao)}
                                />
                                <label htmlFor={`natureza-${opcao}`} className="text-sm cursor-pointer">{opcao}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtro por Tipo */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Tipo</Label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`${filtros.tipo.length} selecionados`} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {opcoesUnicas.tipo.map(opcao => (
                              <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`tipo-${opcao}`}
                                  checked={filtros.tipo.includes(opcao)}
                                  onCheckedChange={() => toggleFiltro('tipo', opcao)}
                                />
                                <label htmlFor={`tipo-${opcao}`} className="text-sm cursor-pointer">{opcao}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={expandirTodasNaturezas}>
                        Expandir Todas
                      </Button>
                      <Button variant="outline" size="sm" onClick={recolherTodasNaturezas}>
                        Recolher Todas
                      </Button>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico por Natureza */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Natureza</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosGraficoNaturezas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {dadosGraficoNaturezas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatarValor(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico por Município */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Municípios</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosGraficoMunicipios}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={10}
                    />
                    <YAxis tickFormatter={(value) => formatarValor(value)} />
                    <Tooltip formatter={(value: any) => formatarValor(value)} />
                    <Bar dataKey="valor" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de dados por natureza */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Emendas por Natureza</CardTitle>
                <div className="text-sm text-gray-600">
                  Total: {emendas.length} emendas
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left" style={{ width: '40px' }}></th>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center gap-1 hover:text-blue-600"
                          onClick={() => sortData('natureza')}
                        >
                          Natureza
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          className="flex items-center gap-1 hover:text-blue-600 ml-auto"
                          onClick={() => sortData('total_valor_total')}
                        >
                          Valor Total
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          className="flex items-center gap-1 hover:text-blue-600 ml-auto"
                          onClick={() => sortData('total_valor_empenhado')}
                        >
                          Valor Empenhado
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          className="flex items-center gap-1 hover:text-blue-600 ml-auto"
                          onClick={() => sortData('total_valor_liquidado')}
                        >
                          Valor Liquidado
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          className="flex items-center gap-1 hover:text-blue-600 ml-auto"
                          onClick={() => sortData('total_valor_pago')}
                        >
                          Valor Pago
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrizNaturezas.map((natureza) => (
                      <React.Fragment key={natureza.natureza}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleExpansao(natureza.natureza)}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200"
                            >
                              <ChevronDown className={`h-5 w-5 transform transition-transform ${naturezasExpandidas.has(natureza.natureza) ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {natureza.natureza}
                            <span className="ml-2 text-xs text-gray-500">
                              ({natureza.emendas.length} emendas)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {formatarValor(natureza.total_valor_total)}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600">
                            {formatarValor(natureza.total_valor_empenhado)}
                          </td>
                          <td className="px-4 py-3 text-right text-purple-600">
                            {formatarValor(natureza.total_valor_liquidado)}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            {formatarValor(natureza.total_valor_pago)}
                          </td>
                        </tr>

                        {naturezasExpandidas.has(natureza.natureza) && (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 bg-gray-50">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left">ID</th>
                                    <th className="px-4 py-2 text-left">Município</th>
                                    <th className="px-4 py-2 text-left">Objeto</th>
                                    <th className="px-4 py-2 text-left">Tipo</th>
                                    <th className="px-4 py-2 text-right">Valor Total</th>
                                    <th className="px-4 py-2 text-right">Valor Empenhado</th>
                                    <th className="px-4 py-2 text-center">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {natureza.emendas.map((emenda, idx) => (
                                    <tr key={emenda.id} className="border-b hover:bg-gray-50">
                                      <td className="px-4 py-2">{emenda.id}</td>
                                      <td className="px-4 py-2">{emenda.municipio}</td>
                                      <td className="px-4 py-2 max-w-xs truncate" title={emenda.objeto}>{emenda.objeto}</td>
                                      <td className="px-4 py-2">{emenda.tipo}</td>
                                      <td className="px-4 py-2 text-right text-green-600">
                                        {editandoEmenda === emenda.id ? (
                                          <Input
                                            type="number"
                                            value={emendasEditadas[emenda.id]?.valor_total || 0}
                                            onChange={(e) => atualizarCampoEmenda(emenda.id, 'valor_total', parseFloat(e.target.value) || 0)}
                                            className="w-24 h-8 text-right"
                                          />
                                        ) : (
                                          formatarValor(emenda.valor_total || 0)
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right text-blue-600">
                                        {editandoEmenda === emenda.id ? (
                                          <Input
                                            type="number"
                                            value={emendasEditadas[emenda.id]?.valor_empenhado || 0}
                                            onChange={(e) => atualizarCampoEmenda(emenda.id, 'valor_empenhado', parseFloat(e.target.value) || 0)}
                                            className="w-24 h-8 text-right"
                                          />
                                        ) : (
                                          formatarValor(emenda.valor_empenhado || 0)
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        {editandoEmenda === emenda.id ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => salvarEmenda(emenda.id, idx)}
                                              disabled={salvandoEmenda === emenda.id}
                                              className="h-7 w-7 p-0"
                                            >
                                              {salvandoEmenda === emenda.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <Save className="h-3 w-3" />
                                              )}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={cancelarEdicao}
                                              className="h-7 w-7 p-0"
                                            >
                                              <XIcon className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => iniciarEdicao(emenda.id, emenda)}
                                            className="h-7 w-7 p-0"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © 2025 86 Dynamics - Todos os direitos reservados
        </div>
      </main>
    </div>
  );
} 