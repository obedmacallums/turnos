import yaml from 'js-yaml';
import type { GeneratedSchedule, Diacono } from '../../types';

/**
 * Genera el contenido YAML para los diáconos actuales (Backup)
 */
export function generarYamlDiaconos(diaconos: Diacono[]): string {
  const output = {
    diaconos: diaconos.map((d) => ({
      nombre: d.nombre,
      abreSabado: d.abreSabado,
      abreMiercoles: d.abreMiercoles,
      grupo: d.grupo,
      activo: d.activo,
      excepciones: d.excepciones,
      preferencias: d.preferencias,
      maxTurnosSab: d.maxTurnosSab === undefined ? null : d.maxTurnosSab,
    })),
  };

  return yaml.dump(output, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });
}

/**
 * Genera el contenido YAML para un schedule generado
 */
export function generarYamlTurnos(schedule: GeneratedSchedule): string {
  const output = {
    mes: schedule.mes,
    año: schedule.año,
    generatedAt: schedule.generatedAt,
    turnos: schedule.turnos.map((t) => ({
      fecha: t.fecha,
      diaSemana: t.diaSemana,
      abre: t.abre,
      adicionales: t.adicionales,
    })),
    resumen: schedule.conteo,
  };

  return yaml.dump(output, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });
}

/**
 * Descarga un archivo YAML con el contenido generado
 */
export function descargarYaml(contenido: string, nombreArchivo: string): void {
  const blob = new Blob([contenido], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
