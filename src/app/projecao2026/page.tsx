'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isUserLoggedIn, getCurrentUser } from '@/lib/storage';
import { toast } from 'react-hot-toast';
import { Loader2, User, CheckCircle, XCircle, Award, ChevronDown, ChevronRight, Search, RefreshCw, Vote, DollarSign, Wallet, CreditCard, Receipt, ChevronLeft, ShieldCheck, Home, Filter, Check, X } from 'lucide-react';
import VoiceAssistant from '@/components/VoiceAssistant';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buscarVotacao } from '@/lib/votacao';
import { disableConsoleLogging } from '@/lib/logger';

interface DadosProjecao {
  municipio: string;
  votacao2022: string;
  votosProjetados: string;
  votos: number;
  lideranca: string;
  liderancaAtual: boolean;
  cargo2024: string;
  percentual: number;
}

// Interface para os dados agrupados de liderança
interface LiderancaAgrupada {
  municipio: string;
  lideranca: string;
  liderancaAtual: boolean;
  cargo2024: string;
  votos: number;
  id: string;
}

// Interface para os dados agrupados de município
interface MunicipioAgrupado {
  municipio: string;
  liderancas: LiderancaAgrupada[];
  totalVotos: number;
  votacao2022: number;
  id: string;
}

// Interface para as estatísticas agrupadas
interface StatsData {
  totalVotos: number;
  totalVotos2022: number;
  variacaoPercentual: number;
  totalLiderancasAtuais: number;
  totalMunicipios: number;
  mediaVotosPorMunicipio: number;
  cargoCount: Record<string, number>;
}

// Interface para os dados da planilha
interface PlanilhaData {
  municipio: string;
  votacao2022: string;
  votosProjetados: string;
}

// Cores para diferentes cargos
const CARGO_COLORS: Record<string, string> = {
  'Prefeito': '#4F46E5',
  'Vereador': '#10B981',
  'Não candidato': '#F59E0B',
  'Não informado': '#6B7280'
};

