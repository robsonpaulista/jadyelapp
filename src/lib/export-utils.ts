import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Emenda } from '@/types/emenda';

interface SaldosBlocos {
  [municipio: string]: {
    mac: { limite: number | null; propostas: number; valorPagar: number; saldo: number | null };
    pap: { limite: number | null; propostas: number; valorPagar: number; saldo: number | null };
  }
}

export const exportToCSV = (data: Emenda[], fileName: string = 'emendas', saldosBlocos?: SaldosBlocos, contingenciamentoAtivo: boolean = true) => {
  const csvContent = convertToCSV(data, saldosBlocos, contingenciamentoAtivo);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}.csv`);
};

export const exportToExcel = (data: Emenda[], fileName: string = 'emendas', saldosBlocos?: SaldosBlocos, contingenciamentoAtivo: boolean = true) => {
  const exportData = data.map(item => {
    const saldoMac = saldosBlocos?.[item.municipioBeneficiario || '']?.mac?.saldo || null;
    const saldoPap = saldosBlocos?.[item.municipioBeneficiario || '']?.pap?.saldo || null;
    
    // Adicionar contingenciamento apenas para Bloco 3 e se estiver ativo
    const contingenciamento = (item.bloco === 'BLOCO 3' && contingenciamentoAtivo) ? 
      (item.valorIndicado || 0) * (17.14 / 100) : null;
    
    return {
      ...item,
      saldoMac,
      saldoPap,
      contingenciamento
    };
  });
  
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Emendas');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportToPDF = (data: Emenda[], fileName: string = 'emendas', saldosBlocos?: SaldosBlocos, contingenciamentoAtivo: boolean = true) => {
  const doc = new jsPDF();
  
  // Adiciona título
  doc.setFontSize(16);
  doc.text('Relatório de Emendas', 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 22);
  
  // Verificar se há dados do Bloco 3 para incluir coluna de contingenciamento
  const hasBloco3 = data.some(item => item.bloco === 'BLOCO 3') && contingenciamentoAtivo;
  
  const tableColumn = [
    'Bloco',
    'Emenda',
    'Município',
    'Valor Indicado',
    ...(hasBloco3 ? ['Conting.17,14%'] : []),
    'Valor Empenhado',
    'Valor Pago',
    'Saldo MAC',
    'Saldo PAP'
  ];
  
  const tableRows = data.map(item => {
    const saldoMac = saldosBlocos?.[item.municipioBeneficiario || '']?.mac?.saldo || null;
    const saldoPap = saldosBlocos?.[item.municipioBeneficiario || '']?.pap?.saldo || null;
    
    const baseRow = [
      item.bloco || '',
      item.emenda || '',
      item.municipioBeneficiario || '',
      formatCurrency(item.valorIndicado)
    ];
    
    // Adicionar contingenciamento apenas para Bloco 3 (antes do valor empenhado)
    if (hasBloco3) {
      const contingenciamento = item.bloco === 'BLOCO 3' ? 
        formatCurrency((item.valorIndicado || 0) * (17.14 / 100)) : '';
      baseRow.push(contingenciamento);
    }
    
    baseRow.push(
      formatCurrency(item.valorEmpenhado),
      formatCurrency(item.valorPago),
      formatCurrency(saldoMac),
      formatCurrency(saldoPap)
    );
    
    return baseRow;
  });

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
  const totalRow = [
    'TOTAL',
    '',
    '',
    formatCurrency(totais.valorIndicado)
  ];
  
  if (hasBloco3) {
    totalRow.push(''); // Coluna de contingenciamento vazia para totais
  }
  
  totalRow.push(
    formatCurrency(totais.valorEmpenhado),
    formatCurrency(totais.valorPago),
    '', // Colunas de saldo vazias para totais
    ''
  );
  tableRows.push(totalRow);

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
      ...(hasBloco3 ? { 4: { halign: 'right' } } : {}),
      [hasBloco3 ? 5 : 4]: { halign: 'right' },
      [hasBloco3 ? 6 : 5]: { halign: 'right' },
      [hasBloco3 ? 7 : 6]: { halign: 'right' },
      [hasBloco3 ? 8 : 7]: { halign: 'right' }
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

const convertToCSV = (data: Emenda[], saldosBlocos?: SaldosBlocos, contingenciamentoAtivo: boolean = true): string => {
  const hasBloco3 = data.some(item => item.bloco === 'BLOCO 3') && contingenciamentoAtivo;
  
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
    ...(hasBloco3 ? ['Conting.17,14%'] : []),
    'Valor Empenhado',
    'Empenho',
    'Data Empenho',
    'Portaria/Convênio/Contrato',
    'Valor a Empenhar',
    'Pagamento',
    'Valor Pago',
    'Valor a Ser Pago',
    'Lideranças',
    'Saldo MAC',
    'Saldo PAP'
  ].join(';');

  const rows = data.map(item => {
    const saldoMac = saldosBlocos?.[item.municipioBeneficiario || '']?.mac?.saldo || null;
    const saldoPap = saldosBlocos?.[item.municipioBeneficiario || '']?.pap?.saldo || null;

    const baseRow = [
      item.bloco || '',
      item.emenda || '',
      item.municipioBeneficiario || '',
      item.funcional || '',
      item.gnd || '',
      formatCurrency(item.valorIndicado),
      item.objeto || '',
      item.alteracao || '',
      item.numeroProposta || ''
    ];
    
    // Adicionar contingenciamento apenas para Bloco 3 (antes do valor empenhado)
    if (hasBloco3) {
      const contingenciamento = item.bloco === 'BLOCO 3' ? 
        formatCurrency((item.valorIndicado || 0) * (17.14 / 100)) : '';
      baseRow.push(contingenciamento);
    }
    
    baseRow.push(
      formatCurrency(item.valorEmpenhado),
      item.empenho || '',
      item.dataEmpenho || '',
      item.portariaConvenioContrato || '',
      formatCurrency(item.valorAEmpenhar),
      item.pagamento || '',
      formatCurrency(item.valorPago),
      formatCurrency(item.valorASerPago),
      item.liderancas || '',
      formatCurrency(saldoMac),
      formatCurrency(saldoPap)
    );
    
    return baseRow.join(';');
  });

  return [headers, ...rows].join('\n');
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return '';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};
