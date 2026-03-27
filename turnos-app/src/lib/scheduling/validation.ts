import type { Diacono, Turno } from '../../types';

export function canBeOpener(diacono: Diacono, diaSemana: number): boolean {
  if (diaSemana === 5) return diacono.abreSabado;
  if (diaSemana === 2) return diacono.abreMiercoles;
  return false;
}

export function isDeaconInShift(turno: Turno, nombre: string): boolean {
  return turno.abre === nombre || turno.adicionales.includes(nombre);
}
