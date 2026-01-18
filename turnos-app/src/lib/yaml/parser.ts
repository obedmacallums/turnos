import yaml from 'js-yaml';
import type { Diacono } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface DiaconoYaml {
  nombre: string;
  abreSabado: boolean;
  abreMiercoles: boolean;
  grupo: string;
  activo: boolean;
  excepciones: string[];
  preferencias: string[];
  maxTurnosSab?: number | null;
}

interface DiaconosFile {
  diaconos: DiaconoYaml[];
}

/**
 * Parsea un archivo YAML de diáconos y retorna un array de objetos Diacono
 *
 * Formato esperado:
 * diaconos:
 *   - nombre: Juan Pérez
 *     abreSabado: true
 *     abreMiercoles: false
 *     grupo: A
 *     activo: true
 *     excepciones:
 *       - "2026-01-17"
 *     preferencias: []
 *     maxTurnosSab: null
 */
export function parseDiaconosYaml(contenido: string): Diacono[] {
  const data = yaml.load(contenido) as DiaconosFile;

  if (!data || !data.diaconos || !Array.isArray(data.diaconos)) {
    throw new Error('Formato YAML inválido: se espera un objeto con propiedad "diaconos"');
  }

  return data.diaconos.map((d) => ({
    id: uuidv4(),
    nombre: d.nombre,
    abreSabado: d.abreSabado ?? false,
    abreMiercoles: d.abreMiercoles ?? false,
    grupo: d.grupo ?? '',
    activo: d.activo ?? true,
    excepciones: d.excepciones ?? [],
    preferencias: d.preferencias ?? [],
    maxTurnosSab: d.maxTurnosSab ?? undefined,
  }));
}
