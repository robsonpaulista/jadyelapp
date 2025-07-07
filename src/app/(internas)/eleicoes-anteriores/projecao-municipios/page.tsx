"use client";

import { useEffect, useState } from "react";
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
import { ArrowUpDown, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
  const [loadingLiderancas, setLoadingLiderancas] = useState(false);

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
      setModalOpen(true);
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

  const filteredData = sortedData.filter(item =>
    item.municipio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-8 py-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Projeção de Municípios</h2>
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

      <div className="flex justify-between items-center mb-4">
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
        <div className="text-sm text-gray-500">
          Mostrando {Math.min(itemsPerPage, filteredData.length)} de {filteredData.length} registros
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
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