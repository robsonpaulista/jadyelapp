import React from 'react';
import { Column } from '@tanstack/react-table';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download,
  SortAsc,
  SortDesc,
  Columns,
  FileText,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TableHeaderProps<T> {
  column: Column<T>;
  title: string;
  onResize?: (width: number) => void;
  onResizeAll?: (width: number) => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

export function TableHeader<T>({
  column,
  title,
  onResize,
  onResizeAll,
  onExportCSV,
  onExportExcel,
  onExportPDF
}: TableHeaderProps<T>) {
  const isSorted = column.getIsSorted();

  return (
    <ContextMenu>
      <ContextMenuTrigger className="group flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-blue-50 cursor-pointer select-none transition-colors duration-200 rounded-sm">
        <div className="flex items-center gap-2 font-medium text-gray-700 group-hover:text-blue-700">
          {title}
          {isSorted === 'asc' && <ArrowUp className="h-4 w-4 text-blue-600" />}
          {isSorted === 'desc' && <ArrowDown className="h-4 w-4 text-blue-600" />}
          {!isSorted && <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-70 text-gray-500 transition-opacity" />}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 p-1">
        <ContextMenuItem 
          onClick={() => column.toggleSorting(false)} 
          disabled={!column.getCanSort()}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <SortAsc className="h-4 w-4 text-blue-600" />
          <span className="flex-1">Ordenar A-Z</span>
          {column.getIsSorted() === "asc" && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => column.toggleSorting(true)} 
          disabled={!column.getCanSort()}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <SortDesc className="h-4 w-4 text-blue-600" />
          <span className="flex-1">Ordenar Z-A</span>
          {column.getIsSorted() === "desc" && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
        </ContextMenuItem>
        
        <ContextMenuSeparator className="my-2" />
        
        <ContextMenuItem 
          onClick={() => onResize?.(200)}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Columns className="h-4 w-4 text-gray-600" />
          <span>Ajustar largura desta coluna</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onResizeAll?.(180)}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Columns className="h-4 w-4 text-gray-600" />
          <span>Ajustar largura de todas as colunas</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="my-2" />
        
        <ContextMenuItem 
          onClick={onExportCSV}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-green-50 hover:text-green-700 transition-colors"
        >
          <FileText className="h-4 w-4 text-green-600" />
          <span>Exportar para CSV</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onExportExcel}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Exportar para Excel</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onExportPDF}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <FileDown className="h-4 w-4 text-red-600" />
          <span>Exportar para PDF</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
