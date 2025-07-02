"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Clock, AlertCircle, XCircle, HelpCircle, Building2, Users, DollarSign, MapPin } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/ui/loading";
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Tipo para as colunas disponíveis
type ColunaObraDemanda = 'DATA DEMANDA' | 'STATUS' | 'SOLICITAÇÃO' | 'OBS STATUS' | 'MUNICIPIO' | 'LIDERANÇA' | 'AÇÃO/OBJETO' | 'NÍVEL ESPAÇO' | 'ESFERA' | 'VALOR ' | 'ÓRGAO ' | 'PREVISÃO';

// Interface para os dados de obras e demandas
interface ObraDemanda {
  [key: string]: string | undefined;
  'Coluna 1'?: string;
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
  'USUÁRIO'?: string;
}

// Interface para controle de colunas visíveis
type ColunasVisiveis = {
  [K in ColunaObraDemanda]: boolean;
};

export default function ObrasDemandas() {
  const [dados, setDados] = useState<ObraDemanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>("TODOS_MUNICIPIOS");
  const [statusSelecionado, setStatusSelecionado] = useState<string>("TODOS_STATUS")
  const [liderancaSelecionada, setLiderancaSelecionada] = useState<string>("TODAS_LIDERANCAS")
  const [municipiosExpandidos, setMunicipiosExpandidos] = useState<Set<string>>(new Set());
  const [configurandoColunas, setConfigurandoColunas] = useState(false);
  const [colunasVisiveis, setColunasVisiveis] = useState<ColunasVisiveis>({
    'DATA DEMANDA': true,
    'STATUS': true,
    'SOLICITAÇÃO': true,
    'OBS STATUS': true,
    'MUNICIPIO': true,
    'LIDERANÇA': true,
    'AÇÃO/OBJETO': true,
    'NÍVEL ESPAÇO': true,
    'ESFERA': true,
    'VALOR ': true,
    'ÓRGAO ': true,
    'PREVISÃO': true
  });

  // Função para buscar dados
  const fetchDados = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/obras_demandas');
      if (!response.ok) throw new Error('Erro ao carregar obras');
      const data = await response.json();
      setDados(data.data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar obras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  // Função para formatar valor em moeda
  const formatarValor = (valor: string | number | undefined | null): string => {
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

  // Função para alternar expansão do município
  const toggleMunicipio = (municipio: string) => {
    const novosExpandidos = new Set(municipiosExpandidos);
    if (novosExpandidos.has(municipio)) {
      novosExpandidos.delete(municipio);
    } else {
      novosExpandidos.add(municipio);
    }
    setMunicipiosExpandidos(novosExpandidos);
  };

  // Filtrar dados
  const dadosFiltrados = dados.filter(obra => {
    const matchMunicipio = municipioSelecionado === "TODOS_MUNICIPIOS" || 
      (municipioSelecionado === "SEM_MUNICIPIO" ? !obra.MUNICIPIO : obra.MUNICIPIO === municipioSelecionado);
    
    const matchStatus = statusSelecionado === "TODOS_STATUS" || 
      (statusSelecionado === "SEM_STATUS" ? !obra.STATUS : obra.STATUS === statusSelecionado);
    
    const matchLideranca = liderancaSelecionada === "TODAS_LIDERANCAS" || 
      (liderancaSelecionada === "SEM_LIDERANCA" ? !obra['LIDERANÇA'] : obra['LIDERANÇA'] === liderancaSelecionada);
    
    return matchMunicipio && matchStatus && matchLideranca;
  });

  // Agrupar dados por município
  const dadosPorMunicipio = dadosFiltrados.reduce((acc: { [key: string]: ObraDemanda[] }, obra) => {
    const municipio = obra.MUNICIPIO;
    if (!acc[municipio]) {
      acc[municipio] = [];
    }
    acc[municipio].push(obra);
    return acc;
  }, {});

  // Renderizar loading inicial
  if (loading && dados.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Loading message="Carregando obras e demandas..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 py-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Obras e Demandas</h1>
          <p className="text-sm text-gray-500">Gerencie as obras e demandas em andamento</p>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Filtros</h2>
              {(municipioSelecionado !== "TODOS_MUNICIPIOS" || statusSelecionado !== "TODOS_STATUS" || liderancaSelecionada !== "TODAS_LIDERANCAS") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMunicipioSelecionado("TODOS_MUNICIPIOS");
                    setStatusSelecionado("TODOS_STATUS");
                    setLiderancaSelecionada("TODAS_LIDERANCAS");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={municipioSelecionado} onValueChange={setMunicipioSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS_MUNICIPIOS">Todos os municípios</SelectItem>
                  {Array.from(new Set(dados.map(obra => obra.MUNICIPIO || "SEM_MUNICIPIO"))).sort()
                    .filter(municipio => municipio)
                    .map(municipio => (
                      <SelectItem key={municipio} value={municipio === "SEM_MUNICIPIO" ? municipio : municipio}>
                        {municipio === "SEM_MUNICIPIO" ? "Sem município" : municipio}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusSelecionado} onValueChange={setStatusSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS_STATUS">Todos os status</SelectItem>
                  {Array.from(new Set(dados.map(obra => obra.STATUS || "SEM_STATUS"))).sort()
                    .filter(status => status)
                    .map(status => (
                      <SelectItem key={status} value={status === "SEM_STATUS" ? status : status}>
                        {status === "SEM_STATUS" ? "Sem status" : status}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={liderancaSelecionada} onValueChange={setLiderancaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por liderança" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS_LIDERANCAS">Todas as lideranças</SelectItem>
                  {Array.from(new Set(dados.map(obra => obra['LIDERANÇA'] || "SEM_LIDERANCA"))).sort()
                    .filter(lideranca => lideranca)
                    .map(lideranca => (
                      <SelectItem key={lideranca} value={lideranca === "SEM_LIDERANCA" ? lideranca : lideranca}>
                        {lideranca === "SEM_LIDERANCA" ? "Sem liderança" : lideranca}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Resumo */}
        <Card className="p-4">
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-900">Resumo Geral</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Total de Demandas</span>
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {dadosFiltrados.length}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Municípios</span>
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Object.keys(dadosPorMunicipio).length}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatarValor(dadosFiltrados.reduce((acc, obra) => acc + converterValorParaNumero(obra['VALOR ']), 0))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Lideranças</span>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Set(dadosFiltrados.map(obra => obra['LIDERANÇA'])).size}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Obras */}
        <Card>
          <div className="divide-y divide-gray-200">
            {Object.entries(dadosPorMunicipio).sort(([a], [b]) => a.localeCompare(b)).map(([municipio, obras]) => {
              const totalValor = obras.reduce((sum, obra) => sum + converterValorParaNumero(obra['VALOR ']), 0);
              return (
                <div key={municipio} className="p-4">
                  <button
                    onClick={() => toggleMunicipio(municipio)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{municipio}</span>
                      <span className="text-sm text-gray-500">({obras.length} {obras.length === 1 ? 'demanda' : 'demandas'})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">{formatarValor(totalValor)}</span>
                      {municipiosExpandidos.has(municipio) ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {municipiosExpandidos.has(municipio) && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            {Object.entries(colunasVisiveis)
                              .filter(([_, visivel]) => visivel)
                              .map(([coluna]) => (
                                <th
                                  key={coluna}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                                >
                                  {coluna}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {obras.map((obra, index) => (
                            <tr key={obra.ID || index} className="hover:bg-gray-50">
                              {Object.entries(colunasVisiveis)
                                .filter(([_, visivel]) => visivel)
                                .map(([coluna]) => {
                                  if (coluna === 'STATUS') {
                                    const statusConfig = getStatusConfig(obra[coluna] || '');
                                    return (
                                      <td key={coluna} className="px-3 py-2 whitespace-nowrap">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                          {statusConfig.icon}
                                          {obra[coluna] || '-'}
                                        </div>
                                      </td>
                                    );
                                  }

                                  if (coluna === 'VALOR ') {
                                    return (
                                      <td key={coluna} className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                        {formatarValor(obra[coluna])}
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={coluna} className="px-3 py-2 text-sm text-gray-900">
                                      {obra[coluna] || '-'}
                                    </td>
                                  );
                                })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Modal de Configuração de Colunas */}
        {configurandoColunas && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Configurar Colunas Visíveis</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfigurandoColunas(false)}
                  className="h-8 w-8 p-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                  <span className="sr-only">Fechar</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(colunasVisiveis).map(([coluna, visivel]) => (
                  <div key={coluna} className="flex items-center space-x-2">
                    <Checkbox
                      id={coluna}
                      checked={visivel}
                      onCheckedChange={(checked) => {
                        setColunasVisiveis(prev => ({
                          ...prev,
                          [coluna]: checked === true
                        }));
                      }}
                    />
                    <label htmlFor={coluna} className="text-sm cursor-pointer select-none">{coluna}</label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setColunasVisiveis({
                      'DATA DEMANDA': true,
                      'STATUS': true,
                      'SOLICITAÇÃO': true,
                      'OBS STATUS': true,
                      'MUNICIPIO': true,
                      'LIDERANÇA': true,
                      'AÇÃO/OBJETO': true,
                      'NÍVEL ESPAÇO': true,
                      'ESFERA': true,
                      'VALOR ': true,
                      'ÓRGAO ': true,
                      'PREVISÃO': true
                    });
                  }}
                >
                  Restaurar Padrão
                </Button>
                <Button onClick={() => setConfigurandoColunas(false)}>
                  Concluído
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 