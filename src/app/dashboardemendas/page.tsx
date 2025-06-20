'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isUserLoggedIn } from '@/lib/storage';
import { toast } from 'react-hot-toast';
import { Loader2, RefreshCw, Search, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { disableConsoleLogging } from '@/lib/logger';

interface Emenda {
  id: string;
  emenda: string;
  classificacao_emenda: string;
  tipo: string;
  cnpj_beneficiario: string;
  municipio: string;
  objeto: string;
  gnd: string;
  nroproposta: string;
  portaria_convenio: string;
  ordemprioridade: string;
  objeto_obra: string;
  elaboracao: string;
  valor_indicado: number;
  alteracao: string;
  empenho: string;
  valor_empenho: number;
  dataempenho: string;
  valoraempenhar: number;
  pagamento: string;
  valorpago: number;
  valoraserpago: number;
  status_situacao: string;
  criadoEm: string;
  atualizadoEm: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardEmendasPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emendas, setEmendas] = useState<Emenda[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Função para buscar emendas
  const fetchEmendas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Iniciando busca de emendas - dados protegidos
      const response = await fetch('/api/emendas');
      const data = await response.json();
      
      // Resposta da API - dados protegidos
      
      if (!data.success) {
        const errorDetails = data.details || data.message || 'Erro ao buscar emendas';
        // Detalhes do erro - dados protegidos
        throw new Error(errorDetails);
      }
      
      if (!Array.isArray(data.data)) {
        // Formato de dados inválido - dados protegidos
        throw new Error('Formato de dados inválido recebido da API');
      }
      
      setEmendas(data.data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro ao carregar emendas: ${errorMessage}`);
      // Erro silencioso - não exibir logs por segurança
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    // Buscar emendas
    fetchEmendas();
  }, [router]);

  const handleRefresh = () => {
    fetchEmendas();
  };

  // Filtrar emendas pelo termo de busca
  const getEmendasFiltradas = () => {
    if (!searchTerm) return emendas;
    
    return emendas.filter(emenda => 
      emenda.emenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emenda.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emenda.status_situacao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Dados para os gráficos
  const dadosGraficoBarra = emendas.map(emenda => ({
    numero: emenda.emenda,
    valor: emenda.valor_indicado
  }));

  const dadosGraficoPizza = Object.entries(
    emendas.reduce((acc, emenda) => {
      acc[emenda.status_situacao] = (acc[emenda.status_situacao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, quantidade]) => ({
    status,
    quantidade
  }));

  if (!isUserLoggedIn()) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard de Emendas</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/criaremendas')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nova Emenda
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </button>
              <button
                onClick={() => router.push('/painel-aplicacoes')}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-600">Carregando emendas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro ao carregar emendas
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1 text-xs text-red-600">
                    Por favor, verifique o console do navegador (F12) para mais detalhes sobre o erro.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Campo de busca */}
            <div className="mb-6">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por número da emenda, município ou status..."
                  className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-center">Total de Emendas</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-3xl font-bold text-center text-blue-700">
                    {emendas.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-center">Valor Total Indicado</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-3xl font-bold text-center text-green-700">
                    {emendas.reduce((acc, emenda) => acc + emenda.valor_indicado, 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-center">Emendas Liquidadas</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-3xl font-bold text-center text-purple-700">
                    {emendas.filter(e => e.status_situacao === 'Liquidado').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Valor por Emenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGraficoBarra}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="numero" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="valor" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Status das Emendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosGraficoPizza}
                          dataKey="quantidade"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {dadosGraficoPizza.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Emendas */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Emendas</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {getEmendasFiltradas().length} emendas encontradas
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-background border-b">
                        <th className="text-left py-2">Número da Emenda</th>
                        <th className="text-left py-2">Município</th>
                        <th className="text-right py-2">Valor Indicado</th>
                        <th className="text-center py-2">Data Empenho</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getEmendasFiltradas().map((emenda) => (
                        <tr key={emenda.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{emenda.emenda}</td>
                          <td className="py-2">{emenda.municipio}</td>
                          <td className="text-right py-2">
                            {emenda.valor_indicado.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </td>
                          <td className="text-center py-2">{emenda.dataempenho}</td>
                          <td className="text-center py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              emenda.status_situacao === 'Liquidado' ? 'bg-green-100 text-green-800' :
                              emenda.status_situacao === 'Em Processo' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {emenda.status_situacao}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
} 