'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { 
  Loader2, 
  Building, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { isUserLoggedIn } from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { disableConsoleLogging } from '@/lib/logger';

// Interface para os dados de obras e demandas
interface ObraDemanda {
  [key: string]: string;
  'Coluna 1': string;
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
}

interface MatrizMunicipios {
  [municipio: string]: {
    obras: ObraDemanda[];
    total: number;
    quantidade: number;
  };
}

interface Filtros {
  MUNICIPIO: string[];
  STATUS: string[];
  LIDERANÇA: string[];
}

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

// Criar tipo para o estado de visibilidade das colunas
interface ColunasVisiveis {
  [key: string]: boolean;
  'Coluna 1': boolean;
  'ID': boolean;
  'DATA DEMANDA': boolean;
  'STATUS': boolean;
  'SOLICITAÇÃO': boolean;
  'OBS STATUS': boolean;
  'MUNICIPIO': boolean;
  'LIDERANÇA': boolean;
  'LIDERANÇA URNA': boolean;
  'PAUTA': boolean;
  'AÇÃO/OBJETO': boolean;
  'NÍVEL ESPAÇO': boolean;
  'ESFERA': boolean;
  'VALOR ': boolean;
  'ÓRGAO ': boolean;
  'PREVISÃO': boolean;
}

