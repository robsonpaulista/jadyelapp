'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface Emenda {
  id: string;
  emenda: string;
  municipio: string;
  valor_indicado: number;
  objeto: string;
  valor_empenhado: number;
  liderancas: string;
  classificacao_emenda: string;
  natureza: string;
  status: string;
  fase: string;
  rowIndex: number;
}

interface FaseData {
  fase: string;
  emendas: Emenda[];
  totalValorIndicado: number;
  totalValorEmpenhado: number;
}

export default function Emendas2025() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emendas, setEmendas] = useState<Emenda[]>([]);
  const [fases, setFases] = useState<FaseData[]>([]);
  const [fasesExpandidas, setFasesExpandidas] = useState<Set<string>>(new Set(['1ª fase']));

  // Buscar dados das emendas
  const fetchEmendas = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = forceRefresh ? '/api/emendas?forceRefresh=true' : '/api/emendas';
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log('Dados recebidos da API:', data);
      
      if (data.sucesso && data.dados) {
        setEmendas(data.dados);
        processarFases(data.dados);
        toast.success(`${data.dados.length} emendas carregadas com sucesso!`);
      } else {
        throw new Error(data.mensagem || 'Erro ao carregar dados das emendas');
      }
    } catch (error: any) {
      console.error('Erro ao buscar emendas:', error);
      setError(error.message || 'Erro ao carregar dados das emendas');
      toast.error('Erro ao buscar dados. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Processar dados e agrupar por fases
  const processarFases = (dados: Emenda[]) => {
    const faseMap = new Map<string, Emenda[]>();
    
    dados.forEach(emenda => {
      const fase = emenda.fase || 'Sem fase definida';
      if (!faseMap.has(fase)) {
        faseMap.set(fase, []);
      }
      faseMap.get(fase)!.push(emenda);
    });

    const fasesProcessadas: FaseData[] = Array.from(faseMap.entries()).map(([fase, emendas]) => {
      const totalValorIndicado = emendas.reduce((acc, emenda) => acc + (emenda.valor_indicado || 0), 0);
      const totalValorEmpenhado = emendas.reduce((acc, emenda) => acc + (emenda.valor_empenhado || 0), 0);
      
      return {
        fase,
        emendas,
        totalValorIndicado,
        totalValorEmpenhado
      };
    });

    // Ordenar fases (1ª fase primeiro, depois 2ª fase, etc.)
    fasesProcessadas.sort((a, b) => {
      if (a.fase.includes('1ª')) return -1;
      if (b.fase.includes('1ª')) return 1;
      if (a.fase.includes('2ª')) return -1;
      if (b.fase.includes('2ª')) return 1;
      return a.fase.localeCompare(b.fase);
    });

    setFases(fasesProcessadas);
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchEmendas();
  }, []);

  const formatarValor = (valor: number) => {
    if (!valor || valor === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ok':
        return 'text-green-600 bg-green-50';
      case 'pendente':
        return 'text-yellow-600 bg-yellow-50';
      case 'erro':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const toggleFase = (fase: string) => {
    setFasesExpandidas(prev => {
      const novas = new Set(prev);
      if (novas.has(fase)) {
        novas.delete(fase);
      } else {
        novas.add(fase);
      }
      return novas;
    });
  };

  const expandirTodasFases = () => {
    setFasesExpandidas(new Set(fases.map(f => f.fase)));
  };

  const recolherTodasFases = () => {
    setFasesExpandidas(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Emendas 2025</span>
              <span className="text-xs text-gray-500 font-light">Carregando dados da planilha...</span>
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
    valorIndicado: fases.reduce((acc, fase) => acc + fase.totalValorIndicado, 0),
    valorEmpenhado: fases.reduce((acc, fase) => acc + fase.totalValorEmpenhado, 0),
    totalEmendas: emendas.length
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Emendas 2025</span>
            <span className="text-xs text-gray-500 font-light">
              {totaisGerais.totalEmendas} emenda(s) em {fases.length} fase(s)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={expandirTodasFases}
              variant="outline"
              size="sm"
            >
              Expandir Todas
            </Button>
            <Button
              onClick={recolherTodasFases}
              variant="outline"
              size="sm"
            >
              Recolher Todas
            </Button>
            <Button
              onClick={() => fetchEmendas(true)}
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
        {/* Resumo geral */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total de Emendas</p>
                <p className="text-2xl font-bold text-blue-900">{totaisGerais.totalEmendas}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Valor Total Indicado</p>
                <p className="text-2xl font-bold text-green-900">{formatarValor(totaisGerais.valorIndicado)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Valor Total a Empenhar</p>
                <p className="text-2xl font-bold text-purple-900">{formatarValor(totaisGerais.valorEmpenhado)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fases das emendas */}
        <div className="space-y-4">
          {fases.map((fase) => (
            <div key={fase.fase} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Cabeçalho da fase */}
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFase(fase.fase)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {fasesExpandidas.has(fase.fase) ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{fase.fase}</h3>
                    <span className="text-sm text-gray-500">
                      ({fase.emendas.length} emendas)
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Valor Indicado:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatarValor(fase.totalValorIndicado)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">A Empenhar:</span>
                      <span className="ml-2 font-medium text-purple-600">
                        {formatarValor(fase.totalValorEmpenhado)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteúdo da fase */}
              {fasesExpandidas.has(fase.fase) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Emenda</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Município/Beneficiário</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Valor Indicado</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Objeto</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Valor a Empenhar</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Lideranças</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Classificação</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Natureza</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {fase.emendas.map((emenda, index) => (
                        <tr key={emenda.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{emenda.emenda}</td>
                          <td className="px-4 py-3 text-gray-900">{emenda.municipio}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {formatarValor(emenda.valor_indicado)}
                          </td>
                          <td className="px-4 py-3 text-gray-900 max-w-xs truncate" title={emenda.objeto}>
                            {emenda.objeto}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-purple-600">
                            {formatarValor(emenda.valor_empenhado)}
                          </td>
                          <td className="px-4 py-3 text-gray-900">{emenda.liderancas}</td>
                          <td className="px-4 py-3 text-gray-900">{emenda.classificacao_emenda}</td>
                          <td className="px-4 py-3 text-gray-900">{emenda.natureza}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(emenda.status)}`}>
                              {emenda.status}
                            </span>
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

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Debug Info:</h3>
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify({ 
                totalFases: fases.length,
                totalEmendas: emendas.length,
                primeiraEmenda: emendas[0] || null 
              }, null, 2)}
            </pre>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-500 border-t border-gray-100">
        © 2025 86 Dynamics - Todos os direitos reservados
      </footer>
    </div>
  );
} 