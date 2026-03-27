import type { Turno } from '../../types';

export function recalcularConteo(turnos: Turno[]): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const turno of turnos) {
    conteo[turno.abre] = (conteo[turno.abre] || 0) + 1;
    for (const nombre of turno.adicionales) {
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    }
  }
  return conteo;
}
