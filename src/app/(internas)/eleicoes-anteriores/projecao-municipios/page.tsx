"use client";

import { useEffect, useState, Suspense } from "react";
// import dynamic from 'next/dynamic';
// import "@/styles/leaflet-custom.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpDown, RotateCw, ChevronLeft, ChevronRight, FileDown, Settings } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Carregamento dinâmico do MapaPiaui apenas no cliente
// const MapaPiaui = dynamic(() => import('@/components/MapaPiaui'), {
//   ssr: false,
//   loading: () => <div className="flex justify-center items-center h-96">Carregando mapa...</div>
// });

interface ProjecaoMunicipio {
  municipio: string;
  liderancasAtuais: number;
  votacao2022: number;
  expectativa2026: number;
  crescimento: number;
  eleitores: number;
  alcance: number;
}

interface Lideranca {
  municipio: string;
  lideranca: string;
  liderancaAtual: string;
  cargo2024: string;
  expectativa2026: string;
  urlImagem?: string;
}

type SortConfig = {
  key: keyof ProjecaoMunicipio;
  direction: 'asc' | 'desc';
} | null;

export default function ProjecaoMunicipios() {
  const [projecoes, setProjecoes] = useState<ProjecaoMunicipio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'municipio', direction: 'asc' });
  const [showLiderancasModal, setShowLiderancasModal] = useState(false);
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [liderancas, setLiderancas] = useState<any[]>([]);
  const [loadingLiderancas, setLoadingLiderancas] = useState(false);
  const [filtroExpectativa, setFiltroExpectativa] = useState<string>('todos');
  const [showPdfConfigModal, setShowPdfConfigModal] = useState(false);
  const [colunasPdf, setColunasPdf] = useState<Record<string, boolean>>({
    municipio: true,
    liderancasAtuais: true,
    votacao2022: true,
    expectativa2026: true,
    crescimento: true,
    eleitores: true,
    alcance: true,
  });
  const [incluirResumoEstatisticas, setIncluirResumoEstatisticas] = useState(true);
  // Variáveis relacionadas ao mapa temporariamente desabilitadas
  // const [filtroTerritorio, setFiltroTerritorio] = useState<string[]>([]);
  // const [territorioSelecionado, setTerritorioSelecionado] = useState<string>('');

  const handleFiltroExpectativaChange = (novoFiltro: string) => {
    setFiltroExpectativa(novoFiltro);
    setCurrentPage(1); // Resetar para primeira página quando filtrar
  };

  // Calcular estatísticas por filtro de expectativa
  const calcularEstatisticasFiltro = () => {
    const totalMunicipios = projecoes.length;
    const ate100 = projecoes.filter(item => item.expectativa2026 <= 100).length;
    const mais150 = projecoes.filter(item => item.expectativa2026 >= 150).length;
    const mais300 = projecoes.filter(item => item.expectativa2026 >= 300).length;
    const mais500 = projecoes.filter(item => item.expectativa2026 >= 500).length;
    const mais1000 = projecoes.filter(item => item.expectativa2026 >= 1000).length;
    
    return {
      total: totalMunicipios,
      ate100,
      mais150,
      mais300,
      mais500,
      mais1000
    };
  };

  const itemsPerPage = 10;

  useEffect(() => {
    buscarProjecoes();
  }, []);

  const buscarProjecoes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projecao-municipios');
      const data = await response.json();
      setProjecoes(data);
    } catch (error) {
      console.error('Erro ao buscar projeções:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarLiderancas = async (municipio: string) => {
    setLoadingLiderancas(true);
    try {
      const response = await fetch('/api/liderancas-votacao');
      const result = await response.json();
      
      if (!result.data || !Array.isArray(result.data)) {
        setLiderancas([]);
        return;
      }

      const liderancasMunicipio = result.data.filter((l: any) => 
        l.municipio?.toUpperCase() === municipio.toUpperCase()
      );
      setLiderancas(liderancasMunicipio);
      setSelectedMunicipio(municipio);
      setShowLiderancasModal(true);
    } catch (error) {
      console.error('Erro ao buscar lideranças:', error);
    } finally {
      setLoadingLiderancas(false);
    }
  };

  const handleSort = (key: keyof ProjecaoMunicipio) => {
    setSortConfig((currentSort) => {
      if (currentSort?.key === key) {
        return {
          key,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const formatNumber = (value: number) => {
    if (isNaN(value)) return '-';
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    if (isNaN(value)) return '-';
    return `${value.toFixed(1)}%`;
  };

  // Função para normalizar nomes de municípios para comparação
  const normalizeString = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toUpperCase()
      .trim();
  };

  // Callback para receber mudanças do filtro do mapa
  // const handleMapFilterChange = (territorio: string | null, municipiosNomes: string[]) => {
  //   setFiltroTerritorio(territorio ? municipiosNomes : []);
  //   setTerritorioSelecionado(territorio || '');
  //   setCurrentPage(1); // Resetar para primeira página quando filtrar
  // };

  const sortedData = [...projecoes].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortConfig.direction === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Filtrar dados considerando busca de texto, território e expectativa 2026
  const filteredData = sortedData.filter(item => {
    // Filtro por termo de busca
    const matchesSearch = item.municipio.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por território (se algum território estiver selecionado)
    const matchesTerritory = true; // Temporariamente desabilitado
    // const matchesTerritory = filtroTerritorio.length === 0 || 
    //   filtroTerritorio.some(municipioTerritorio => 
    //     normalizeString(municipioTerritorio) === normalizeString(item.municipio)
    //   );
    
    // Filtro por expectativa 2026
    let matchesExpectativa = true;
    if (filtroExpectativa === 'ate100') {
      matchesExpectativa = item.expectativa2026 <= 100;
    } else if (filtroExpectativa === 'mais150') {
      matchesExpectativa = item.expectativa2026 >= 150;
    } else if (filtroExpectativa === 'mais300') {
      matchesExpectativa = item.expectativa2026 >= 300;
    } else if (filtroExpectativa === 'mais500') {
      matchesExpectativa = item.expectativa2026 >= 500;
    } else if (filtroExpectativa === 'mais1000') {
      matchesExpectativa = item.expectativa2026 >= 1000;
    }
    
    return matchesSearch && matchesTerritory && matchesExpectativa;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calcular totais
  const calcularTotais = () => {
    const totais = {
      liderancasAtuais: 0,
      votacao2022: 0,
      expectativa2026: 0,
      eleitores: 0,
      crescimento: 0,
      alcance: 0
    };

    filteredData.forEach(item => {
      if (!isNaN(item.liderancasAtuais)) totais.liderancasAtuais += item.liderancasAtuais;
      if (!isNaN(item.votacao2022)) totais.votacao2022 += item.votacao2022;
      if (!isNaN(item.expectativa2026)) totais.expectativa2026 += item.expectativa2026;
      if (!isNaN(item.eleitores)) totais.eleitores += item.eleitores;
      if (!isNaN(item.crescimento)) totais.crescimento += item.crescimento;
      if (!isNaN(item.alcance)) totais.alcance += item.alcance;
    });

    // Calcular médias para percentuais
    const count = filteredData.length;
    if (count > 0) {
      totais.crescimento = totais.crescimento / count;
      totais.alcance = totais.alcance / count;
    }

    return totais;
  };

  const totais = calcularTotais();

  const gerarPDF = () => {
    // Verificar se pelo menos uma coluna está selecionada
    const colunasSelecionadas = Object.entries(colunasPdf).filter(([_, selected]) => selected);
    if (colunasSelecionadas.length === 0) {
      alert('Selecione pelo menos uma coluna para gerar o PDF.');
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Projeção de Municípios - Eleições 2026', 14, 22);
    
    // Data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
    
    // Informações do filtro ativo
    let currentY = 38;
    if (filtroExpectativa !== 'todos') {
      const filtroTexto = filtroExpectativa === 'ate100' ? 'até 100 votos' :
                          filtroExpectativa === 'mais150' ? '150+ votos' : 
                          filtroExpectativa === 'mais300' ? '300+ votos' : 
                          filtroExpectativa === 'mais500' ? '500+ votos' : '1000+ votos';
      doc.text(`Filtro aplicado: Expectativa 2026 ${filtroTexto}`, 14, currentY);
      doc.text(`Municípios filtrados: ${filteredData.length} de ${projecoes.length}`, 14, currentY + 6);
      currentY += 12;
    }
    
    // Mapeamento de colunas para nomes de exibição e funções de formatação
    const colunasMap: Record<string, { label: string; getValue: (item: ProjecaoMunicipio) => string; getTotal: () => string }> = {
      municipio: {
        label: 'Município',
        getValue: (item) => item.municipio,
        getTotal: () => 'TOTAL'
      },
      liderancasAtuais: {
        label: 'Lideranças Atuais',
        getValue: (item) => formatNumber(item.liderancasAtuais),
        getTotal: () => formatNumber(totais.liderancasAtuais)
      },
      votacao2022: {
        label: 'Votação 2022',
        getValue: (item) => formatNumber(item.votacao2022),
        getTotal: () => formatNumber(totais.votacao2022)
      },
      expectativa2026: {
        label: 'Expectativa 2026',
        getValue: (item) => formatNumber(item.expectativa2026),
        getTotal: () => formatNumber(totais.expectativa2026)
      },
      crescimento: {
        label: 'Crescimento',
        getValue: (item) => formatPercentage(item.crescimento),
        getTotal: () => formatPercentage(totais.crescimento)
      },
      eleitores: {
        label: 'Eleitores',
        getValue: (item) => formatNumber(item.eleitores),
        getTotal: () => formatNumber(totais.eleitores)
      },
      alcance: {
        label: 'Alcance',
        getValue: (item) => formatPercentage(item.alcance),
        getTotal: () => formatPercentage(totais.alcance)
      }
    };

    // Construir cabeçalhos e dados apenas com colunas selecionadas
    const headers: string[] = [];
    const colunasKeys: string[] = [];
    
    Object.entries(colunasPdf).forEach(([key, selected]) => {
      if (selected && colunasMap[key]) {
        headers.push(colunasMap[key].label);
        colunasKeys.push(key);
      }
    });

    // Dados da tabela apenas com colunas selecionadas
    const tableData = filteredData.map(item => {
      return colunasKeys.map(key => colunasMap[key].getValue(item));
    });

    // Adicionar linha de totais
    tableData.push(colunasKeys.map(key => colunasMap[key].getTotal()));

    // Ajustar posição Y da tabela baseado no filtro ativo
    const startY = currentY;
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: startY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      didDrawPage: function (data) {
        // Estilo especial para a linha de totais
        const lastRow = data.table.body.length - 1;
        if (lastRow >= 0) {
          const lastRowData = data.table.body[lastRow];
          if (Array.isArray(lastRowData)) {
            lastRowData.forEach((cell: any) => {
              if (cell && cell.styles) {
                cell.styles.fillColor = [52, 73, 94];
                cell.styles.textColor = 255;
                cell.styles.fontStyle = 'bold';
              }
            });
          }
        }
      }
    });

    // Adicionar resumo das estatísticas no final (se selecionado)
    if (incluirResumoEstatisticas) {
      const estatisticas = calcularEstatisticasFiltro();
      const finalY = (doc as any).lastAutoTable.finalY || startY + (tableData.length * 10);
      
      doc.setFontSize(10);
      doc.text('Resumo das Estatísticas:', 14, finalY + 10);
      doc.setFontSize(8);
      doc.text(`Total de municípios: ${estatisticas.total}`, 14, finalY + 18);
      doc.text(`Municípios com até 100 votos: ${estatisticas.ate100}`, 14, finalY + 24);
      doc.text(`Municípios com 150+ votos: ${estatisticas.mais150}`, 14, finalY + 30);
      doc.text(`Municípios com 300+ votos: ${estatisticas.mais300}`, 14, finalY + 36);
      doc.text(`Municípios com 500+ votos: ${estatisticas.mais500}`, 14, finalY + 42);
      doc.text(`Municípios com 1000+ votos: ${estatisticas.mais1000}`, 14, finalY + 48);
    }

    // Salvar o PDF
    doc.save('projecao-municipios-2026.pdf');
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-2 projecao-municipios-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Projeção de Municípios</h2>
        <div className="flex gap-2">
          <Dialog open={showPdfConfigModal} onOpenChange={setShowPdfConfigModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || filteredData.length === 0}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar PDF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Colunas para o PDF</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-municipio"
                      checked={colunasPdf.municipio}
                      onCheckedChange={(checked) =>
                        setColunasPdf({ ...colunasPdf, municipio: checked === true })
                      }
                    />
                    <Label htmlFor="col-municipio" className="cursor-pointer">
                      Município
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-liderancas"
                      checked={colunasPdf.liderancasAtuais}
                      onCheckedChange={(checked) =>
                        setColunasPdf({ ...colunasPdf, liderancasAtuais: checked === true })
                      }
                    />
                    <Label htmlFor="col-liderancas" className="cursor-pointer">
                      Lideranças Atuais
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-votacao2022"
                      checked={colunasPdf.votacao2022}
                      onCheckedChange={(checked) =>
                        setColunasPdf({ ...colunasPdf, votacao2022: checked === true })
                      }
                    />
                    <Label htmlFor="col-votacao2022" className="cursor-pointer">
                      Votação 2022
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-expectativa2026"
                      checked={colunasPdf.expectativa2026}
                      onCheckedChange={(checked) =>
                        setColunasPdf({ ...colunasPdf, expectativa2026: checked === true })
                      }
                    />
                    <Label htmlFor="col-expectativa2026" className="cursor-pointer">
                      Expectativa 2026
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-crescimento"
                      checked={colunasPdf.crescimento}
                      onCheckedChange={(checked) =>
                        setColunasPdf({ ...colunasPdf, crescimento: checked === true })
                      }
                    />
                    <Label htmlFor="col-crescimento" className="cursor-pointer">
                      Crescimento
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-eleitores"
                      checked={colunasPdf.eleitores}
                      onCheckedChange={(checked) =>
                        setColunasPdf({ ...colunasPdf, eleitores: checked === true })
                      }
                    />
                    <Label htmlFor="col-eleitores" className="cursor-pointer">
                      Eleitores
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-alcance"
                      checked={colunasPdf.alcance}
                      onCheckedChange={(checked) =>
                        setColunasPdf({ ...colunasPdf, alcance: checked === true })
                      }
                    />
                    <Label htmlFor="col-alcance" className="cursor-pointer">
                      Alcance
                    </Label>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="resumo-estatisticas"
                      checked={incluirResumoEstatisticas}
                      onCheckedChange={(checked) =>
                        setIncluirResumoEstatisticas(checked === true)
                      }
                    />
                    <Label htmlFor="resumo-estatisticas" className="cursor-pointer">
                      Incluir Resumo das Estatísticas
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPdfConfigModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPdfConfigModal(false);
                      gerarPDF();
                    }}
                  >
                    Gerar PDF
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={gerarPDF}
            disabled={loading || filteredData.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={buscarProjecoes}
            disabled={loading}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Mapa Interativo do Piauí - TEMPORARIAMENTE COMENTADO */}
      {/* 
      <div className="mb-8 w-full overflow-hidden">
        <MapaPiaui onFilterChange={handleMapFilterChange} />
      </div>
      */}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Buscar município..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-xs"
          />
          
          {/* Filtros de Expectativa 2026 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Expectativa 2026:</span>
            <div className="flex gap-1">
              <Button
                variant={filtroExpectativa === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroExpectativaChange('todos')}
                className="text-xs px-2 py-1 h-7"
              >
                Todos
              </Button>
              <Button
                variant={filtroExpectativa === 'ate100' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroExpectativaChange('ate100')}
                className="text-xs px-2 py-1 h-7"
              >
                Até 100 votos
              </Button>
              <Button
                variant={filtroExpectativa === 'mais150' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroExpectativaChange('mais150')}
                className="text-xs px-2 py-1 h-7"
              >
                150+ votos
              </Button>
              <Button
                variant={filtroExpectativa === 'mais300' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroExpectativaChange('mais300')}
                className="text-xs px-2 py-1 h-7"
              >
                300+ votos
              </Button>
              <Button
                variant={filtroExpectativa === 'mais500' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroExpectativaChange('mais500')}
                className="text-xs px-2 py-1 h-7"
              >
                500+ votos
              </Button>
              <Button
                variant={filtroExpectativa === 'mais1000' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroExpectativaChange('mais1000')}
                className="text-xs px-2 py-1 h-7"
              >
                1000+ votos
              </Button>
            </div>
          </div>
          
          {/* Estatísticas dos filtros */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Total: {calcularEstatisticasFiltro().total}</span>
            <span>Até 100: {calcularEstatisticasFiltro().ate100}</span>
            <span>150+: {calcularEstatisticasFiltro().mais150}</span>
            <span>300+: {calcularEstatisticasFiltro().mais300}</span>
            <span>500+: {calcularEstatisticasFiltro().mais500}</span>
            <span>1000+: {calcularEstatisticasFiltro().mais1000}</span>
          </div>
          
          {/* Filtro de território temporariamente desabilitado
          {territorioSelecionado && (
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              <span>Filtro: {territorioSelecionado}</span>
              <button
                onClick={() => handleMapFilterChange(null, [])}
                className="text-orange-600 hover:text-orange-800"
                title="Remover filtro"
              >
                ×
              </button>
            </div>
          )}
          */}
        </div>
        <div className="text-sm text-gray-500">
          Mostrando {Math.min(itemsPerPage, filteredData.length)} de {filteredData.length} registros
          {filtroExpectativa !== 'todos' && (
            <span className="ml-2 text-blue-600">
              (filtrado por expectativa {filtroExpectativa === 'ate100' ? 'até 100' : filtroExpectativa === 'mais150' ? '150+' : filtroExpectativa === 'mais300' ? '300+' : filtroExpectativa === 'mais500' ? '500+' : '1000+'} votos)
            </span>
          )}
          {/* Filtro de território temporariamente desabilitado
          {territorioSelecionado && (
            <span className="ml-2 text-orange-600">
              (filtrado por {territorioSelecionado})
            </span>
          )}
          */}
        </div>
      </div>

      <Card className="mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('municipio')} className="cursor-pointer">
                Município
                <ArrowUpDown className="h-4 w-4 inline-block ml-2" />
              </TableHead>
              <TableHead onClick={() => handleSort('liderancasAtuais')} className="cursor-pointer text-right">
                Lideranças Atuais
                <ArrowUpDown className="h-4 w-4 inline-block ml-2" />
              </TableHead>
              <TableHead onClick={() => handleSort('votacao2022')} className="cursor-pointer text-right">
                Votação 2022
                <ArrowUpDown className="h-4 w-4 inline-block ml-2" />
              </TableHead>
              <TableHead onClick={() => handleSort('expectativa2026')} className="cursor-pointer text-right">
                Expectativa 2026
                <ArrowUpDown className="h-4 w-4 inline-block ml-2" />
              </TableHead>
              <TableHead onClick={() => handleSort('crescimento')} className="cursor-pointer text-right">
                Crescimento
                <ArrowUpDown className="h-4 w-4 inline-block ml-2" />
              </TableHead>
              <TableHead onClick={() => handleSort('eleitores')} className="cursor-pointer text-right">
                Eleitores
                <ArrowUpDown className="h-4 w-4 inline-block ml-2" />
              </TableHead>
              <TableHead onClick={() => handleSort('alcance')} className="cursor-pointer text-right">
                Alcance
                <ArrowUpDown className="h-4 w-4 inline-block ml-2" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.municipio}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal hover:text-primary hover:underline"
                    onClick={() => buscarLiderancas(item.municipio)}
                  >
                    {isNaN(item.liderancasAtuais) ? 'Ver lideranças' : formatNumber(item.liderancasAtuais)}
                  </Button>
                </TableCell>
                <TableCell className="text-right">{formatNumber(item.votacao2022)}</TableCell>
                <TableCell className="text-right">{formatNumber(item.expectativa2026)}</TableCell>
                <TableCell className="text-right">{formatPercentage(item.crescimento)}</TableCell>
                <TableCell className="text-right">{formatNumber(item.eleitores)}</TableCell>
                <TableCell className="text-right">{formatPercentage(item.alcance)}</TableCell>
              </TableRow>
            ))}
            {/* Linha de Totalizador */}
            <TableRow className="bg-gray-100 font-semibold">
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="text-right font-bold">{formatNumber(totais.liderancasAtuais)}</TableCell>
              <TableCell className="text-right font-bold">{formatNumber(totais.votacao2022)}</TableCell>
              <TableCell className="text-right font-bold">{formatNumber(totais.expectativa2026)}</TableCell>
              <TableCell className="text-right font-bold">{formatPercentage(totais.crescimento)}</TableCell>
              <TableCell className="text-right font-bold">{formatNumber(totais.eleitores)}</TableCell>
              <TableCell className="text-right font-bold">{formatPercentage(totais.alcance)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <span className="text-sm text-gray-500">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <Dialog open={showLiderancasModal} onOpenChange={setShowLiderancasModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              Lideranças de {selectedMunicipio}
            </DialogTitle>
          </DialogHeader>
          {loadingLiderancas ? (
            <div className="flex justify-center items-center p-4">
              <RotateCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Liderança</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cargo 2024</TableHead>
                    <TableHead className="text-right">Expectativa 2026</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liderancas.map((lideranca, index) => (
                    <TableRow key={index}>
                      <TableCell>{lideranca.lideranca}</TableCell>
                      <TableCell>{lideranca.liderancaAtual}</TableCell>
                      <TableCell>{lideranca.cargo2024 || '-'}</TableCell>
                      <TableCell className="text-right">{lideranca.expectativa2026 || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {liderancas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        Nenhuma liderança encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 