export default function ObrasDemandas() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<ObraDemanda[]>([]);
  const [dadosMock, setDadosMock] = useState(false);
  const [matrizMunicipios, setMatrizMunicipios] = useState<MatrizMunicipios>({});
  const [municipioExpandido, setMunicipioExpandido] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({
    MUNICIPIO: [],
    STATUS: [],
    LIDERANÇA: []
  });
  const [opcoesUnicas, setOpcoesUnicas] = useState<Filtros>({
    MUNICIPIO: [],
    STATUS: [],
    LIDERANÇA: []
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  // Atualizar a declaração do estado para usar o novo tipo
  const [colunasVisiveis, setColunasVisiveis] = useState<ColunasVisiveis>({
    'Coluna 1': false,
    'ID': false,
    'DATA DEMANDA': true,
    'STATUS': true,
    'SOLICITAÇÃO': true,
    'OBS STATUS': true,
    'MUNICIPIO': true,
    'LIDERANÇA': true,
    'LIDERANÇA URNA': false,
    'PAUTA': true,
    'AÇÃO/OBJETO': true,
    'NÍVEL ESPAÇO': true,
    'ESFERA': false,
    'VALOR ': true,
    'ÓRGAO ': true,
    'PREVISÃO': true
  });

  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }
  }, []);

  // Função para buscar dados da API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/obras_demandas');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar dados de obras e demandas');
      }
      
      setDados(data.data);
      setDadosMock(data.dadosMock);
      
      // Extrair opções únicas para os filtros
      const opcoesUnicas = data.data.reduce((acc: Filtros, obra: ObraDemanda) => {
        if (!acc.MUNICIPIO.includes(obra['MUNICIPIO'])) acc.MUNICIPIO.push(obra['MUNICIPIO']);
        if (!acc.STATUS.includes(obra['STATUS'])) acc.STATUS.push(obra['STATUS']);
        if (!acc.LIDERANÇA.includes(obra['LIDERANÇA'])) acc.LIDERANÇA.push(obra['LIDERANÇA']);
        return acc;
      }, { MUNICIPIO: [], STATUS: [], LIDERANÇA: [] });

      // Ordenar as opções alfabeticamente
      Object.keys(opcoesUnicas).forEach(key => {
        opcoesUnicas[key as keyof Filtros].sort();
      });

      setOpcoesUnicas(opcoesUnicas);

      // Criar matriz inicial
      atualizarMatriz(data.data);
      
      if (data.dadosMock) {
        toast('Exibindo dados de exemplo. Conecte à planilha para ver dados reais.', {
          duration: 5000,
          icon: '⚠️',
          style: {
            border: '1px solid #F0B429',
            padding: '16px',
            color: '#975A16',
            background: '#FFFBEB',
          },
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro ao carregar dados: ${errorMessage}`);
      console.error('Erro ao buscar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarMatriz = (dados: ObraDemanda[]) => {
    // Aplicar filtros
    const obrasFiltradas = dados.filter(obra => {
      const passouFiltroMunicipio = filtros.MUNICIPIO.length === 0 || filtros.MUNICIPIO.includes(obra['MUNICIPIO']);
      const passouFiltroStatus = filtros.STATUS.length === 0 || filtros.STATUS.includes(obra['STATUS']);
      const passouFiltroLideranca = filtros.LIDERANÇA.length === 0 || filtros.LIDERANÇA.includes(obra['LIDERANÇA']);

      return passouFiltroMunicipio && passouFiltroStatus && passouFiltroLideranca;
    });

    // Agrupar por município
    const matrizTemp = obrasFiltradas.reduce((acc: MatrizMunicipios, obra) => {
      const municipio = obra['MUNICIPIO'];
      if (!acc[municipio]) {
        acc[municipio] = {
          obras: [],
          total: 0,
          quantidade: 0
        };
      }
      
      // Converter o valor para número antes de somar
      let valorNumerico = 0;
      if (obra['VALOR ']) {
        // Remove pontos dos milhares e substitui vírgula por ponto para converter para número
        const valorLimpo = obra['VALOR '].replace(/\./g, '').replace(',', '.');
        valorNumerico = parseFloat(valorLimpo) || 0;
      }

      acc[municipio].obras.push(obra);
      acc[municipio].total += valorNumerico;
      acc[municipio].quantidade += 1;
      
      return acc;
    }, {});

    // Ordenar municípios
    const matrizOrdenada = Object.entries(matrizTemp)
      .sort(([municipioA], [municipioB]) => municipioA.localeCompare(municipioB))
      .reduce((acc: MatrizMunicipios, [municipio, dados]) => {
        acc[municipio] = dados;
        return acc;
      }, {});

    setMatrizMunicipios(matrizOrdenada);
  };

  useEffect(() => {
    setIsClient(true);
    
    // Remover a verificação de login
    // Buscar dados da API diretamente
    fetchData();
  }, [router]);

  useEffect(() => {
    if (dados.length > 0) {
      atualizarMatriz(dados);
    }
  }, [filtros]);

  const handleRefresh = () => {
    fetchData();
  };

  const toggleMunicipio = (municipio: string) => {
    setMunicipioExpandido(municipioExpandido === municipio ? null : municipio);
  };

  const formatarValor = (valor: string | number | undefined | null) => {
    if (valor === undefined || valor === null || valor === '') {
      return 'R$ 0,00';
    }

    // Se for string, primeiro remove os pontos dos milhares e substitui vírgula por ponto
    if (typeof valor === 'string') {
      valor = valor.replace(/\./g, '').replace(',', '.');
    }

    const numeroValor = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    if (isNaN(numeroValor)) {
      return 'R$ 0,00';
    }

    return numeroValor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const sortData = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });

    const sortedData = Object.entries(matrizMunicipios)
      .sort(([municipioA], [municipioB]) => {
        if (key === 'municipio') {
          return direction === 'asc' 
            ? municipioA.localeCompare(municipioB)
            : municipioB.localeCompare(municipioA);
        }

        if (key === 'total') {
          return direction === 'asc'
            ? matrizMunicipios[municipioA].total - matrizMunicipios[municipioB].total
            : matrizMunicipios[municipioB].total - matrizMunicipios[municipioA].total;
        }

        return 0;
      })
      .reduce((acc: MatrizMunicipios, [municipio, dados]) => {
        acc[municipio] = dados;
        return acc;
      }, {});

    setMatrizMunicipios(sortedData);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col">
        {/* Barra de informações da página */}
        <div className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Obras e Demandas</span>
              <span className="text-xs text-gray-500 font-light">Acompanhe o status de obras e demandas por município.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border ${
                  isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 cursor-pointer'
                } border-gray-200`}
                title="Atualizar dados"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <main className="p-0 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-600">Carregando dados...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg m-4">
              {error}
            </div>
          ) : (
            <>
              {dadosMock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-700">
                    Exibindo dados de exemplo. Conecte à planilha para ver dados reais.
                  </p>
                </div>
              )}

              <Card>
                <CardHeader>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione os municípios" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                            {opcoesUnicas.MUNICIPIO.map(opcao => (
                              <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`municipio-${opcao}`}
                                  checked={filtros.MUNICIPIO.includes(opcao)}
                                  onCheckedChange={(checked: boolean) => {
                                    if (checked) {
                                      setFiltros(prev => ({ ...prev, MUNICIPIO: [...prev.MUNICIPIO, opcao] }));
                                    } else {
                                      setFiltros(prev => ({ ...prev, MUNICIPIO: prev.MUNICIPIO.filter(m => m !== opcao) }));
                                    }
                                  }}
                                />
                                <label htmlFor={`municipio-${opcao}`} className="text-sm cursor-pointer">{opcao}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione os status" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                            {opcoesUnicas.STATUS.map(opcao => (
                              <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`status-${opcao}`}
                                  checked={filtros.STATUS.includes(opcao)}
                                  onCheckedChange={(checked: boolean) => {
                                    if (checked) {
                                      setFiltros(prev => ({ ...prev, STATUS: [...prev.STATUS, opcao] }));
                                    } else {
                                      setFiltros(prev => ({ ...prev, STATUS: prev.STATUS.filter(s => s !== opcao) }));
                                    }
                                  }}
                                />
                                <label htmlFor={`status-${opcao}`} className="text-sm cursor-pointer">{opcao}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Liderança</label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione as lideranças" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                            {opcoesUnicas.LIDERANÇA.map(opcao => (
                              <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`lideranca-${opcao}`}
                                  checked={filtros.LIDERANÇA.includes(opcao)}
                                  onCheckedChange={(checked: boolean) => {
                                    if (checked) {
                                      setFiltros(prev => ({ ...prev, LIDERANÇA: [...prev.LIDERANÇA, opcao] }));
                                    } else {
                                      setFiltros(prev => ({ ...prev, LIDERANÇA: prev.LIDERANÇA.filter(l => l !== opcao) }));
                                    }
                                  }}
                                />
                                <label htmlFor={`lideranca-${opcao}`} className="text-sm cursor-pointer">{opcao}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Configurar Colunas</label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Mostrar/Ocultar Colunas" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                            {Object.keys(colunasVisiveis).map(coluna => (
                              <div key={coluna} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                                <Checkbox
                                  id={`coluna-${coluna}`}
                                  checked={colunasVisiveis[coluna]}
                                  onCheckedChange={(checked: boolean) => {
                                    setColunasVisiveis(prev => ({
                                      ...prev,
                                      [coluna]: checked
                                    }));
                                  }}
                                />
                                <label htmlFor={`coluna-${coluna}`} className="text-sm cursor-pointer">{coluna}</label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Tabela de Matriz */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left" style={{ width: '40px' }}></th>
                            <th className="px-4 py-3 text-left">
                              <button
                                className="flex items-center gap-1 hover:text-blue-600"
                                onClick={() => sortData('municipio')}
                              >
                                Município
                                <ArrowUpDown className="h-4 w-4" />
                              </button>
                            </th>
                            <th className="px-4 py-3 text-right">
                              <button
                                className="flex items-center gap-1 hover:text-blue-600 ml-auto"
                                onClick={() => sortData('total')}
                              >
                                Valor Total
                                <ArrowUpDown className="h-4 w-4" />
                              </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(matrizMunicipios).map(([municipio, dados]) => (
                            <React.Fragment key={municipio}>
                              <tr className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => toggleMunicipio(municipio)}
                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200"
                                  >
                                    <ChevronDown className={`h-5 w-5 transform transition-transform ${municipioExpandido === municipio ? 'rotate-180' : ''}`} />
                                  </button>
                                </td>
                                <td className="px-4 py-3">
                                  {municipio}
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({dados.quantidade} obras)
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-green-600">
                                  {formatarValor(dados.total)}
                                </td>
                              </tr>
                              
                              {municipioExpandido === municipio && (
                                <tr>
                                  <td colSpan={3} className="px-4 py-3 bg-gray-50">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          {Object.entries(colunasVisiveis).map(([coluna, visivel]) => 
                                            visivel && (
                                              <th key={coluna} className="px-4 py-2 text-left">
                                                {coluna}
                                              </th>
                                            )
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {dados.obras.map((obra, idx) => (
                                          <tr key={idx} className="border-b hover:bg-gray-50">
                                            {Object.entries(colunasVisiveis).map(([coluna, visivel]) => 
                                              visivel && (
                                                <td key={coluna} className={`px-4 py-2 ${coluna === 'VALOR ' ? 'text-right text-green-600' : ''}`}>
                                                  {coluna === 'STATUS' ? (
                                                    <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-sm ${getStatusConfig(obra[coluna]).color}`}>
                                                      {getStatusConfig(obra[coluna]).icon}
                                                      {obra[coluna]}
                                                    </div>
                                                  ) : coluna === 'VALOR ' ? (
                                                    formatarValor(obra[coluna])
                                                  ) : (
                                                    obra[coluna]
                                                  )}
                                                </td>
                                              )
                                            )}
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
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
        
        {/* Footer */}
        <footer className="mt-auto text-center py-3 text-xs text-gray-500 border-t border-gray-100">
          © 2025 86 Dynamics - Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
} 