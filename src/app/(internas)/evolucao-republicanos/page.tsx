"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApiResponseResultadoEleicao, ResultadoEleicaoRegistro } from '@/types/resultadoEleicoes';
import { Search, Filter, TrendingUp, Calendar, MapPin, User, Users, ChevronDown, ChevronUp, ChevronRight, Minus, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function EvolucaoRepublicanosPage() {
  const [dados, setDados] = useState<ResultadoEleicaoRegistro[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  
  // Filtros
  const [filtroAno, setFiltroAno] = useState('todos');
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos');
  const [filtroNomeCandidato, setFiltroNomeCandidato] = useState('todos');
  const [filtroPartido, setFiltroPartido] = useState('todos');

  // Estados para listas de filtros
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [cargosDisponiveis, setCargosDisponiveis] = useState<string[]>([]);
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  const [partidosDisponiveis, setPartidosDisponiveis] = useState<string[]>([]);
  const [candidatosDisponiveis, setCandidatosDisponiveis] = useState<string[]>([]);
  
  // Estado para controlar se os filtros estão expandidos
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);
  
  // Estados para controlar expansão da árvore
  const [anosExpandidos, setAnosExpandidos] = useState<Set<string>>(new Set());

  // Estados para filtros da tabela
  const [filtroTabelaMunicipio, setFiltroTabelaMunicipio] = useState('');
  const [filtroTabelaCargo, setFiltroTabelaCargo] = useState('');
  const [filtroTabelaCandidato, setFiltroTabelaCandidato] = useState('');
  const [filtroTabelaPartido, setFiltroTabelaPartido] = useState('');

  // Estados para ordenação da tabela
  const [ordenacao, setOrdenacao] = useState<{coluna: string, direcao: 'asc' | 'desc' | null}>({
    coluna: '',
    direcao: null
  });

  // Carregar dados iniciais e listas para filtros
  useEffect(() => {
    carregarDados();
  }, []);

  // Calcular dados filtrados usando useMemo
  const dadosFiltrados = useMemo(() => {
    return dados.filter(item => {
      if (filtroNomeCandidato === 'todos') return true;
      const nomeCandidato = item['nome candidato']?.toString() || '';
      return nomeCandidato === filtroNomeCandidato;
    });
  }, [dados, filtroNomeCandidato]);

  // Processar gráfico quando dados filtrados mudarem
  useEffect(() => {
    if (dadosFiltrados.length > 0) {
      processarDadosGrafico(dadosFiltrados);
    }
  }, [dadosFiltrados]);

  const carregarDados = async (filtros = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Aplicar filtros se fornecidos
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.set(key, value.toString());
      });
      
      // Buscar todos os registros para análise completa
      params.set('limite', '50000');
      
      const response = await fetch(`/api/resultados-eleitorais?${params}`);
      const resultado: ApiResponseResultadoEleicao = await response.json();
      
      if (resultado.success) {
        setDados(resultado.data);
        setEstatisticas(resultado.estatisticas);
        
        // Atualizar listas para filtros se for carregamento inicial
        if (Object.keys(filtros).length === 0) {
          setAnosDisponiveis(resultado.estatisticas?.anosDisponiveis || []);
          setCargosDisponiveis(resultado.estatisticas?.cargosDisponiveis || []);
          setPartidosDisponiveis(resultado.estatisticas?.partidosDisponiveis || []);
          
          // Extrair municípios únicos dos dados
          const municipiosUnicos = [...new Set(resultado.data.map(item => item.municipio?.toString()).filter(Boolean))].sort();
          setMunicipiosDisponiveis(municipiosUnicos);
          
          // Extrair candidatos únicos dos dados
          const candidatosUnicos = [...new Set(resultado.data.map(item => item['nome candidato']?.toString()).filter(Boolean))].sort();
          setCandidatosDisponiveis(candidatosUnicos);
        }
        
        // Processar dados para o gráfico será feito no useEffect de filtros
      } else {
        console.error('Erro ao carregar dados:', resultado.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarDadosGrafico = (dadosOriginais: ResultadoEleicaoRegistro[]) => {
    // Agrupar dados por ano e calcular total de votos nominais
    const dadosAgrupados = dadosOriginais.reduce((acc, item) => {
      const ano = Number(item['ano de eleicao'] || item.ano);
      const votosNominais = Number(item['votos nominais'] || 0);
      
      if (!acc[ano]) {
        acc[ano] = {
          ano,
          totalVotosNominais: 0,
          totalCandidatos: 0,
          municipios: new Set(),
          cargos: new Set()
        };
      }
      
      acc[ano].totalVotosNominais += votosNominais;
      acc[ano].totalCandidatos += 1;
      
      if (item.municipio) acc[ano].municipios.add(item.municipio);
      if (item.cargo) acc[ano].cargos.add(item.cargo);
      
      return acc;
    }, {} as any);
    
    // Converter para array e ordenar por ano
    const dadosParaGrafico = Object.values(dadosAgrupados)
      .map((item: any) => ({
        ano: item.ano,
        votosNominais: item.totalVotosNominais,
        candidatos: item.totalCandidatos,
        municipios: item.municipios.size,
        cargos: item.cargos.size
      }))
      .sort((a: any, b: any) => a.ano - b.ano);
    
    setDadosGrafico(dadosParaGrafico);
  };

  const aplicarFiltros = () => {
    const filtrosAtivos = {
      ...(filtroAno && filtroAno !== 'todos' && { ano: filtroAno }),
      ...(filtroCargo && filtroCargo !== 'todos' && { cargo: filtroCargo }),
      ...(filtroMunicipio && filtroMunicipio !== 'todos' && { municipio: filtroMunicipio }),
      ...(filtroPartido && filtroPartido !== 'todos' && { partido: filtroPartido })
    };
    
    carregarDados(filtrosAtivos);
  };

  const limparFiltros = () => {
    setFiltroAno('todos');
    setFiltroCargo('todos');
    setFiltroMunicipio('todos');
    setFiltroNomeCandidato('todos');
    setFiltroPartido('todos');
    carregarDados();
  };

  const formatarNumero = (valor: any) => {
    const num = Number(valor);
    return isNaN(num) ? '-' : num.toLocaleString('pt-BR');
  };

  // dadosFiltrados já definido acima com useMemo

  // Filtrar apenas candidatos com votos > 0 e agrupar por ano
  const dadosComVotos = dadosFiltrados.filter(item => {
    const votos = Number(item['votos nominais'] || 0);
    return votos > 0;
  });

  // Agrupar candidatos por ano para estrutura simplificada
  const dadosPorAno = dadosComVotos.reduce((acc, item) => {
    const ano = (item['ano de eleicao'] || item.ano || 'Ano não informado').toString();
    const cargo = item.cargo || 'Cargo não informado';
    const municipio = item.municipio || 'Município não informado';
    const candidato = item['nome candidato'] || 'Candidato não informado';
    const partido = item.partido || '-';
    const votos = Number(item['votos nominais'] || 0);
    const situacao = item['situacao totalizacao'] || '-';

    if (!acc[ano]) {
      acc[ano] = [];
    }

    // Verificar se candidato já existe para este ano/município/cargo
    const chave = `${cargo}-${municipio}-${candidato}`;
    const existente = acc[ano].find(c => `${c.cargo}-${c.municipio}-${c.candidato}` === chave);

    if (existente) {
      existente.totalVotos += votos;
      existente.registros += 1;
    } else {
      acc[ano].push({
        ano,
        cargo,
        municipio,
        candidato,
        partido,
        totalVotos: votos,
        situacao,
        registros: 1
      });
    }

    return acc;
  }, {} as any);

  // Função para controle de expansão
  const toggleAno = (ano: string) => {
    const novosExpandidos = new Set(anosExpandidos);
    if (novosExpandidos.has(ano)) {
      novosExpandidos.delete(ano);
    } else {
      novosExpandidos.add(ano);
    }
    setAnosExpandidos(novosExpandidos);
  };

  // Função para ordenação da tabela
  const handleOrdenacao = (coluna: string) => {
    let novaDirecao: 'asc' | 'desc' | null = 'asc';
    
    if (ordenacao.coluna === coluna) {
      if (ordenacao.direcao === 'asc') {
        novaDirecao = 'desc';
      } else if (ordenacao.direcao === 'desc') {
        novaDirecao = null;
      } else {
        novaDirecao = 'asc';
      }
    }
    
    setOrdenacao({ coluna, direcao: novaDirecao });
  };

  // Função para aplicar filtros na tabela
  const aplicarFiltrosTabela = (candidatos: any[]) => {
    return candidatos.filter(candidato => {
      const matchMunicipio = !filtroTabelaMunicipio || 
        candidato.municipio.toLowerCase().includes(filtroTabelaMunicipio.toLowerCase());
      const matchCargo = !filtroTabelaCargo || 
        candidato.cargo.toLowerCase().includes(filtroTabelaCargo.toLowerCase());
      const matchCandidato = !filtroTabelaCandidato || 
        candidato.candidato.toLowerCase().includes(filtroTabelaCandidato.toLowerCase());
      const matchPartido = !filtroTabelaPartido || 
        candidato.partido.toLowerCase().includes(filtroTabelaPartido.toLowerCase());
      
      return matchMunicipio && matchCargo && matchCandidato && matchPartido;
    });
  };

  // Função para aplicar ordenação na tabela
  const aplicarOrdenacao = (candidatos: any[]) => {
    if (!ordenacao.direcao || !ordenacao.coluna) {
      return candidatos;
    }

    const candidatosOrdenados = [...candidatos].sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenacao.coluna) {
        case 'municipio':
          valorA = a.municipio;
          valorB = b.municipio;
          break;
        case 'cargo':
          valorA = a.cargo;
          valorB = b.cargo;
          break;
        case 'candidato':
          valorA = a.candidato;
          valorB = b.candidato;
          break;
        case 'partido':
          valorA = a.partido;
          valorB = b.partido;
          break;
        case 'votos':
          valorA = a.totalVotos;
          valorB = b.totalVotos;
          break;
        case 'situacao':
          valorA = a.situacao;
          valorB = b.situacao;
          break;
        default:
          return 0;
      }

      if (ordenacao.coluna === 'votos') {
        // Para votos, usar comparação numérica
        return ordenacao.direcao === 'asc' ? valorA - valorB : valorB - valorA;
      } else {
        // Para texto, usar comparação de string
        if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
        return 0;
      }
    });

    return candidatosOrdenados;
  };

  // Função para renderizar ícone de ordenação
  const renderIconeOrdenacao = (coluna: string) => {
    if (ordenacao.coluna !== coluna) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    
    if (ordenacao.direcao === 'asc') {
      return <ArrowUp className="h-3 w-3 text-blue-600" />;
    } else if (ordenacao.direcao === 'desc') {
      return <ArrowDown className="h-3 w-3 text-blue-600" />;
    } else {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
  };

  // Contar total de candidatos únicos para o card de filtrados
  const totalCandidatos = Object.values(dadosPorAno).reduce((total: number, candidatos: any[]) => {
    return total + candidatos.length;
  }, 0);

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <Navbar />
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Navbar interna do conteúdo */}
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between py-2 space-y-2 md:space-y-0">
              <div className="flex flex-col items-start">
                <span className="text-sm md:text-base font-semibold text-gray-900">Evolução Republicanos</span>
                <span className="text-xs text-gray-500 font-light">Análise temporal da evolução de votos nominais</span>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Análise Histórica
              </Badge>
            </div>
          </div>
        </nav>

        {/* Conteúdo principal */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          {/* Estatísticas Gerais */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <Card className="border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1 text-gray-700">
                    <Users className="h-3 w-3 text-gray-500" />
                    Total de Registros
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold text-gray-900">{formatarNumero(estatisticas.totalRegistros)}</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1 text-gray-700">
                    <TrendingUp className="h-3 w-3 text-gray-500" />
                    Total de Votos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold text-gray-900">{formatarNumero(estatisticas.totalVotos)}</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1 text-gray-700">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    Municípios
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold text-gray-900">{formatarNumero(estatisticas.totalMunicipios)}</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1 text-gray-700">
                    <Filter className="h-3 w-3 text-gray-500" />
                    Filtrados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold text-gray-900">{formatarNumero(totalCandidatos)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Seção de Filtros */}
          <Card className="border-gray-200 mb-4">
            <CardHeader className="pb-2">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-gray-500" />
                  <CardTitle className="text-sm font-medium text-gray-900">Filtros</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {filtrosExpandidos ? 'Ocultar' : 'Mostrar'} filtros
                  </span>
                  {filtrosExpandidos ? (
                    <ChevronUp className="h-3 w-3 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  )}
                </div>
              </div>
              {filtrosExpandidos && (
                <CardDescription className="text-xs text-gray-600 mt-1">
                  Use os filtros para refinar sua análise
                </CardDescription>
              )}
            </CardHeader>
            {filtrosExpandidos && (
              <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Filtro por Ano */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1">
                    <Calendar className="h-3 w-3" />
                    Ano de Eleição
                  </label>
                  <Select value={filtroAno} onValueChange={setFiltroAno}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os anos</SelectItem>
                      {anosDisponiveis.map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por Cargo */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1">
                    <Users className="h-3 w-3" />
                    Cargo
                  </label>
                  <Select value={filtroCargo} onValueChange={setFiltroCargo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os cargos</SelectItem>
                      {cargosDisponiveis.map((cargo) => (
                        <SelectItem key={cargo} value={cargo}>
                          {cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por Município */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1">
                    <MapPin className="h-3 w-3" />
                    Município
                  </label>
                  <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o município" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os municípios</SelectItem>
                      {municipiosDisponiveis.slice(0, 50).map((municipio) => (
                        <SelectItem key={municipio} value={municipio}>
                          {municipio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por Nome do Candidato */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1">
                    <User className="h-3 w-3" />
                    Nome Candidato
                  </label>
                  <Select value={filtroNomeCandidato} onValueChange={setFiltroNomeCandidato}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um candidato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os candidatos</SelectItem>
                      {candidatosDisponiveis.map((candidato) => (
                        <SelectItem key={candidato} value={candidato}>
                          {candidato}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por Partido */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1">
                    <Badge className="h-3 w-3" />
                    Partido
                  </label>
                  <Select value={filtroPartido} onValueChange={setFiltroPartido}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o partido" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os partidos</SelectItem>
                      {partidosDisponiveis.map((partido) => (
                        <SelectItem key={partido} value={partido}>
                          {partido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button onClick={aplicarFiltros} disabled={loading} className="flex items-center gap-1 h-8 text-xs">
                  <Search className="h-3 w-3" />
                  {loading ? 'Aplicando...' : 'Aplicar Filtros'}
                </Button>
                <Button variant="outline" onClick={limparFiltros} className="h-8 text-xs">
                  Limpar Filtros
                </Button>
              </div>
              </CardContent>
            )}
          </Card>

          {/* Gráfico de Evolução */}
          {dadosGrafico.length > 0 && (
            <Card className="border-gray-200 mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <TrendingUp className="h-3 w-3 text-gray-500" />
                  Evolução dos Votos Nominais ao Longo dos Anos
                </CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Análise temporal da votação republicana {filtroMunicipio && filtroMunicipio !== 'todos' && `em ${filtroMunicipio}`}
                  {filtroCargo && filtroCargo !== 'todos' && ` para ${filtroCargo}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="ano" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.toString()}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatarNumero(value)}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatarNumero(value), name]}
                        labelFormatter={(label) => `Ano: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="votosNominais" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        name="Votos Nominais"
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Resumo do Gráfico */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {dadosGrafico.length}
                    </div>
                    <div className="text-sm text-gray-600">Anos Analisados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {formatarNumero(dadosGrafico.reduce((acc, item) => acc + item.votosNominais, 0))}
                    </div>
                    <div className="text-sm text-gray-600">Total de Votos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {formatarNumero(Math.max(...dadosGrafico.map(item => item.votosNominais)))}
                    </div>
                    <div className="text-sm text-gray-600">Maior Votação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {formatarNumero(Math.round(dadosGrafico.reduce((acc, item) => acc + item.votosNominais, 0) / dadosGrafico.length))}
                    </div>
                    <div className="text-sm text-gray-600">Média por Ano</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Resultados */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">
                Resultados por Ano ({formatarNumero(totalCandidatos)} candidatos)
              </CardTitle>
              <CardDescription className="text-xs text-gray-600">
                Clique no ano para expandir e ver a tabela completa de candidatos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                  <p className="text-xs">Carregando dados...</p>
                </div>
              ) : totalCandidatos === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Nenhum resultado encontrado com os filtros aplicados
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.keys(dadosPorAno).sort().map((ano) => {
                    const candidatosDoAno = dadosPorAno[ano];
                    return (
                      <div key={ano} className="border border-gray-200 rounded-lg">
                        {/* Cabeçalho do Ano */}
                        <div 
                          className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer rounded-t-lg"
                          onClick={() => toggleAno(ano)}
                        >
                          <div className="flex items-center gap-2">
                            {anosExpandidos.has(ano) ? (
                              <Minus className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Plus className="h-4 w-4 text-gray-600" />
                            )}
                            <Badge variant="default" className="text-xs px-2 py-1">
                              {ano}
                            </Badge>
                            <span className="text-sm font-medium text-gray-700">
                              {candidatosDoAno.length} candidato(s) com votos
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {anosExpandidos.has(ano) ? 'Recolher' : 'Expandir'}
                          </div>
                        </div>

                        {/* Tabela de Candidatos */}
                        {anosExpandidos.has(ano) && (
                          <div className="border-t border-gray-200">
                            {/* Filtros da Tabela */}
                            <div className="p-2 bg-gray-50 border-b border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                <div>
                                  <Input
                                    placeholder="Filtrar município..."
                                    value={filtroTabelaMunicipio}
                                    onChange={(e) => setFiltroTabelaMunicipio(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>
                                <div>
                                  <Input
                                    placeholder="Filtrar cargo..."
                                    value={filtroTabelaCargo}
                                    onChange={(e) => setFiltroTabelaCargo(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>
                                <div>
                                  <Input
                                    placeholder="Filtrar candidato..."
                                    value={filtroTabelaCandidato}
                                    onChange={(e) => setFiltroTabelaCandidato(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>
                                <div>
                                  <Input
                                    placeholder="Filtrar partido..."
                                    value={filtroTabelaPartido}
                                    onChange={(e) => setFiltroTabelaPartido(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th 
                                      className="text-left p-2 font-medium text-gray-700 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-xs"
                                      onClick={() => handleOrdenacao('municipio')}
                                    >
                                      <div className="flex items-center gap-2">
                                        Município
                                        {renderIconeOrdenacao('municipio')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-left p-2 font-medium text-gray-700 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-xs"
                                      onClick={() => handleOrdenacao('cargo')}
                                    >
                                      <div className="flex items-center gap-2">
                                        Cargo
                                        {renderIconeOrdenacao('cargo')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-left p-2 font-medium text-gray-700 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-xs"
                                      onClick={() => handleOrdenacao('candidato')}
                                    >
                                      <div className="flex items-center gap-2">
                                        Candidato
                                        {renderIconeOrdenacao('candidato')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-left p-2 font-medium text-gray-700 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-xs"
                                      onClick={() => handleOrdenacao('partido')}
                                    >
                                      <div className="flex items-center gap-2">
                                        Partido
                                        {renderIconeOrdenacao('partido')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-right p-2 font-medium text-gray-700 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-xs"
                                      onClick={() => handleOrdenacao('votos')}
                                    >
                                      <div className="flex items-center justify-end gap-2">
                                        Votos
                                        {renderIconeOrdenacao('votos')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-center p-2 font-medium text-gray-700 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-xs"
                                      onClick={() => handleOrdenacao('situacao')}
                                    >
                                      <div className="flex items-center justify-center gap-2">
                                        Situação
                                        {renderIconeOrdenacao('situacao')}
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const candidatosFiltrados = aplicarFiltrosTabela(candidatosDoAno);
                                    const candidatosOrdenados = aplicarOrdenacao(candidatosFiltrados);
                                    
                                    return candidatosOrdenados.map((candidato, index) => (
                                      <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                        <td className="p-2 text-gray-900 text-xs">
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-gray-500" />
                                            {candidato.municipio}
                                          </div>
                                        </td>
                                        <td className="p-2 text-xs">
                                          <Badge variant="outline" className="text-xs">
                                            {candidato.cargo}
                                          </Badge>
                                        </td>
                                        <td className="p-3 font-medium text-gray-900">
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3 text-gray-500" />
                                            {candidato.candidato}
                                          </div>
                                        </td>
                                        <td className="p-2 text-xs">
                                          {candidato.partido && candidato.partido !== '-' && (
                                            <Badge variant="outline" className="text-xs">
                                              {candidato.partido}
                                            </Badge>
                                          )}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-gray-900">
                                          {formatarNumero(candidato.totalVotos)}
                                        </td>
                                        <td className="p-3 text-center">
                                          {candidato.situacao && candidato.situacao !== '-' && (
                                            <Badge 
                                              variant={candidato.situacao.toLowerCase().includes('eleito') ? 'default' : 'secondary'} 
                                              className="text-xs"
                                            >
                                              {candidato.situacao}
                                            </Badge>
                                          )}
                                        </td>
                                      </tr>
                                    ));
                                  })()}
                                </tbody>
                              </table>
                              
                              {(() => {
                                const candidatosFiltrados = aplicarFiltrosTabela(candidatosDoAno);
                                const totalFiltrados = candidatosFiltrados.length;
                                const totalOriginal = candidatosDoAno.length;
                                
                                return (
                                  <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                                    {totalFiltrados === totalOriginal ? (
                                      `Mostrando todos os ${formatarNumero(totalOriginal)} candidatos do ano ${ano}`
                                    ) : (
                                      `Mostrando ${formatarNumero(totalFiltrados)} de ${formatarNumero(totalOriginal)} candidatos (filtrados)`
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
