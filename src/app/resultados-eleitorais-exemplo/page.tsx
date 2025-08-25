'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApiResponseResultadoEleicao, ResultadoEleicaoRegistro } from '@/types/resultadoEleicoes';
import { Search, Filter, Download, BarChart3 } from 'lucide-react';

export default function ResultadosEleitoraisExemplo() {
  const [dados, setDados] = useState<ResultadoEleicaoRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  
  // Filtros
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroPartido, setFiltroPartido] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async (filtros = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.set(key, value.toString());
      });
      
      const response = await fetch(`/api/resultados-eleitorais?${params}`);
      const resultado: ApiResponseResultadoEleicao = await response.json();
      
      if (resultado.success) {
        setDados(resultado.data);
        setEstatisticas(resultado.estatisticas);
      } else {
        console.error('Erro ao carregar dados:', resultado.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    carregarDados({
      municipio: filtroMunicipio,
      cargo: filtroCargo,
      ano: filtroAno,
      partido: filtroPartido
    });
  };

  const limparFiltros = () => {
    setFiltroMunicipio('');
    setFiltroCargo('');
    setFiltroAno('');
    setFiltroPartido('');
    carregarDados();
  };

  const formatarNumero = (valor: any) => {
    const num = Number(valor);
    return isNaN(num) ? '-' : num.toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resultados Eleitorais</h1>
          <p className="text-muted-foreground">
            Consulta e análise de dados eleitorais estáticos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarNumero(estatisticas.totalRegistros)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Votos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarNumero(estatisticas.totalVotos)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Municípios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarNumero(estatisticas.totalMunicipios)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filtrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarNumero(estatisticas.totalFiltrados || dados.length)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Use os filtros para refinar sua busca nos dados eleitorais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Município</label>
              <Input
                placeholder="Digite o município..."
                value={filtroMunicipio}
                onChange={(e) => setFiltroMunicipio(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Cargo</label>
              <Input
                placeholder="Digite o cargo..."
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Ano</label>
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os anos</SelectItem>
                  {estatisticas?.anosDisponiveis?.map((ano: number) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Partido</label>
              <Input
                placeholder="Digite o partido..."
                value={filtroPartido}
                onChange={(e) => setFiltroPartido(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={aplicarFiltros} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Buscando...' : 'Aplicar Filtros'}
            </Button>
            <Button variant="outline" onClick={limparFiltros}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados ({dados.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : dados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Município</th>
                    <th className="text-left p-2 font-medium">Candidato</th>
                    <th className="text-left p-2 font-medium">Partido</th>
                    <th className="text-left p-2 font-medium">Cargo</th>
                    <th className="text-right p-2 font-medium">Votos</th>
                    <th className="text-center p-2 font-medium">Ano</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.slice(0, 100).map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{item.municipio || '-'}</td>
                      <td className="p-2">{item.candidato || item.nome || '-'}</td>
                      <td className="p-2">
                        {item.partido && (
                          <Badge variant="outline">{item.partido}</Badge>
                        )}
                      </td>
                      <td className="p-2">{item.cargo || '-'}</td>
                      <td className="p-2 text-right font-mono">
                        {formatarNumero(item.votos)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="secondary">
                          {item.ano || item.ano_eleicao || '-'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {dados.length > 100 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Mostrando primeiros 100 registros de {formatarNumero(dados.length)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
