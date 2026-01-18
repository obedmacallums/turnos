export interface Diacono {
  id: string;
  nombre: string;
  abreSabado: boolean;
  abreMiercoles: boolean;
  grupo: string;
  activo: boolean;
  excepciones: string[];    // ISO dates (YYYY-MM-DD)
  preferencias: string[];   // ISO dates (YYYY-MM-DD)
  maxTurnosSab?: number;
}

export interface Turno {
  fecha: string;           // ISO date (YYYY-MM-DD)
  diaSemana: number;       // 2=miércoles, 5=sábado (Python weekday format)
  abre: string;            // nombre del diácono que abre
  adicionales: string[];   // nombres de los diáconos adicionales
}

export interface GeneratedSchedule {
  id: string;
  mes: number;             // 1-12
  año: number;
  turnos: Turno[];
  conteo: Record<string, number>;  // nombre -> cantidad de turnos
  generatedAt: string;     // ISO timestamp
}

export interface DiaconosData {
  todos: string[];                    // nombres de todos los diáconos activos
  abre_sabado: string[];             // nombres que pueden abrir sábado
  abre_miercoles: string[];          // nombres que pueden abrir miércoles
  grupos: Record<string, string[]>;   // grupo -> lista de nombres
  diacono_grupo: Record<string, string>; // nombre -> grupo
  excepciones: Record<string, Date[]>; // nombre -> fechas de excepción
  preferencias: Record<string, Date[]>; // nombre -> fechas de preferencia
  max_turnos_sab: Record<string, number>;  // nombre -> máximo de turnos sábados
}

export const MESES: Record<number, string> = {
  1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
  5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
  9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
};

export const DIAS_SEMANA: Record<number, string> = {
  0: "lunes", 1: "martes", 2: "miércoles", 3: "jueves",
  4: "viernes", 5: "sábado", 6: "domingo"
};
