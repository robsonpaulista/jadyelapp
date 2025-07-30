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
  Clock,
  User,
  FileText
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { DeputadoComEmendas } from '@/services/camaraService';

// Dados mockados como fallback
const DADOS_MOCKADOS = {
  deputados: [
    {
      deputado: {
        id: 123456,
        nome: 'Deputado Exemplo',
        siglaPartido: 'PARTIDO',
        siglaUf: 'PI',
        urlFoto: '',
        email: 'deputado@camara.leg.br'
      },
      emendas: [
        {
          id: 1,
          numero: '2025/001',
          valor: 1000000,
          municipio: 'Teresina',
          objeto: 'Aquisição de equipamentos',
          exercicio: 2025,
          tipo: 'Individual'
        }
      ],
      totalEmendas: 1,
      valorTotal: 1000000
    }
  ],
  metricas: {
    cobertura: {
      deputadosAtivos: 8,
      municipiosAtendidos: 180,
      percentualMunicipios: 80.5,
      populacaoAtingida: 2500000
    },
    investimento: {
      valorTotalEmendas: 150000000,
      mediaPorDeputado: 18750000,
      mediaPorEmenda: 2500000,
      totalEmendas: 60
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
  }
};

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
    case 'ALTO': return <ShieldAlert className="h-4 w-4 text-orange-600" />;
    case 'CRITICO': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
}

export default function AnaliseTerritorioPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabAtiva, setTabAtiva] = useState('visao-geral');
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<string>('todos');
  const [dados, setDados] = useState<DeputadoComEmendas[]>(DADOS_MOCKADOS.deputados);
  const [metricas, setMetricas] = useState(DADOS_MOCKADOS.metricas);

  // Carregar dados da API da Câmara
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/camara?ano=2025');
      const result = await response.json();
      
      if (result.success) {
        setDados(result.dados);
        
        // Calcular métricas baseadas nos dados reais
        const totalEmendas = result.dados.reduce((acc: number, deputado: DeputadoComEmendas) => 
          acc + deputado.totalEmendas, 0);
        const valorTotal = result.dados.reduce((acc: number, deputado: DeputadoComEmendas) => 
          acc + deputado.valorTotal, 0);
        
        setMetricas({
          ...metricas,
          investimento: {
            valorTotalEmendas: valorTotal,
            mediaPorDeputado: result.dados.length > 0 ? valorTotal / result.dados.length : 0,
            mediaPorEmenda: totalEmendas > 0 ? valorTotal / totalEmendas : 0,
            totalEmendas: totalEmendas
          },
          cobertura: {
            ...metricas.cobertura,
            deputadosAtivos: result.dados.length
          }
        });
      } else {
        setError('Erro ao carregar dados da API');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro de conexão com a API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar deputados baseado na seleção
  const deputadosFiltrados = dados.filter(d => 
    deputadoSelecionado === 'todos' || d.deputado.id.toString() === deputadoSelecionado
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Análise Territorial - Deputados Federais Piauí</h1>
        <div className="flex gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Button variant="outline" onClick={carregarDados} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar dados'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="deputados">Deputados</TabsTrigger>
          <TabsTrigger value="emendas">Emendas</TabsTrigger>
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
                    <span className="font-semibold">{metricas.cobertura.municipiosAtendidos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">População atingida</span>
                    <span className="font-semibold">
                      {metricas.cobertura.populacaoAtingida.toLocaleString()} hab
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
                      {metricas.investimento.valorTotalEmendas.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Média por deputado</span>
                    <span className="font-semibold">
                      {metricas.investimento.mediaPorDeputado.toLocaleString('pt-BR', {
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
                    <span className="font-semibold">{metricas.baseEleitoral.overlapTop30}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Crescimento novas bases</span>
                    <span className="font-semibold">+{metricas.baseEleitoral.crescimentoNovasBases}%</span>
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
                    <span className="text-sm text-gray-500">% Empenhado</span>
                    <span className="font-semibold">{metricas.execucao.percentualEmpenhado}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">% Pago</span>
                    <span className="font-semibold">{metricas.execucao.percentualPago}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deputados" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select value={deputadoSelecionado} onValueChange={setDeputadoSelecionado}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por deputado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os deputados</SelectItem>
                {dados.map(deputado => (
                  <SelectItem key={deputado.deputado.id} value={deputado.deputado.id.toString()}>
                    {deputado.deputado.nome} ({deputado.deputado.siglaPartido})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deputado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Emendas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Média por Emenda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deputadosFiltrados.map((deputado) => (
                    <tr key={deputado.deputado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          {deputado.deputado.urlFoto && (
                            <img 
                              src={deputado.deputado.urlFoto} 
                              alt={deputado.deputado.nome}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium">{deputado.deputado.nome}</div>
                            <div className="text-xs text-gray-500">{deputado.deputado.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge variant="outline">{deputado.deputado.siglaPartido}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deputado.totalEmendas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deputado.valorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deputado.totalEmendas > 0 
                          ? (deputado.valorTotal / deputado.totalEmendas).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })
                          : 'R$ 0,00'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge className="bg-green-100 text-green-800">
                          <User className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emendas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Resumo de Emendas */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Resumo de Emendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total de Emendas</span>
                    <span className="font-semibold">{metricas.investimento.totalEmendas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Média por Emenda</span>
                    <span className="font-semibold">
                      {metricas.investimento.mediaPorEmenda.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Deputados Ativos</span>
                    <span className="font-semibold">{metricas.cobertura.deputadosAtivos}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Emendas */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Detalhes das Emendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deputadosFiltrados.map((deputado) => 
                    deputado.emendas.map((emenda) => (
                      <div key={emenda.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium text-sm">
                              {emenda.numero} - {emenda.objeto}
                            </div>
                            <div className="text-xs text-gray-500">
                              {deputado.deputado.nome} • {emenda.municipio}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">
                            {emenda.valor.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {emenda.tipo}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 