export default function ProjecaoVotacao2026Page() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dadosProjecao, setDadosProjecao] = useState<DadosProjecao[]>([]);
  const [totalVotos, setTotalVotos] = useState(0);
  const [stats, setStats] = useState<{
    totalVotos: number;
    totalVotos2022: number;
    variacaoPercentual: number;
    totalLiderancasAtuais: number;
    totalMunicipios: number;
    mediaVotosPorMunicipio: number;
    cargoCount: Record<string, number>;
  }>({
    totalVotos: 0,
    totalVotos2022: 0,
    variacaoPercentual: 0,
    totalLiderancasAtuais: 0,
    totalMunicipios: 0,
    mediaVotosPorMunicipio: 0,
    cargoCount: {}
  });
  const [dadosMock, setDadosMock] = useState(false);
  const [filtro, setFiltro] = useState<string>('todos');
  const [expandedMunicipios, setExpandedMunicipios] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDataReady, setIsDataReady] = useState(false);
  const [hoveredMunicipio, setHoveredMunicipio] = useState<string | null>(null);
  
  // Estado para usuário logado
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Saudação baseada no horário
  const greeting = (() => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return 'Bom dia';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  })();
  
  // Carregar informações do usuário
  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    try {
      const user = getCurrentUser();
      if (user) {
        // Usuário carregado - dados protegidos
        setCurrentUser(user);
      } else {
        // Nenhum usuário encontrado - dados protegidos
        // Usuário padrão para testes
        setCurrentUser({
          name: "ROBSON MEDEIROS SANTOS",
          role: "admin"
        });
      }
    } catch (error) {
      // Erro silencioso - não exibir logs por segurança
      // Usuário padrão em caso de erro
      setCurrentUser({
        name: "ROBSON MEDEIROS SANTOS",
        role: "admin"
      });
    }
  }, []);

  // Função para calcular estatísticas
  const calculateStats = (dados: DadosProjecao[]): StatsData => {
    // Dados detalhados - informação protegida
    // Total de registros - dados protegidos
    
    // Total de votos projetados para 2026 (considerando todas as lideranças)
    const totalVotos = dados.reduce((acc, item) => {
      const votosStr = item.votosProjetados || '0';
      const votos = parseInt(votosStr.replace(/,/g, ''), 10) || 0;
      // Somando votos - dados protegidos
      return acc + votos;
    }, 0);
    
    // Total de votos - dados protegidos
    
    // Total de votos de 2022 (considerando todas as lideranças)
    const totalVotos2022 = dados.reduce((acc, item) => {
      const votos2022 = parseInt(item.votacao2022.replace(/,/g, '') || '0', 10);
      return acc + votos2022;
    }, 0);
    
    // Variação percentual entre 2022 e 2026
    const variacaoPercentual = totalVotos2022 > 0 
      ? ((totalVotos - totalVotos2022) / totalVotos2022) * 100 
      : 0;

    // Agrupar votos por município
    const votosPorMunicipio = dados.reduce((acc, item) => {
      const municipio = item.municipio;
      const votosStr = item.votosProjetados || '0';
      const votos = parseInt(votosStr.replace(/,/g, ''), 10) || 0;
      
      if (!acc[municipio]) {
        acc[municipio] = 0;
      }
      acc[municipio] += votos;
      return acc;
    }, {} as Record<string, number>);
    
    // Contar municípios com votos > 0
    const municipiosComVotos = Object.entries(votosPorMunicipio)
      .filter(([_, votos]) => votos > 0);
    
    // Municípios com votos - dados protegidos
    // Total de municípios com votos - dados protegidos
    // Lista de municípios e seus votos - dados protegidos
    
    const totalMunicipios = municipiosComVotos.length;
    const mediaVotosPorMunicipio = totalMunicipios > 0 ? Math.round(totalVotos / totalMunicipios) : 0;

    // Contar lideranças atuais (apenas para exibição)
    const totalLiderancasAtuais = dados.filter(item => item.liderancaAtual).length;

    const stats = {
      totalVotos,
      totalVotos2022,
      variacaoPercentual,
      totalLiderancasAtuais,
      totalMunicipios,
      mediaVotosPorMunicipio,
      cargoCount: dados.reduce((acc, item) => {
        const cargo = item.cargo2024 || 'Não informado';
        acc[cargo] = (acc[cargo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  };

  // Função para buscar dados da API
  const fetchProjecaoData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar autenticação para dados reais
      if (!isUserLoggedIn()) {
        console.warn('Usuário não autenticado, os dados reais podem não estar disponíveis');
      }
      
      const response = await fetch('/api/projecao');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar dados de projeção');
      }
      
      // Log para debug dos dados recebidos
      console.log('Dados recebidos da API:', {
        totalVotos: data.totalVotos,
        totalMunicipios: data.totalMunicipios,
        mediaVotos: data.mediaVotos,
        liderancas: data.liderancas?.length,
        registros: data.data?.length
      });
      
      // Verificar se data.data existe e é um array
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Formato de dados inválido recebido da API');
      }
      
      const dadosTransformados: DadosProjecao[] = data.data.map((d: any) => ({
        municipio: d.municipio || '',
        votacao2022: d.votacao2022 || '0',
        votosProjetados: d.votos?.toString() || '0',
        votos: parseInt(d.votos?.toString().replace(/,/g, '') || '0', 10),
        lideranca: d.lideranca || '',
        liderancaAtual: d.liderancaAtual || false,
        cargo2024: d.cargo2024 || '',
        percentual: d.percentual || 0
      }));
      
      setDadosProjecao(dadosTransformados);
      setDadosMock(data.dadosMock);
      setIsDataReady(true);
      
      // Calcular estatísticas
      const novasStats = calculateStats(dadosTransformados);
      console.log('Estatísticas calculadas:', novasStats);
      
      // Atualizar as estatísticas e o total de votos
      setStats(novasStats);
      setTotalVotos(novasStats.totalVotos);
      
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

  useEffect(() => {
    setIsClient(true);
    
    // Buscar dados da API
    fetchProjecaoData();
  }, [router]);

  useEffect(() => {
    if (dadosProjecao.length > 0) {
      const newStats = calculateStats(dadosProjecao);
      
      // Calcular variação percentual
      const totalVotos2022 = dadosProjecao.reduce((acc, item) => {
        return acc + parseInt(item.votacao2022.replace(/,/g, '') || '0', 10);
      }, 0);
      
      const totalVotosProjetados = dadosProjecao.reduce((acc, item) => {
        return acc + item.votos;
      }, 0);
      
      const variacaoPercentual = totalVotos2022 > 0 
        ? ((totalVotosProjetados - totalVotos2022) / totalVotos2022) * 100 
        : 0;
      
      setStats({
        ...newStats,
        totalVotos2022,
        variacaoPercentual
      });
    }
  }, [dadosProjecao]);

  useEffect(() => {
    if (dadosProjecao.length > 0) {
      console.log('Dados carregados:', {
        totalRegistros: dadosProjecao.length,
        primeiros5: dadosProjecao.slice(0, 5),
        ultimaAtualizacao: new Date().toISOString()
      });
    }
  }, [dadosProjecao]);

  const handleRefresh = () => {
    fetchProjecaoData();
  };

  // Alternar expansão do município
  const toggleMunicipio = (municipioId: string) => {
    setExpandedMunicipios(prev => ({
      ...prev,
      [municipioId]: !prev[municipioId]
    }));
  };

  // Função para filtrar dados
  const getDadosFiltrados = () => {
    if (!dadosProjecao.length) {
      console.log('Nenhum dado disponível para filtrar');
      return [];
    }

    console.log('=== INÍCIO DO FILTRO ===');
    console.log('Total de registros antes do filtro:', dadosProjecao.length);
    console.log('Filtro selecionado:', filtro);
    
    // Primeiro filtramos por votos > 0
    const dadosComVotos = dadosProjecao.filter(item => {
      const votosProjetadosStr = item.votosProjetados?.replace(/,/g, '') || '0';
      const votosProjetados = parseInt(votosProjetadosStr, 10);
      const votos = item.votos || 0;
      
      // Usar o maior valor entre votos e votosProjetados
      const votosEfetivos = Math.max(votosProjetados, votos);
      return votosEfetivos > 0;
    });
    
    // Agora aplicamos o filtro selecionado
    const dadosFiltrados = dadosComVotos.filter(item => {
      // Filtro por termo de busca (se existir)
      const matchesSearch = searchTerm ? 
        item.municipio.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.lideranca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cargo2024 || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;
        
      // Se não corresponde à busca, já retorna falso
      if (!matchesSearch) return false;
      
      // Aplicar filtro por tipo
      if (filtro === 'todos') {
        return true;
      } else if (filtro === 'liderancas-atuais') {
        return item.liderancaAtual === true;
      } else {
        // Filtro por cargo específico
        return (item.cargo2024 || 'Não informado') === filtro;
      }
    });
    
    console.log('Total de registros após filtro por votos > 0:', dadosComVotos.length);
    console.log('Total de registros após filtro selecionado:', dadosFiltrados.length);
    console.log('========================');
    
    return dadosFiltrados;
  };

  // Função para agrupar dados por município
  const getDadosAgrupados = () => {
    const dadosFiltrados = getDadosFiltrados();
    
    console.log('=== INÍCIO DO AGRUPAMENTO ===');
    console.log('Total de registros filtrados:', dadosFiltrados.length);
    
    // Verificar municípios únicos antes do agrupamento
    const municipiosUnicos = new Set(dadosFiltrados.map(item => item.municipio));
    console.log('Municípios únicos antes do agrupamento:', municipiosUnicos.size);
    console.log('Lista de municípios antes do agrupamento:');
    municipiosUnicos.forEach(municipio => console.log(municipio));
    
    // Agrupar por município
    const agrupados = dadosFiltrados.reduce((acc: Record<string, MunicipioAgrupado>, item) => {
      const votosProjetadosStr = item.votosProjetados?.replace(/,/g, '') || '0';
      const votosProjetados = parseInt(votosProjetadosStr, 10);
      const votos = item.votos || 0;
      const votosEfetivos = Math.max(votosProjetados, votos);
      
      if (!acc[item.municipio]) {
        acc[item.municipio] = {
          municipio: item.municipio,
          liderancas: [],
          totalVotos: 0,
          votacao2022: parseInt(item.votacao2022.replace(/,/g, '') || '0', 10),
          id: item.municipio
        };
      }
      
      acc[item.municipio].liderancas.push({
        municipio: item.municipio,
        lideranca: item.lideranca,
        liderancaAtual: item.liderancaAtual,
        cargo2024: item.cargo2024,
        votos: votosEfetivos,
        id: `${item.municipio}-${item.lideranca}`
      });
      
      acc[item.municipio].totalVotos += votosEfetivos;
      
      return acc;
    }, {});
    
    console.log('=== DETALHES DOS MUNICÍPIOS ===');
    console.log('Total de municípios encontrados:', Object.keys(agrupados).length);
    
    // Converter para array e ordenar por total de votos
    const resultado = Object.values(agrupados)
      .sort((a, b) => b.totalVotos - a.totalVotos);
    
    console.log('Total de municípios após ordenação:', resultado.length);
    
    // Log detalhado dos votos por município
    console.log('Lista completa de municípios e seus votos:');
    resultado.forEach(municipio => {
      console.log(`${municipio.municipio}:`);
      console.log(`  Total de votos: ${municipio.totalVotos.toLocaleString('pt-BR')}`);
      console.log(`  Lideranças (${municipio.liderancas.length}):`);
      municipio.liderancas.forEach(lideranca => {
        console.log(`    - ${lideranca.lideranca}: ${lideranca.votos.toLocaleString('pt-BR')} votos`);
      });
    });
    
    const totalVotos = resultado.reduce((acc, municipio) => acc + municipio.totalVotos, 0);
    console.log('Total geral de votos:', totalVotos.toLocaleString('pt-BR'));
    console.log('========================');
    
    return resultado;
  };

  // Função para calcular média de votos por município
  const calcularMediaVotosPorMunicipio = () => {
    if (!dadosProjecao.length) return 0;
    
    // Agrupa os votos projetados por município, considerando apenas votos > 0
    const votosPorMunicipio = dadosProjecao.reduce((acc, item) => {
      const votosProjetados = parseInt(item.votosProjetados?.replace(/,/g, '') || '0', 10);
      if (votosProjetados > 0) {
        acc[item.municipio] = (acc[item.municipio] || 0) + votosProjetados;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Calcula o total de votos e o número de municípios únicos com votos > 0
    const totalVotos = Object.values(votosPorMunicipio).reduce((acc, votos) => acc + votos, 0);
    const totalMunicipios = Object.keys(votosPorMunicipio).length;
    
    return totalMunicipios > 0 ? Math.round(totalVotos / totalMunicipios) : 0;
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCommand = (command: string) => {
    console.log('Comando recebido:', command);
    if (command.toLowerCase().includes('buscar votação') || command.toLowerCase().includes('buscar votos')) {
      const match = command.match(/buscar (?:votação|votos)(?:\s+(?:de\s+)?(\d{4}))?\s+([^,]+)/i);
      if (match) {
        const ano = match[1];
        const termo = match[2].trim();
        
        // Log para debug dos dados
        console.log('Dados disponíveis para busca:', dadosProjecao.slice(0, 5));
        console.log('Buscando por:', { termo, ano });
        
        // Verifica se há dados carregados
        if (!dadosProjecao.length) {
          console.log('Nenhum dado carregado ainda');
          toast.error('Aguarde o carregamento dos dados');
          return;
        }

        const resultado = buscarVotacao(dadosProjecao, termo, ano);
        
        // Log do resultado
        console.log('Resultado da busca:', resultado);
        
        if (resultado) {
          toast.success(resultado);
        } else {
          toast.error(`Não encontrei dados de votação para ${termo}`);
        }
      }
    }
  };

  const getStats = () => {
    if (!dadosProjecao.length) {
      console.log('Nenhum dado disponível para calcular estatísticas');
      return {
        totalVotos: 0,
        totalVotos2022: 0,
        variacaoPercentual: 0,
        totalLiderancasAtuais: 0,
        totalMunicipios: 0,
        mediaVotosPorMunicipio: 0,
        cargoCount: {}
      };
    }

    // Filtrar apenas lideranças atuais
    const dadosAtuais = dadosProjecao.filter(item => item.liderancaAtual === true);
    console.log('=== DADOS DETALHADOS ===');
    console.log('Total de registros:', dadosProjecao.length);
    console.log('Total de lideranças atuais:', dadosAtuais.length);
    
    // Total de votos projetados para 2026
    const totalVotos = dadosAtuais.reduce((acc, item) => {
      const votosStr = item.votosProjetados || '0';
      const votos = parseInt(votosStr.replace(/,/g, ''), 10) || 0;
      console.log(`Somando votos de ${item.municipio} - ${item.lideranca}: ${votos}`);
      return acc + votos;
    }, 0);
    
    console.log('=== TOTAL DE VOTOS ===');
    console.log('Total de votos projetados:', totalVotos.toLocaleString('pt-BR'));
    
    // Total de votos de 2022
    const totalVotos2022 = dadosAtuais.reduce((acc, item) => {
      const votos2022 = parseInt(item.votacao2022.replace(/,/g, '') || '0', 10);
      return acc + votos2022;
    }, 0);
    
    // Variação percentual entre 2022 e 2026
    const variacaoPercentual = totalVotos2022 > 0 
      ? ((totalVotos - totalVotos2022) / totalVotos2022) * 100 
      : 0;

    // Agrupar votos por município
    const votosPorMunicipio = dadosAtuais.reduce((acc, item) => {
      const municipio = item.municipio;
      const votosStr = item.votosProjetados || '0';
      const votos = parseInt(votosStr.replace(/,/g, ''), 10) || 0;
      
      if (!acc[municipio]) {
        acc[municipio] = 0;
      }
      acc[municipio] += votos;
      return acc;
    }, {} as Record<string, number>);
    
    // Contar municípios com votos > 0
    const municipiosComVotos = Object.entries(votosPorMunicipio)
      .filter(([_, votos]) => votos > 0);
    
    console.log('=== MUNICÍPIOS COM VOTOS > 0 ===');
    console.log('Total de municípios com votos:', municipiosComVotos.length);
    console.log('Lista de municípios e seus votos:');
    municipiosComVotos.forEach(([municipio, votos]) => {
      console.log(`${municipio}: ${votos.toLocaleString('pt-BR')} votos`);
    });
    
    const totalMunicipios = municipiosComVotos.length;
    const mediaVotosPorMunicipio = totalMunicipios > 0 ? Math.round(totalVotos / totalMunicipios) : 0;

    const stats = {
      totalVotos,
      totalVotos2022,
      variacaoPercentual,
      totalLiderancasAtuais: dadosAtuais.length,
      totalMunicipios,
      mediaVotosPorMunicipio,
      cargoCount: dadosAtuais.reduce((acc, item) => {
        const cargo = item.cargo2024 || 'Não informado';
        acc[cargo] = (acc[cargo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    console.log('=== ESTATÍSTICAS FINAIS ===');
    console.log('Total de votos:', stats.totalVotos.toLocaleString('pt-BR'));
    console.log('Total de municípios:', stats.totalMunicipios);
    console.log('Média de votos por município:', stats.mediaVotosPorMunicipio.toLocaleString('pt-BR'));
    console.log('Total de lideranças atuais:', stats.totalLiderancasAtuais);
    console.log('Distribuição por cargo:', stats.cargoCount);
    console.log('========================');

    return stats;
  };

  const filteredData = dadosProjecao.filter(item =>
    item.municipio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Transforma os dados para o formato esperado pelo VoiceAssistant
  const planilhaData = dadosProjecao.map(item => ({
    municipio: item.municipio,
    votacao2022: item.votacao2022,
    votosProjetados: item.votosProjetados
  }));

  // Função para processar os votos
  const processarVotos = (municipio: DadosProjecao) => {
    const votos2022 = parseInt(municipio.votacao2022.replace(/,/g, '') || '0', 10);
    const votosProjetados = parseInt(municipio.votosProjetados.replace(/,/g, '') || '0', 10);
    const diferenca = votosProjetados - votos2022;
    const percentualCrescimento = votos2022 > 0 ? ((diferenca / votos2022) * 100) : 0;

    return {
      votos2022,
      votosProjetados,
      diferenca,
      percentualCrescimento
    };
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col md:flex-row">
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar interna do conteúdo */}
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Eleições 2026</span>
              <span className="text-xs text-gray-500 font-light">Projeção de Votos 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-gray-50 text-gray-700 cursor-pointer border-gray-200"
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/painel-aplicacoes')}
                className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded border border-gray-200"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-xs font-medium">Voltar</span>
              </Button>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-4 py-4 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-600">Carregando dados de projeção...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <p className="mb-2">Erro ao carregar dados</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cards de estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Eleições 2026</CardTitle>
                    <Vote className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalVotos.toLocaleString('pt-BR')}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.variacaoPercentual > 0 ? '+' : ''}{stats.variacaoPercentual.toFixed(1)}% vs 2022
                    </p>
                    <div className="mt-3">
                      <a
                        href="/chapas"
                        className="inline-block px-3 py-1.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                      >
                        Formação de chapas 2026
                      </a>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Municípios com Votos</CardTitle>
                    <Award className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalMunicipios}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Média de {stats.mediaVotosPorMunicipio.toLocaleString('pt-BR')} votos/município
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Lideranças Atuais</CardTitle>
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLiderancasAtuais}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Object.entries(stats.cargoCount).map(([cargo, count]) => (
                        <span key={cargo} className="mr-2">
                          {cargo}: {count}
                        </span>
                      ))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Votação 2022</CardTitle>
                    <Wallet className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalVotos2022.toLocaleString('pt-BR')}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Base de comparação
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Barra de pesquisa e filtros */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar município ou liderança..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filtro === 'todos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro('todos')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtro === 'liderancas' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro('liderancas')}
                  >
                    Lideranças
                  </Button>
                  <Button
                    variant={filtro === 'municipios' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro('municipios')}
                  >
                    Municípios
                  </Button>
                </div>
              </div>

              {/* Lista de municípios */}
              <div className="space-y-4">
                {getDadosAgrupados().map((municipio) => (
                  <Card key={municipio.id} className="overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleMunicipio(municipio.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{municipio.municipio}</h3>
                          <p className="text-sm text-gray-500">
                            {municipio.liderancas.length} liderança{municipio.liderancas.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {municipio.totalVotos.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-sm text-gray-500">
                              Votos projetados
                            </div>
                          </div>
                          {expandedMunicipios[municipio.id] ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedMunicipios[municipio.id] && (
                      <div className="border-t">
                        {municipio.liderancas.map((lideranca) => (
                          <div
                            key={lideranca.id}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{lideranca.lideranca}</span>
                                  {lideranca.liderancaAtual && (
                                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                      Atual
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {lideranca.cargo2024}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold">
                                  {lideranca.votos.toLocaleString('pt-BR')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Votos projetados
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
        <footer className="mt-auto p-3 text-center text-[10px] text-gray-400 font-light">
          © 2025 86 Dynamics - Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
} 