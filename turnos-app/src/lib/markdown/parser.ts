import type { Diacono } from '../../types';
import { parseDDMMYYYY, toISODate } from '../scheduling/dateUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parsea una línea de excepciones o preferencias (DD/MM/YYYY, DD/MM/YYYY)
 * y retorna un array de strings ISO (YYYY-MM-DD)
 */
function parseExcepciones(texto: string): string[] {
  if (!texto || !texto.trim()) {
    return [];
  }

  const fechas: string[] = [];
  for (const fechaStr of texto.split(',')) {
    const trimmed = fechaStr.trim();
    if (trimmed) {
      const date = parseDDMMYYYY(trimmed);
      if (date) {
        fechas.push(toISODate(date));
      }
    }
  }

  return fechas;
}

/**
 * Parsea un archivo markdown de diáconos y retorna un array de objetos Diacono
 *
 * Formato esperado:
 * | Nombre | Abre Sábado | Abre Miércoles | Grupo | Activo | Excepciones | Preferencias | Max |
 * |--------|-------------|----------------|-------|--------|-------------|--------------|-----|
 * | Juan   | SI          | NO             | A     | SI     | 01/01/2025  | 15/01/2025   | 2   |
 */
export function parseDiaconosMarkdown(contenido: string): Diacono[] {
  const lineas = contenido.split('\n');
  const diaconos: Diacono[] = [];

  for (const linea of lineas) {
    const trimmed = linea.trim();

    // Saltar líneas vacías, headers y separadores
    if (!trimmed || !trimmed.startsWith('|') || trimmed.includes('Nombre') || trimmed.includes('---')) {
      continue;
    }

    // Dividir por pipe y limpiar espacios
    const partes = trimmed.split('|').map(p => p.trim());
    
    // Eliminar el primer y último elemento (vacíos por los pipes inicial y final)
    const cols = partes.slice(1, -1);

    if (cols.length < 5) {
      continue; // Línea inválida
    }

    const nombre = cols[0];
    const abreSabado = cols[1].toUpperCase() === 'SI';
    const abreMiercoles = cols[2].toUpperCase() === 'SI';
    const grupo = cols[3] || '';

    // Columna Activo (índice 4): SI por defecto si vacío
    const activoStr = cols[4] || '';
    const activo = activoStr.toUpperCase() !== 'NO';

    // Columna Excepciones (índice 5)
    const excepcionesStr = cols[5] || '';
    const excepciones = parseExcepciones(excepcionesStr);

    // Columna Preferencias (índice 6)
    const preferenciasStr = cols[6] || '';
    const preferencias = parseExcepciones(preferenciasStr);

    // Columna Max (índice 7): máximo de turnos por mes
    const maxStr = cols[7] || '';
    const maxTurnosSab = maxStr.trim() && !isNaN(Number(maxStr.trim()))
      ? Number(maxStr.trim())
      : undefined;

    const diacono: Diacono = {
      id: uuidv4(),
      nombre,
      abreSabado,
      abreMiercoles,
      grupo,
      activo,
      excepciones,
      preferencias,
      maxTurnosSab,
    };

    diaconos.push(diacono);
  }

  return diaconos;
}
