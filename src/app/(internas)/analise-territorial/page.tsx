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

// Dados mockados simples
const DADOS_MOCKADOS = {
  municipios: [
    {
      id: '2210979',
      nome: 'Teresina',
      populacao: 868075,
      densidade: 747.1,
      votosDeputado: 125000,
      ranking: 1,
      percentualVotos: 15.2,
      valorEmendas: 25000000,
      percentualPago: 65.4,
      situacaoCAUC: 'REGULAR',
      nivelRisco: 'BAIXO'
    },
    {
      id: '2207702',
      nome: 'Parnaíba',
      populacao: 153482,
      densidade: 352.4,
      votosDeputado: 45000,
      ranking: 2,
      percentualVotos: 8.7,
      valorEmendas: 15000000,
      percentualPago: 72.1,
      situacaoCAUC: 'REGULAR',
      nivelRisco: 'BAIXO'
    },
    {
      id: '2208007',
      nome: 'Picos',
      populacao: 78334,
      densidade: 135.8,
      votosDeputado: 32000,
      ranking: 3,
      percentualVotos: 6.2,
      valorEmendas: 8000000,
      percentualPago: 58.9,
      situacaoCAUC: 'IRREGULAR',
      nivelRisco: 'MEDIO'
    },
    {
      id: '2203909',
      nome: 'Floriano',
      populacao: 60911,
      densidade: 17.9,
      votosDeputado: 28000,
      ranking: 4,
      percentualVotos: 5.4,
      valorEmendas: 6000000,
      percentualPago: 45.2,
      situacaoCAUC: 'REGULAR',
      nivelRisco: 'BAIXO'
    },
    {
      id: '2208403',
      nome: 'Piripiri',
      populacao: 63642,
      densidade: 45.2,
      votosDeputado: 25000,
      ranking: 5,
      percentualVotos: 4.8,
      valorEmendas: 5000000,
      percentualPago: 38.7,
      situacaoCAUC: 'IRREGULAR',
      nivelRisco: 'ALTO'
    }
  ],
  metricas: {
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
  const [tabAtiva, setTabAtiva] = useState('visao-geral');
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>('todos');
  const [dados, setDados] = useState(DADOS_MOCKADOS.municipios);
  const [metricas, setMetricas] = useState(DADOS_MOCKADOS.metricas);

  // Filtrar municípios baseado na seleção
  const municipiosFiltrados = dados.filter(m => 
    municipioSelecionado === 'todos' || m.id === municipioSelecionado
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Análise Territorial - Piauí</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Atualizar dados
          </Button>
        </div>
      </div>

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
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
                    <span className="text-sm text-gray-500">Média per capita</span>
                    <span className="font-semibold">
                      {metricas.investimento.mediaPerCapita.toLocaleString('pt-BR', {
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

        <TabsContent value="municipios" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select value={municipioSelecionado} onValueChange={setMunicipioSelecionado}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por município" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os municípios</SelectItem>
                {dados.map(municipio => (
                  <SelectItem key={municipio.id} value={municipio.id}>
                    {municipio.nome}
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
                      Município
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      População
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votos 2022
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ranking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Votos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emendas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risco
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {municipiosFiltrados.map((municipio) => (
                    <tr key={municipio.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {municipio.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {municipio.populacao.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {municipio.votosDeputado.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{municipio.ranking}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {municipio.percentualVotos}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {municipio.valorEmendas.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${municipio.percentualPago}%` }}
                            ></div>
                          </div>
                          <span>{municipio.percentualPago}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge className={getRiscoColor(municipio.nivelRisco)}>
                          {getRiscoIcon(municipio.nivelRisco)}
                          {municipio.nivelRisco}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risco" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Métricas de Risco */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  Métricas de Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Municípios Irregulares</span>
                    <span className="font-semibold">{metricas.risco.municipiosIrregulares}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">% Irregulares</span>
                    <span className="font-semibold">{metricas.risco.percentualIrregulares}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Valor em Risco</span>
                    <span className="font-semibold">
                      {metricas.risco.valorEmRisco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Municípios por Nível de Risco */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Municípios por Nível de Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {municipiosFiltrados.map((municipio) => (
                    <div key={municipio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRiscoIcon(municipio.nivelRisco)}
                        <div>
                          <div className="font-medium text-sm">{municipio.nome}</div>
                          <div className="text-xs text-gray-500">
                            CAUC: {municipio.situacaoCAUC}
                          </div>
                        </div>
                      </div>
                      <Badge className={getRiscoColor(municipio.nivelRisco)}>
                        {municipio.nivelRisco}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 