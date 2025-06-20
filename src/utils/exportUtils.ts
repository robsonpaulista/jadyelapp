import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

// Tipos de exportação suportados
export type ExportType = 'pdf' | 'png';

// Opções para exportação
interface ExportOptions {
  fileName?: string;
  quality?: number;
  backgroundColor?: string;
  orientation?: 'portrait' | 'landscape';
  padding?: number;
  scale?: number;
  delay?: number;
  expandAllNodes?: boolean;
}

/**
 * Exporta um elemento HTML para PDF ou PNG
 * @param elementId ID do elemento a ser exportado
 * @param type Tipo de exportação (pdf ou png)
 * @param options Opções de exportação
 */
export const exportElement = async (
  elementId: string,
  type: ExportType = 'pdf',
  options: ExportOptions = {}
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento com ID ${elementId} não encontrado`);
    }

    // Configurar opções padrão
    const {
      fileName = 'organograma-liderancas',
      quality = 0.95,
      backgroundColor = '#FFFFFF',
      orientation = 'landscape',
      padding = 20,
      scale = 2,
      delay = 0,
      expandAllNodes = false
    } = options;

    // Se a opção expandAllNodes estiver ativada, expandir todos os nós
    if (expandAllNodes && elementId === 'organograma-mapa') {
      const nodeElements = document.querySelectorAll('.node-button.collapsed');
      nodeElements.forEach((el) => {
        // Criar e disparar um evento de clique para expandir o nó
        el.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          })
        );
      });
      
      // Dar tempo para a DOM reagir e mostrar os nós expandidos
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Esperar o tempo definido antes de gerar a imagem
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Gerar imagem do elemento
    const dataUrl = await htmlToImage.toPng(element, {
      quality,
      backgroundColor,
      pixelRatio: scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${element.offsetWidth}px`,
        height: `${element.offsetHeight}px`,
      },
      // Capturar o estado completo da DOM, incluindo elementos expandidos
      cacheBust: true
    });

    // Exportar como PNG
    if (type === 'png') {
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
      return;
    }

    // Exportar como PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
    });

    // Calcular dimensões para manter a proporção
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = orientation === 'landscape' ? pdf.internal.pageSize.getHeight() : pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Adicionar margem ao PDF
    const marginX = padding;
    const marginY = padding;
    const availableWidth = pdfWidth - (marginX * 2);
    const availableHeight = (orientation === 'landscape' ? pdf.internal.pageSize.getWidth() : pdf.internal.pageSize.getHeight()) - (marginY * 2);

    // Escalar a imagem mantendo a proporção
    let finalWidth = availableWidth;
    let finalHeight = (imgProps.height * finalWidth) / imgProps.width;

    // Se a altura for maior que o espaço disponível, ajustar pela altura
    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = (imgProps.width * finalHeight) / imgProps.height;
    }

    // Centralizar na página
    const x = marginX + (availableWidth - finalWidth) / 2;
    const y = marginY + (availableHeight - finalHeight) / 2;

    // Adicionar a imagem ao PDF
    pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
    
    // Baixar o PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Erro ao exportar elemento:', error);
    throw error;
  }
}; 