"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Clock, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

// Tipo para as colunas disponíveis
type ColunaObraDemanda = 'DATA DEMANDA' | 'STATUS' | 'SOLICITAÇÃO' | 'OBS STATUS' | 'MUNICIPIO' | 'LIDERANÇA' | 'LIDERANÇA URNA' | 'PAUTA' | 'AÇÃO/OBJETO' | 'NÍVEL ESPAÇO' | 'ESFERA' | 'VALOR ' | 'ÓRGAO ' | 'PREVISÃO';

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
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>("");
  const [statusSelecionado, setStatusSelecionado] = useState<string>("");
  const [liderancaSelecionada, setLiderancaSelecionada] = useState<string>("");
  const [municipiosExpandidos, setMunicipiosExpandidos] = useState<Set<string>>(new Set());
  const [configurandoColunas, setConfigurandoColunas] = useState(false);
  const [colunasVisiveis, setColunasVisiveis] = useState<ColunasVisiveis>({
    'DATA DEMANDA': true,
    'STATUS': true,
    'SOLICITAÇÃO': true,
    'OBS STATUS': true,
    'MUNICIPIO': true,
    'LIDERANÇA': true,
    'LIDERANÇA URNA': true,
    'PAUTA': true,
    'AÇÃO/OBJETO': true,
    'NÍVEL ESPAÇO': true,
    'ESFERA': true,
    'VALOR ': true,
    'ÓRGAO ': true,
    'PREVISÃO': true
  });

  // Função para buscar dados
  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/obras_demandas');
      const data = await response.json();
      if (data.success) {
        setDados(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
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
    const matchMunicipio = !municipioSelecionado || obra.MUNICIPIO === municipioSelecionado;
    const matchStatus = !statusSelecionado || obra.STATUS === statusSelecionado;
    const matchLideranca = !liderancaSelecionada || obra['LIDERANÇA'] === liderancaSelecionada;
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Header e Filtros */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-900">Obras e Demandas</h1>
            <p className="text-sm text-gray-500">Acompanhe o status de obras e demandas por município.</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Município</label>
              <select
                value={municipioSelecionado}
                onChange={(e) => setMunicipioSelecionado(e.target.value)}
                className="text-sm border border-gray-200 rounded px-2 py-1.5"
              >
                <option value="">Selecione os municípios</option>
                {Array.from(new Set(dados.map(d => d.MUNICIPIO))).sort().map(municipio => (
                  <option key={municipio} value={municipio}>{municipio}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value)}
                className="text-sm border border-gray-200 rounded px-2 py-1.5"
              >
                <option value="">Selecione os status</option>
                {Array.from(new Set(dados.map(d => d.STATUS))).sort().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Liderança</label>
              <select
                value={liderancaSelecionada}
                onChange={(e) => setLiderancaSelecionada(e.target.value)}
                className="text-sm border border-gray-200 rounded px-2 py-1.5"
              >
                <option value="">Selecione as lideranças</option>
                {Array.from(new Set(dados.map(d => d['LIDERANÇA']))).sort().map(lideranca => (
                  <option key={lideranca} value={lideranca}>{lideranca}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Configurar Colunas</label>
              <button
                onClick={() => setConfigurandoColunas(!configurandoColunas)}
                className="text-sm border border-gray-200 rounded px-2 py-1.5 text-left bg-white hover:bg-gray-50"
              >
                Mostrar/Ocultar Colunas
              </button>
            </div>
          </div>

          {/* Painel de configuração de colunas */}
          {configurandoColunas && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(colunasVisiveis).map(([coluna, visivel]) => (
                  <label key={coluna} className="flex items-center space-x-2">
                    <Checkbox
                      checked={visivel}
                      onCheckedChange={(checked) => {
                        setColunasVisiveis(prev => ({
                          ...prev,
                          [coluna]: checked === true
                        }));
                      }}
                    />
                    <span className="text-sm">{coluna.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Municípios */}
      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cabeçalho da lista */}
          <div className="border-b border-gray-200">
            <div className="py-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-900">Município</div>
                <div className="text-sm font-medium text-gray-900">Valor Total</div>
              </div>
            </div>
          </div>

          {/* Lista de municípios com acordeão */}
          <div className="divide-y divide-gray-200">
            {Object.entries(dadosPorMunicipio).sort().map(([municipio, obras]) => {
              const totalValor = obras.reduce((sum, obra) => sum + converterValorParaNumero(obra['VALOR ']), 0);
              const isExpanded = municipiosExpandidos.has(municipio);
              
              return (
                <div key={municipio}>
                  <button 
                    onClick={() => toggleMunicipio(municipio)}
                    className="w-full py-3 flex justify-between items-center text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{municipio}</span>
                      <span className="text-xs text-gray-500">({obras.length} obras)</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {formatarValor(totalValor)}
                    </span>
                  </button>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      <div className="overflow-x-auto">
                        {/* Tabela para desktop */}
                        <div className="hidden md:block">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                {Object.entries(colunasVisiveis)
                                  .filter(([_, visivel]) => visivel)
                                  .map(([coluna]) => (
                                    <th
                                      key={coluna}
                                      className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      {coluna.replace(/_/g, ' ')}
                                    </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {obras.map((obra, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  {Object.entries(colunasVisiveis)
                                    .filter(([_, visivel]) => visivel)
                                    .map(([coluna]) => {
                                      const col = coluna as ColunaObraDemanda;
                                      // Renderização especial para STATUS
                                      if (col === 'STATUS') {
                                        const config = getStatusConfig(obra[col]);
                                        return (
                                          <td key={col} className="py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                              {config.icon}
                                              {obra[col]}
                                            </span>
                                          </td>
                                        );
                                      }
                                      
                                      // Renderização especial para VALOR
                                      if (col === 'VALOR ') {
                                        return (
                                          <td key={col} className="py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                                            {formatarValor(obra[col])}
                                          </td>
                                        );
                                      }
                                      
                                      // Renderização padrão para outras colunas
                                      return (
                                        <td key={col} className="py-3 text-sm text-gray-900">
                                          {obra[col]}
                                        </td>
                                      );
                                    })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Cards para mobile */}
                        <div className="md:hidden divide-y divide-gray-200">
                          {obras.map((obra, idx) => (
                            <div key={idx} className="bg-white hover:bg-gray-50">
                              <div className="py-3 space-y-2">
                                {/* Data e Status sempre visíveis */}
                                <div className="flex justify-between items-start">
                                  <span className="text-xs text-gray-500">{obra['DATA DEMANDA']}</span>
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(obra.STATUS).color}`}>
                                    {getStatusConfig(obra.STATUS).icon}
                                    {obra.STATUS}
                                  </div>
                                </div>

                                {/* Solicitação em destaque */}
                                <div className="text-sm text-gray-900 font-medium">
                                  {obra['SOLICITAÇÃO']}
                                </div>

                                {/* Grid de informações adicionais */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  {obra['LIDERANÇA'] && (
                                    <div>
                                      <span className="text-gray-500">Liderança:</span>{' '}
                                      <span className="font-medium">{obra['LIDERANÇA']}</span>
                                    </div>
                                  )}
                                  
                                  {obra['AÇÃO/OBJETO'] && (
                                    <div>
                                      <span className="text-gray-500">Ação/Objeto:</span>{' '}
                                      <span className="font-medium">{obra['AÇÃO/OBJETO']}</span>
                                    </div>
                                  )}
                                  
                                  {obra['ÓRGAO '] && (
                                    <div>
                                      <span className="text-gray-500">Órgão:</span>{' '}
                                      <span className="font-medium">{obra['ÓRGAO ']}</span>
                                    </div>
                                  )}
                                  
                                  {obra['VALOR '] && (
                                    <div>
                                      <span className="text-gray-500">Valor:</span>{' '}
                                      <span className="font-medium text-green-600">{formatarValor(obra['VALOR '])}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Observações e informações adicionais */}
                                {obra['OBS STATUS'] && (
                                  <div className="text-sm text-gray-500 bg-gray-50 rounded p-2 mt-2">
                                    {obra['OBS STATUS']}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 