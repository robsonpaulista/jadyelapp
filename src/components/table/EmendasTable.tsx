import React from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, type ColumnDef } from '@tanstack/react-table';
import { TableHeader } from './TableHeader';
import { type Emenda } from '@/types/emenda';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';

interface EmendasTableProps {
  data: Emenda[];
  blocoName: string;
  ordenacaoAtual: { campo: string; direcao: 'asc' | 'desc' } | null;
  onDoubleClick?: (emenda: Emenda) => void;
}

export function EmendasTable({ data, blocoName, ordenacaoAtual, onDoubleClick }: EmendasTableProps) {
  const columns = React.useMemo<ColumnDef<Emenda>[]>(() => [
    { 
      id: 'emenda', 
      accessorFn: (row) => row.emenda,
      sortingFn: 'text'
    },
    { 
      id: 'municipioBeneficiario', 
      accessorFn: (row) => row.municipioBeneficiario,
      sortingFn: 'text'
    },
    { 
      id: 'valorIndicado', 
      accessorFn: (row) => row.valorIndicado,
      sortingFn: 'number'
    },
    { 
      id: 'valorAEmpenhar', 
      accessorFn: (row) => row.valorAEmpenhar,
      sortingFn: 'number'
    },
    { 
      id: 'valorEmpenhado', 
      accessorFn: (row) => row.valorEmpenhado,
      sortingFn: 'number'
    },
    { 
      id: 'valorPago', 
      accessorFn: (row) => row.valorPago,
      sortingFn: 'number'
    },
    { 
      id: 'liderancas', 
      accessorFn: (row) => row.liderancas,
      sortingFn: 'text'
    },
    { 
      id: 'objeto', 
      accessorFn: (row) => row.objeto,
      sortingFn: 'text'
    }
  ], []);

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});

  const handleColumnResize = (columnId: string, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: width
    }));
  };

  const handleAllColumnsResize = (width: number) => {
    const newWidths: Record<string, number> = {};
    columns.forEach(column => {
      if (typeof column.id === 'string') {
        newWidths[column.id] = width;
      }
    });
    setColumnWidths(newWidths);
  };

  // Função para obter o estilo da coluna com largura customizada
  const getColumnStyle = (columnId: string) => {
    const width = columnWidths[columnId];
    return width ? { width: `${width}px`, minWidth: `${width}px` } : {};
  };

  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>([]);

  // Dados ordenados localmente
  const [sortedData, setSortedData] = React.useState(data);

  React.useEffect(() => {
    setSortedData(data);
  }, [data]);

  React.useEffect(() => {
    if (sorting.length > 0) {
      const sortConfig = sorting[0];
      const sorted = [...data].sort((a, b) => {
        const aValue = getValueByColumnId(a, sortConfig.id);
        const bValue = getValueByColumnId(b, sortConfig.id);
        
        // Tratar valores nulos
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sortConfig.desc ? -1 : 1;
        if (bValue === null) return sortConfig.desc ? 1 : -1;
        
        // Ordenação numérica
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.desc ? bValue - aValue : aValue - bValue;
        }
        
        // Ordenação alfabética
        const comparison = String(aValue || '').localeCompare(String(bValue || ''), 'pt-BR', {
          sensitivity: 'base',
          ignorePunctuation: true,
          numeric: true
        });
        return sortConfig.desc ? -comparison : comparison;
      });
      setSortedData(sorted);
    } else {
      setSortedData(data);
    }
  }, [sorting, data]);

  const getValueByColumnId = (row: Emenda, columnId: string): any => {
    switch (columnId) {
      case 'emenda': return row.emenda;
      case 'municipioBeneficiario': return row.municipioBeneficiario;
      case 'valorIndicado': return row.valorIndicado;
      case 'valorAEmpenhar': return row.valorAEmpenhar;
      case 'valorEmpenhado': return row.valorEmpenhado;
      case 'valorPago': return row.valorPago;
      case 'liderancas': return row.liderancas;
      case 'objeto': return row.objeto;
      default: return null;
    }
  };

  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    }
  });

  const formatarValor = (valor: number | null) => {
    if (!valor || valor === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2" style={getColumnStyle('emenda')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[0].column}
              title="Emenda"
              onResize={(width) => handleColumnResize('emenda', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
          <th className="px-3 py-2" style={getColumnStyle('municipioBeneficiario')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[1].column}
              title="Município/Beneficiário"
              onResize={(width) => handleColumnResize('municipioBeneficiario', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
          <th className="px-3 py-2" style={getColumnStyle('valorIndicado')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[2].column}
              title="Valor Indicado"
              onResize={(width) => handleColumnResize('valorIndicado', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
          <th className="px-3 py-2" style={getColumnStyle('valorAEmpenhar')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[3].column}
              title="Valor a Empenhar"
              onResize={(width) => handleColumnResize('valorAEmpenhar', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
          <th className="px-3 py-2" style={getColumnStyle('valorEmpenhado')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[4].column}
              title="Valor Empenhado"
              onResize={(width) => handleColumnResize('valorEmpenhado', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
          <th className="px-3 py-2" style={getColumnStyle('valorPago')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[5].column}
              title="Valor Pago"
              onResize={(width) => handleColumnResize('valorPago', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
          <th className="px-3 py-2" style={getColumnStyle('liderancas')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[6].column}
              title="Lideranças"
              onResize={(width) => handleColumnResize('liderancas', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
          <th className="px-3 py-2" style={getColumnStyle('objeto')}>
            <TableHeader
              column={table.getHeaderGroups()[0].headers[7].column}
              title="Objeto"
              onResize={(width) => handleColumnResize('objeto', width)}
              onResizeAll={handleAllColumnsResize}
              onExportCSV={() => exportToCSV(data, `emendas_${blocoName}`)}
              onExportExcel={() => exportToExcel(data, `emendas_${blocoName}`)}
              onExportPDF={() => exportToPDF(data, `emendas_${blocoName}`)}
            />
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {sortedData.map((emenda, index) => (
                                        <tr 
                                key={emenda.id || index} 
                                className="hover:bg-gray-50 cursor-pointer"
                                onDoubleClick={() => onDoubleClick?.(emenda)}
                                title="Duplo clique para editar"
                              >
            <td className="px-3 py-2 font-medium text-gray-900" style={getColumnStyle('emenda')}>{emenda.emenda || 'N/A'}</td>
            <td className="px-3 py-2 text-gray-900" style={getColumnStyle('municipioBeneficiario')}>{emenda.municipioBeneficiario || 'N/A'}</td>
            <td className="px-3 py-2 text-right font-medium text-gray-900" style={getColumnStyle('valorIndicado')}>
              {formatarValor(emenda.valorIndicado)}
            </td>
            <td className="px-3 py-2 text-right font-medium text-gray-900" style={getColumnStyle('valorAEmpenhar')}>
              {formatarValor(emenda.valorAEmpenhar)}
            </td>
            <td className="px-3 py-2 text-right font-medium text-gray-900" style={getColumnStyle('valorEmpenhado')}>
              {formatarValor(emenda.valorEmpenhado)}
            </td>
            <td className="px-3 py-2 text-right font-medium text-gray-900" style={getColumnStyle('valorPago')}>
              {formatarValor(emenda.valorPago)}
            </td>
            <td className="px-3 py-2 text-gray-900" style={getColumnStyle('liderancas')}>{emenda.liderancas || 'N/A'}</td>
            <td className="px-3 py-2 text-gray-900 truncate" style={{...getColumnStyle('objeto'), maxWidth: getColumnStyle('objeto').width || '300px'}} title={emenda.objeto || ''}>
              {emenda.objeto || 'N/A'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
