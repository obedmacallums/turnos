import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { GeneratedSchedule } from '../../types';
import { MESES } from '../../types';

// Configurar worker de pdf.js desde public folder (para build estático)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Genera el documento PDF (función interna compartida)
 */
function generarDocumentoPdf(schedule: GeneratedSchedule): jsPDF {
  console.log('Iniciando generación de PDF...', schedule);

  if (!schedule.turnos || schedule.turnos.length === 0) {
    throw new Error('No hay turnos para exportar en el schedule');
  }

  const doc = new jsPDF({ orientation: 'landscape' });
  const nombreMes = MESES[schedule.mes];
  const titulo = `Turnos de Diáconos - ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${schedule.año}`;

  // Título del documento
  doc.setFontSize(18);
  doc.text(titulo, 14, 22);

  // Preparar datos para la tabla de turnos siguiendo el formato de la imagen
  const tableData = schedule.turnos.map(turno => {
    const fecha = parseISO(turno.fecha);
    const fechaFormateada = format(fecha, "eeee d 'de' MMMM 'de' yyyy", { locale: es });

    const todos = [turno.abre, ...turno.adicionales].filter(Boolean);
    const nombresLista = todos.join('\n');

    if (turno.diaSemana === 5) { // Sábado
      return [
        fechaFormateada,
        `${turno.abre}\n(8:10 AM)`,
        nombresLista,
        `Abrir y cerrar templo - Recoger ofrendas\n\n${turno.abre}`
      ];
    } else { // Miércoles u otros
      return [
        fechaFormateada,
        {
          content: `${turno.abre} (7:40 PM)`,
          colSpan: 3,
          styles: { halign: 'center' as const }
        }
      ];
    }
  });

  // Tabla principal con el nuevo formato y sin colores
  autoTable(doc, {
    startY: 30,
    head: [[
      'FECHA',
      'Apertura y cierre del Templo',
      'Diezmos, Ofrendas y Apoyo en instalaciones del Templo',
      'Culto Joven (6:10 PM)'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: 255,
      textColor: 0,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: 0
    },
    styles: {
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.2,
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 90 },
      3: { halign: 'center' }
    },
    margin: { top: 30 },
    alternateRowStyles: { fillColor: 255 }
  });

  return doc;
}

/**
 * Genera y descarga un PDF con el calendario de turnos
 */
export function descargarPdfTurnos(schedule: GeneratedSchedule): void {
  try {
    const doc = generarDocumentoPdf(schedule);
    const nombreMes = MESES[schedule.mes];
    const fileName = `Turnos_${nombreMes}_${schedule.año}.pdf`;
    console.log(`Guardando PDF: ${fileName}`);
    doc.save(fileName);
  } catch (error) {
    console.error('Error detallado al generar PDF:', error);
    alert('Hubo un error al generar el PDF. Revisa la consola para más detalles.');
  }
}

/**
 * Descarga imagen JPEG del calendario (convierte el PDF a imagen)
 */
export async function descargarImagenTurnos(schedule: GeneratedSchedule): Promise<void> {
  try {
    // 1. Generar el MISMO PDF
    const doc = generarDocumentoPdf(schedule);

    // 2. Obtener como ArrayBuffer
    const pdfArrayBuffer = doc.output('arraybuffer');

    // 3. Cargar con pdf.js
    const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // 4. Renderizar a canvas (2x escala para mejor calidad)
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d')!;

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    // 5. Exportar como JPEG y descargar
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    const nombreMes = MESES[schedule.mes];
    link.download = `Turnos_${nombreMes}_${schedule.año}.jpg`;
    link.click();

  } catch (error) {
    console.error('Error al generar imagen:', error);
    alert('Hubo un error al generar la imagen.');
  }
}
