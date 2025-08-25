"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApiResponseResultadoEleicao, ResultadoEleicaoRegistro } from '@/types/resultadoEleicoes';
import { Search, Filter, TrendingUp, Calendar, MapPin, User, Users, ChevronDown, ChevronUp, ChevronRight, Minus, Plus } from 'lucide-react';
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

  // Carregar dados iniciais e listas para filtros
  useEffect(() => {
    carregarDados();
  }, []);

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
        
        // Processar dados para o gráfico
        processarDadosGrafico(resultado.data);
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

  // Filtrar dados por nome do candidato localmente (busca em tempo real)
  const dadosFiltrados = dados.filter(item => {
    if (filtroNomeCandidato === 'todos') return true;
    const nomeCandidato = item['nome candidato']?.toString() || '';
    return nomeCandidato === filtroNomeCandidato;
  });

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
            <div className="flex flex-col md:flex-row md:items-center justify-between py-3 space-y-3 md:space-y-0">
              <div className="flex flex-col items-start">
                <span className="text-base md:text-lg font-semibold text-gray-900">Evolução Republicanos</span>
                <span className="text-xs text-gray-500 font-light">Análise temporal da evolução de votos nominais dos candidatos republicanos</span>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                <TrendingUp className="h-4 w-4 mr-1" />
                Análise Histórica
              </Badge>
            </div>
          </div>
        </nav>

        {/* Conteúdo principal */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          {/* Estatísticas Gerais */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4 text-gray-500" />
                    Total de Registros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{formatarNumero(estatisticas.totalRegistros)}</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    Total de Votos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{formatarNumero(estatisticas.totalVotos)}</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Municípios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{formatarNumero(estatisticas.totalMunicipios)}</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <Filter className="h-4 w-4 text-gray-500" />
                    Filtrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{formatarNumero(totalCandidatos)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Seção de Filtros */}
          <Card className="border-gray-200 mb-6">
            <CardHeader>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <CardTitle className="text-base font-medium text-gray-900">Filtros</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {filtrosExpandidos ? 'Ocultar' : 'Mostrar'} filtros
                  </span>
                  {filtrosExpandidos ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>
              {filtrosExpandidos && (
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Use os filtros para refinar sua análise da evolução dos votos republicanos
                </CardDescription>
              )}
            </CardHeader>
            {filtrosExpandidos && (
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro por Ano */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4" />
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
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Users className="h-4 w-4" />
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
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <MapPin className="h-4 w-4" />
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
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <User className="h-4 w-4" />
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
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Badge className="h-4 w-4" />
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
              
              <div className="flex gap-2 mt-6">
                <Button onClick={aplicarFiltros} disabled={loading} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {loading ? 'Aplicando...' : 'Aplicar Filtros'}
                </Button>
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar Filtros
                </Button>
              </div>
              </CardContent>
            )}
          </Card>

          {/* Gráfico de Evolução */}
          {dadosGrafico.length > 0 && (
            <Card className="border-gray-200 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-900">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  Evolução dos Votos Nominais ao Longo dos Anos
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Análise temporal da votação republicana {filtroMunicipio && filtroMunicipio !== 'todos' && `em ${filtroMunicipio}`}
                  {filtroCargo && filtroCargo !== 'todos' && ` para ${filtroCargo}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96">
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
            <CardHeader>
              <CardTitle className="text-base font-medium text-gray-900">
                Resultados por Ano ({formatarNumero(totalCandidatos)} candidatos)
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Clique no ano para expandir e ver a tabela completa de candidatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Carregando dados...</p>
                </div>
              ) : totalCandidatos === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum resultado encontrado com os filtros aplicados
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.keys(dadosPorAno).sort().map((ano) => {
                    const candidatosDoAno = dadosPorAno[ano];
                    return (
                      <div key={ano} className="border border-gray-200 rounded-lg">
                        {/* Cabeçalho do Ano */}
                        <div 
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer rounded-t-lg"
                          onClick={() => toggleAno(ano)}
                        >
                          <div className="flex items-center gap-3">
                            {anosExpandidos.has(ano) ? (
                              <Minus className="h-5 w-5 text-gray-600" />
                            ) : (
                              <Plus className="h-5 w-5 text-gray-600" />
                            )}
                            <Badge variant="default" className="text-sm px-3 py-1">
                              {ano}
                            </Badge>
                            <span className="font-medium text-gray-700">
                              {candidatosDoAno.length} candidato(s) com votos
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {anosExpandidos.has(ano) ? 'Clique para recolher' : 'Clique para expandir'}
                          </div>
                        </div>

                        {/* Tabela de Candidatos */}
                        {anosExpandidos.has(ano) && (
                          <div className="border-t border-gray-200">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Município</th>
                                    <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Cargo</th>
                                    <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Candidato</th>
                                    <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Partido</th>
                                    <th className="text-right p-3 font-medium text-gray-700 border-b border-gray-200">Votos</th>
                                    <th className="text-center p-3 font-medium text-gray-700 border-b border-gray-200">Situação</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {candidatosDoAno
                                    .sort((a, b) => {
                                      // Ordenar por município, depois cargo, depois votos (desc)
                                      if (a.municipio !== b.municipio) return a.municipio.localeCompare(b.municipio);
                                      if (a.cargo !== b.cargo) return a.cargo.localeCompare(b.cargo);
                                      return b.totalVotos - a.totalVotos;
                                    })
                                    .map((candidato, index) => (
                                      <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                        <td className="p-3 text-gray-900">
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-gray-500" />
                                            {candidato.municipio}
                                          </div>
                                        </td>
                                        <td className="p-3">
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
                                        <td className="p-3">
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
                                    ))}
                                </tbody>
                              </table>
                              
                              {candidatosDoAno.length > 100 && (
                                <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
                                  Mostrando todos os {formatarNumero(candidatosDoAno.length)} candidatos do ano {ano}
                                </div>
                              )}
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
