import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Emenda } from '@/types/emenda';

export const exportToCSV = (data: Emenda[], fileName: string = 'emendas') => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}.csv`);
};

export const exportToExcel = (data: Emenda[], fileName: string = 'emendas') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Emendas');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportToPDF = (data: Emenda[], fileName: string = 'emendas') => {
  const doc = new jsPDF();
  
  // Adiciona título
  doc.setFontSize(16);
  doc.text('Relatório de Emendas', 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 22);
  
  const tableColumn = [
    'Bloco',
    'Emenda',
    'Município',
    'Valor Indicado',
    'Valor Empenhado',
    'Valor Pago'
  ];
  
  const tableRows = data.map(item => [
    item.bloco || '',
    item.emenda || '',
    item.municipioBeneficiario || '',
    formatCurrency(item.valorIndicado),
    formatCurrency(item.valorEmpenhado),
    formatCurrency(item.valorPago)
  ]);

  // Calcula totais
  const totais = data.reduce((acc, item) => ({
    valorIndicado: acc.valorIndicado + (item.valorIndicado || 0),
    valorEmpenhado: acc.valorEmpenhado + (item.valorEmpenhado || 0),
    valorPago: acc.valorPago + (item.valorPago || 0)
  }), {
    valorIndicado: 0,
    valorEmpenhado: 0,
    valorPago: 0
  });

  // Adiciona linha de totais
  tableRows.push([
    'TOTAL',
    '',
    '',
    formatCurrency(totais.valorIndicado),
    formatCurrency(totais.valorEmpenhado),
    formatCurrency(totais.valorPago)
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    // Estilo especial para a última linha (totais)
    didParseCell: function(data) {
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  // Adiciona informações adicionais
  const finalY = (doc as any).lastAutoTable.finalY || 30;
  doc.setFontSize(8);
  doc.text(`Total de registros: ${data.length}`, 14, finalY + 10);
  doc.text(`Total de municípios: ${new Set(data.map(e => e.municipioBeneficiario).filter(Boolean)).size}`, 14, finalY + 15);

  doc.save(`${fileName}.pdf`);
};

const convertToCSV = (data: Emenda[]): string => {
  const headers = [
    'Bloco',
    'Emenda',
    'Município',
    'Funcional',
    'GND',
    'Valor Indicado',
    'Objeto',
    'Alteração',
    'Número Proposta',
    'Valor Empenhado',
    'Empenho',
    'Data Empenho',
    'Portaria/Convênio/Contrato',
    'Valor a Empenhar',
    'Pagamento',
    'Valor Pago',
    'Valor a Ser Pago',
    'Lideranças'
  ].join(';');

  const rows = data.map(item => [
    item.bloco || '',
    item.emenda || '',
    item.municipioBeneficiario || '',
    item.funcional || '',
    item.gnd || '',
    formatCurrency(item.valorIndicado),
    item.objeto || '',
    item.alteracao || '',
    item.numeroProposta || '',
    formatCurrency(item.valorEmpenhado),
    item.empenho || '',
    item.dataEmpenho || '',
    item.portariaConvenioContrato || '',
    formatCurrency(item.valorAEmpenhar),
    item.pagamento || '',
    formatCurrency(item.valorPago),
    formatCurrency(item.valorASerPago),
    item.liderancas || ''
  ].join(';'));

  return [headers, ...rows].join('\n');
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return '';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};
