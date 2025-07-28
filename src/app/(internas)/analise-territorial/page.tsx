'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Map, TrendingUp, Users, Building2, AlertTriangle } from 'lucide-react';

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
    votosDeputado2022: number;
    posicaoRanking2022: number;
    crescimentoVotos: number;
  };
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
  };
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
    percentualPago: number;
    tempoMedioExecucao: number;
  };
  baseEleitoral: {
    overlapTop30: number;
    crescimentoNovasBases: number;
  };
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
          percentualPago: 45.2,
          tempoMedioExecucao: 120
        },
        baseEleitoral: {
          overlapTop30: 85.5,
          crescimentoNovasBases: 15.2
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
                    <span className="font-semibold">{metricas?.execucao.percentualEmpenhado}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Pago</span>
                    <span className="font-semibold">{metricas?.execucao.percentualPago}%</span>
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
                        <th scope="col" className="px-6 py-3">Valor em Emendas</th>
                        <th scope="col" className="px-6 py-3">R$ per capita</th>
                        <th scope="col" className="px-6 py-3">% Executado</th>
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
                              {municipio.emendas.percentualPago}%
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
      </Tabs>
    </div>
  );
} 