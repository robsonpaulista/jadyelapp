'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Map, 
  TrendingUp, 
  Users, 
  Building2, 
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

// Interfaces
interface AnaliseTerritorioData {
  municipio: {
    id: string;
    nome: string;
    regiao: string;
  };
  demografia: {
    populacao: number;
    densidade: number;
  };
  politica: {
    votosDeputado: number;
    ranking: number;
    percentualVotos: number;
    crescimento: number;
  } | null;
  emendas: {
    valorTotal: number;
    valorPerCapita: number;
    percentualPago: number;
    tempoMedioExecucao: number;
    quantidadeEmendas: number;
  };
  risco: {
    situacaoCAUC: 'REGULAR' | 'IRREGULAR' | 'PENDENTE';
    bloqueios: string[];
    ultimaAtualizacao: string;
    nivel: string;
    score: number;
    alertas: string[];
  } | null;
}

interface MetricasGerais {
  cobertura: {
    municipiosAtendidos: number;
    percentualMunicipios: number;
    populacaoAtingida: number;
    percentualPopulacao: number;
  };
  investimento: {
    valorTotalEmendas: number;
    mediaPerCapita: number;
    indiceConcentracao: number;
  };
  execucao: {
    percentualEmpenhado: number;
    percentualLiquidado: number;
    percentualPago: number;
    tempoMedioExecucao: number;
  };
  baseEleitoral: {
    overlapTop30: number;
    crescimentoNovasBases: number;
  };
  risco: {
    municipiosIrregulares: number;
    percentualIrregulares: number;
    valorEmRisco: number;
    tempoMedioRegularizacao: number;
  };
}

