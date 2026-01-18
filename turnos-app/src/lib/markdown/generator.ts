import type { GeneratedSchedule } from '../../types';
import { MESES, DIAS_SEMANA } from '../../types';
import { parseISODate } from '../scheduling/dateUtils';

/**
 * Genera el contenido markdown para un schedule generado
 */
export function generarMarkdownTurnos(schedule: GeneratedSchedule): string {
  const { mes, año, turnos, conteo } = schedule;
  const nombreMes = MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1);

  const lineas: string[] = [];
  lineas.push(`# Turnos ${nombreMes} ${año}\n`);

  for (const turno of turnos) {
    const fecha = parseISODate(turno.fecha);
    const diaSemana = DIAS_SEMANA[turno.diaSemana];
    const fechaStr = `${diaSemana} ${fecha.getDate()} de ${MESES[mes]} de ${año}`;

    lineas.push(`\n## ${fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1)}\n`);
    lineas.push(`- **Abre**: ${turno.abre}`);

    for (const adicional of turno.adicionales) {
      lineas.push(`- ${adicional}`);
    }

    lineas.push('');
  }

  // Agregar resumen de participación
  lineas.push('\n---\n');
  lineas.push('## Resumen de Participación\n');
  lineas.push('| Diácono | Turnos |');
  lineas.push('|---------|--------|');

  // Ordenar por turnos (desc) y luego por nombre (asc)
  const entries = Object.entries(conteo).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // Ordenar por turnos desc
    return a[0].localeCompare(b[0]); // Ordenar por nombre asc
  });

  for (const [diacono, turnosCount] of entries) {
    lineas.push(`| ${diacono} | ${turnosCount} |`);
  }

  lineas.push('');

  return lineas.join('\n');
}

/**
 * Descarga un archivo markdown con el contenido generado
 */
export function descargarMarkdown(contenido: string, nombreArchivo: string): void {
  const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
