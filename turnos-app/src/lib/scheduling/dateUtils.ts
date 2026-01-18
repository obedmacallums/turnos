/**
 * Utilidades para manejo de fechas compatibles con el algoritmo de Python.
 *
 * IMPORTANTE: Python weekday() retorna 0=Lunes, 6=Domingo
 * JavaScript getDay() retorna 0=Domingo, 6=Sábado
 *
 * Esta función convierte de JS a formato Python.
 */

/**
 * Convierte el día de la semana de JavaScript (0=Dom) a formato Python (0=Lun)
 */
export function getWeekdayPython(date: Date): number {
  const jsDay = date.getDay(); // 0=Sunday, 6=Saturday
  // Convert to Python format: 0=Monday, 6=Sunday
  return (jsDay + 6) % 7;
}

/**
 * Obtiene todas las fechas de sábados y miércoles de un mes dado
 */
export function obtenerFechasMes(mes: number, año: number): Array<{ fecha: Date; diaSemana: number }> {
  const fechas: Array<{ fecha: Date; diaSemana: number }> = [];

  // Obtener el número de días en el mes (usar mes-1 porque JS usa 0-indexed)
  const numDias = new Date(año, mes, 0).getDate();

  for (let dia = 1; dia <= numDias; dia++) {
    // Mes - 1 porque JavaScript usa meses 0-indexed
    const fecha = new Date(año, mes - 1, dia);
    const diaSemana = getWeekdayPython(fecha);

    // 2 = miércoles, 5 = sábado en formato Python
    if (diaSemana === 2 || diaSemana === 5) {
      fechas.push({ fecha, diaSemana });
    }
  }

  return fechas;
}

/**
 * Convierte fecha ISO string (YYYY-MM-DD) a Date object
 */
export function parseISODate(isoString: string): Date {
  const [año, mes, dia] = isoString.split('-').map(Number);
  return new Date(año, mes - 1, dia);
}

/**
 * Convierte Date object a ISO string (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  const año = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

/**
 * Compara dos fechas ignorando la hora
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  return toISODate(date1) === toISODate(date2);
}

/**
 * Convierte string DD/MM/YYYY a Date object
 */
export function parseDDMMYYYY(dateStr: string): Date | null {
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;

  const [dia, mes, año] = parts.map(Number);
  if (isNaN(dia) || isNaN(mes) || isNaN(año)) return null;

  return new Date(año, mes - 1, dia);
}

/**
 * Convierte Date object a string DD/MM/YYYY
 */
export function toDDMMYYYY(date: Date): string {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const año = date.getFullYear();
  return `${dia}/${mes}/${año}`;
}