// Função auxiliar para cor do nível de risco
function getRiscoColor(nivel: string): string {
  switch (nivel) {
    case 'BAIXO': return 'bg-green-100 text-green-800';
    case 'MEDIO': return 'bg-yellow-100 text-yellow-800';
    case 'ALTO': return 'bg-orange-100 text-orange-800';
    case 'CRITICO': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Função auxiliar para ícone do nível de risco
function getRiscoIcon(nivel: string) {
  switch (nivel) {
    case 'BAIXO': return <ShieldCheck className="h-4 w-4 text-green-600" />;
    case 'MEDIO': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case 'ALTO': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'CRITICO': return <ShieldAlert className="h-4 w-4 text-red-600" />;
    default: return null;
  }
}

export default function AnaliseTerritorioPage() {
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabAtiva, setTabAtiva] = useState('visao-geral');
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string | null>(null);
  const [dados, setDados] = useState<AnaliseTerritorioData[]>([]);
  const [metricas, setMetricas] = useState<MetricasGerais | null>(null);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Função para carregar dados
  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar chamada à API
      // const response = await fetch('/api/analise-territorial');
      // const data = await response.json();
      
      // Mock de dados para desenvolvimento
      const dadosMock: AnaliseTerritorioData[] = [];
      const metricasMock: MetricasGerais = {
        cobertura: {
          municipiosAtendidos: 180,
          percentualMunicipios: 80.5,
          populacaoAtingida: 2500000,
          percentualPopulacao: 75.8
        },
        investimento: {
          valorTotalEmendas: 150000000,
          mediaPerCapita: 250.45,
          indiceConcentracao: 0.45
        },
        execucao: {
          percentualEmpenhado: 65.4,
          percentualLiquidado: 50.0,
          percentualPago: 45.2,
          tempoMedioExecucao: 120
        },
        baseEleitoral: {
          overlapTop30: 85.5,
          crescimentoNovasBases: 15.2
        },
        risco: {
          municipiosIrregulares: 15,
          percentualIrregulares: 8.3,
          valorEmRisco: 5000000,
          tempoMedioRegularizacao: 90
        }
      };

      setDados(dadosMock);
      setMetricas(metricasMock);
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando análise territorial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600">{error}</p>
          <Button onClick={carregarDados} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Análise Territorial</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarDados}>
            Atualizar dados
          </Button>
        </div>
      </div>

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="municipios">Municípios</TabsTrigger>
          <TabsTrigger value="risco">Análise de Risco</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card de Cobertura */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Map className="h-4 w-4 text-blue-600" />
                  Cobertura Territorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Municípios atendidos</span>
                    <span className="font-semibold">{metricas?.cobertura.municipiosAtendidos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">População atingida</span>
                    <span className="font-semibold">
                      {metricas?.cobertura.populacaoAtingida.toLocaleString()} hab
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Investimento */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Investimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total em emendas</span>
                    <span className="font-semibold">
                      {metricas?.investimento.valorTotalEmendas.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Média per capita</span>
                    <span className="font-semibold">
                      {metricas?.investimento.mediaPerCapita.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Base Eleitoral */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  Base Eleitoral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Overlap Top 30</span>
                    <span className="font-semibold">{metricas?.baseEleitoral.overlapTop30}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Crescimento novas bases</span>
                    <span className="font-semibold">+{metricas?.baseEleitoral.crescimentoNovasBases}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Execução */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  Execução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Empenhado</span>
                    <span className="font-semibold">{metricas?.execucao.percentualEmpenhado.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Liquidado</span>
                    <span className="font-semibold">{metricas?.execucao.percentualLiquidado.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Pago</span>
                    <span className="font-semibold">{metricas?.execucao.percentualPago.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Tempo médio</span>
                    <span className="font-semibold">{metricas?.execucao.tempoMedioExecucao.toFixed(0)} dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mapa">
          {/* TODO: Implementar componente de mapa */}
          <Card>
            <CardContent className="p-6">
              <div className="h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">Mapa será implementado aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metricas">
          {/* TODO: Implementar visualizações detalhadas de métricas */}
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Visualizações detalhadas serão implementadas aqui</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="municipios">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Municípios</h3>
                  <div className="flex gap-2">
                    <Select
                      value={municipioSelecionado || ''}
                      onValueChange={setMunicipioSelecionado}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecionar município" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os municípios</SelectItem>
                        {dados.map((municipio) => (
                          <SelectItem key={municipio.municipio.id} value={municipio.municipio.id}>
                            {municipio.municipio.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">Município</th>
                        <th scope="col" className="px-6 py-3">População</th>
                        <th scope="col" className="px-6 py-3">Densidade</th>
                        <th scope="col" className="px-6 py-3">Votos 2022</th>
                        <th scope="col" className="px-6 py-3">Ranking</th>
                        <th scope="col" className="px-6 py-3">% Votos</th>
                        <th scope="col" className="px-6 py-3">Valor em Emendas</th>
                        <th scope="col" className="px-6 py-3">R$ per capita</th>
                        <th scope="col" className="px-6 py-3">% Pago</th>
                        <th scope="col" className="px-6 py-3">Tempo Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados
                        .filter(m => !municipioSelecionado || m.municipio.id === municipioSelecionado)
                        .map((municipio) => (
                          <tr key={municipio.municipio.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {municipio.municipio.nome}
                            </td>
                            <td className="px-6 py-4">
                              {municipio.demografia.populacao.toLocaleString()} hab
                            </td>
                            <td className="px-6 py-4">
                              {municipio.demografia.densidade.toFixed(2)} hab/km²
                            </td>
                            <td className="px-6 py-4">
                              {municipio.politica ? (
                                municipio.politica.votosDeputado.toLocaleString()
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {municipio.politica ? (
                                <span className={`font-medium ${
                                  municipio.politica.ranking <= 30 ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  {municipio.politica.ranking}º
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {municipio.politica ? (
                                `${municipio.politica.percentualVotos.toFixed(2)}%`
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {municipio.emendas.valorTotal.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              {municipio.emendas.valorPerCapita.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${municipio.emendas.percentualPago}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">
                                  {municipio.emendas.percentualPago.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {municipio.emendas.tempoMedioExecucao > 0 ? (
                                `${municipio.emendas.tempoMedioExecucao.toFixed(0)} dias`
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risco">
          <div className="space-y-6">
            {/* Card de métricas de risco */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas de Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="font-medium">Municípios Irregulares</h3>
                    </div>
                    <p className="text-2xl font-bold">{metricas?.risco.municipiosIrregulares}</p>
                    <p className="text-sm text-gray-500">
                      {metricas?.risco.percentualIrregulares.toFixed(1)}% do total
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <h3 className="font-medium">Valor em Risco</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {metricas?.risco.valorEmRisco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">em emendas para municípios irregulares</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Tempo Médio Regularização</h3>
                    </div>
                    <p className="text-2xl font-bold">{metricas?.risco.tempoMedioRegularizacao} dias</p>
                    <p className="text-sm text-gray-500">para resolver pendências</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de municípios com risco */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Municípios por Nível de Risco</h3>
                  </div>

                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Município</th>
                          <th scope="col" className="px-6 py-3">Nível de Risco</th>
                          <th scope="col" className="px-6 py-3">Score</th>
                          <th scope="col" className="px-6 py-3">Situação CAUC</th>
                          <th scope="col" className="px-6 py-3">Alertas</th>
                          <th scope="col" className="px-6 py-3">Última Atualização</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados
                          .filter(m => !municipioSelecionado || m.municipio.id === municipioSelecionado)
                          .sort((a, b) => {
                            if (!a.risco || !b.risco) return 0;
                            return a.risco.score - b.risco.score;
                          })
                          .map((municipio) => (
                            <tr key={municipio.municipio.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {municipio.municipio.nome}
                              </td>
                              <td className="px-6 py-4">
                                {municipio.risco && (
                                  <div className="flex items-center gap-2">
                                    {getRiscoIcon(municipio.risco.nivel)}
                                    <Badge className={getRiscoColor(municipio.risco.nivel)}>
                                      {municipio.risco.nivel}
                                    </Badge>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {municipio.risco && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          municipio.risco.score >= 80 ? 'bg-green-600' :
                                          municipio.risco.score >= 60 ? 'bg-yellow-600' :
                                          municipio.risco.score >= 40 ? 'bg-orange-600' :
                                          'bg-red-600'
                                        }`}
                                        style={{ width: `${municipio.risco.score}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium">
                                      {municipio.risco.score}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {municipio.risco && (
                                  <Badge className={
                                    municipio.risco.situacaoCAUC === 'REGULAR' 
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }>
                                    {municipio.risco.situacaoCAUC}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {municipio.risco?.alertas.map((alerta, idx) => (
                                  <div key={idx} className="text-xs text-gray-600">
                                    • {alerta}
                                  </div>
                                ))}
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500">
                                {municipio.risco?.ultimaAtualizacao && new Date(municipio.risco.ultimaAtualizacao).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 