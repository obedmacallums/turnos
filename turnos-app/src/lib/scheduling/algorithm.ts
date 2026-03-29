import seedrandom from 'seedrandom';
import type { Diacono, DiaconosData, Turno } from '../../types';
import { obtenerFechasMes, parseISODate, toISODate, isSameDate } from './dateUtils';

/**
 * Convierte un array de Diacono a la estructura DiaconosData
 * que usa el algoritmo de asignación
 */
export function prepararDiaconosData(diaconos: Diacono[]): DiaconosData {
  const activos = diaconos.filter(d => d.activo);

  const data: DiaconosData = {
    todos: [],
    abre_sabado: [],
    abre_miercoles: [],
    grupos: {},
    diacono_grupo: {},
    excepciones: {},
    preferencias: {},
    max_turnos_sab: {},
  };

  for (const diacono of activos) {
    data.todos.push(diacono.nombre);

    if (diacono.abreSabado) {
      data.abre_sabado.push(diacono.nombre);
    }

    if (diacono.abreMiercoles) {
      data.abre_miercoles.push(diacono.nombre);
    }

    if (diacono.grupo) {
      data.diacono_grupo[diacono.nombre] = diacono.grupo;
      if (!data.grupos[diacono.grupo]) {
        data.grupos[diacono.grupo] = [];
      }
      data.grupos[diacono.grupo].push(diacono.nombre);
    }

    if (diacono.excepciones.length > 0) {
      data.excepciones[diacono.nombre] = diacono.excepciones.map(parseISODate);
    }

    if (diacono.preferencias.length > 0) {
      data.preferencias[diacono.nombre] = diacono.preferencias.map(parseISODate);
    }

    if (diacono.maxTurnosSab !== undefined && diacono.maxTurnosSab !== null) {
      data.max_turnos_sab[diacono.nombre] = diacono.maxTurnosSab;
    }
  }

  return data;
}

/**
 * Obtiene los familiares de un diácono (excluyéndolo a él mismo)
 */
function obtenerFamiliares(
  nombre: string,
  grupos: Record<string, string[]>,
  diacono_grupo: Record<string, string>
): string[] {
  if (!(nombre in diacono_grupo)) {
    return [];
  }
  const grupo = diacono_grupo[nombre];
  return grupos[grupo].filter(f => f !== nombre);
}

/**
 * Verifica si el diácono o algún familiar tiene excepción en esta fecha
 */
function tieneExcepcion(
  nombre: string,
  fecha: Date,
  excepciones: Record<string, Date[]>,
  grupos: Record<string, string[]>,
  diacono_grupo: Record<string, string>
): boolean {
  // Verificar excepción del diácono
  if (nombre in excepciones) {
    for (const excepcion of excepciones[nombre]) {
      if (isSameDate(fecha, excepcion)) {
        return true;
      }
    }
  }

  // Verificar excepción de familiares
  if (nombre in diacono_grupo) {
    const grupo = diacono_grupo[nombre];
    for (const familiar of grupos[grupo]) {
      if (familiar in excepciones) {
        for (const excepcion of excepciones[familiar]) {
          if (isSameDate(fecha, excepcion)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Shuffle array in place usando el RNG dado
 */
function shuffle<T>(array: T[], rng: seedrandom.PRNG): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Asigna los turnos de forma equitativa en cuatro fases:
 * 1. Abridores de Sábados
 * 2. Familiares de abridores de Sábado
 * 3. Abridores de Miércoles (prioridad: los que NO abren sábado)
 * 4. Completar Sábados con resto de diáconos (balanceo equitativo)
 *
 * Port fiel del algoritmo de Python con random determinístico
 */
export function asignarTurnos(
  mes: number,
  año: number,
  diaconosData: DiaconosData
): { turnos: Turno[]; conteo: Record<string, number> } {
  // Inicializar RNG con la misma semilla que Python
  const rng = seedrandom(String(año * 100 + mes));

  const conteo: Record<string, number> = {};
  const conteoSabados: Record<string, number> = {};

  for (const nombre of diaconosData.todos) {
    conteo[nombre] = 0;
    conteoSabados[nombre] = 0;
  }

  // Pool de pendientes (diáconos que aún no tienen turno este mes)
  const pool_pendientes = new Set(diaconosData.todos);

  // Copiar y mezclar listas
  const abre_sabado = [...diaconosData.abre_sabado];
  const abre_miercoles = [...diaconosData.abre_miercoles];
  shuffle(abre_sabado, rng);
  shuffle(abre_miercoles, rng);

  const { grupos, diacono_grupo, excepciones, preferencias, max_turnos_sab } = diaconosData;

  // Set de abridores de sábado para verificación rápida
  const set_abre_sabado = new Set(abre_sabado);

  // Función para verificar si el diácono puede recibir más turnos los SÁBADOS
  const puedeAsignarSabado = (nombre: string): boolean => {
    if (nombre in max_turnos_sab) {
      const maxVal = max_turnos_sab[nombre];
      // 0 o undefined/null = sin límite
      if (maxVal === undefined || maxVal === null || maxVal === 0) {
        return true;
      }
      return conteoSabados[nombre] < maxVal;
    }
    return true;
  };

  const fechas = obtenerFechasMes(mes, año);
  const turnosMap: Record<string, Turno> = {};

  // Inicializar turnos
  for (const { fecha, diaSemana } of fechas) {
    const isoFecha = toISODate(fecha);
    turnosMap[isoFecha] = {
      fecha: isoFecha,
      diaSemana,
      abre: '',
      adicionales: [],
    };
  }

  const fechasSabado = fechas.filter(f => f.diaSemana === 5).map(f => toISODate(f.fecha));
  const fechasMiercoles = fechas.filter(f => f.diaSemana === 2).map(f => toISODate(f.fecha));

  // --- FASE 1: Abridores de Sábados ---
  let idx_sabado = 0;
  const openersAssigned = new Set<string>();

  for (const isoFecha of fechasSabado) {
    const fechaObj = parseISODate(isoFecha);
    let quien_abre: string | null = null;
    const allAssigned = openersAssigned.size >= abre_sabado.length;

    // Primero buscar abridor con preferencia para esta fecha
    for (const candidato of abre_sabado) {
      if (
        candidato in preferencias &&
        preferencias[candidato].some(fp => isSameDate(fp, fechaObj)) &&
        !tieneExcepcion(candidato, fechaObj, excepciones, grupos, diacono_grupo) &&
        puedeAsignarSabado(candidato) &&
        (allAssigned || !openersAssigned.has(candidato))
      ) {
        quien_abre = candidato;
        break;
      }
    }

    // Si no hay preferencia, usar rotación normal
    if (quien_abre === null) {
      let intentos = 0;
      while (intentos < abre_sabado.length) {
        const candidato = abre_sabado[(idx_sabado + intentos) % abre_sabado.length];
        if (
          !tieneExcepcion(candidato, fechaObj, excepciones, grupos, diacono_grupo) &&
          puedeAsignarSabado(candidato) &&
          (allAssigned || !openersAssigned.has(candidato))
        ) {
          quien_abre = candidato;
          idx_sabado += intentos + 1;
          break;
        }
        intentos++;
      }
    }

    if (quien_abre === null) {
      quien_abre = abre_sabado[idx_sabado % abre_sabado.length];
      idx_sabado++;
    }

    turnosMap[isoFecha].abre = quien_abre;
    conteo[quien_abre]++;
    conteoSabados[quien_abre]++;
    pool_pendientes.delete(quien_abre);
    openersAssigned.add(quien_abre);
  }

  // --- FASE 2: Familiares de Abridores de Sábado ---
  for (const isoFecha of fechasSabado) {
    const t = turnosMap[isoFecha];
    const fechaObj = parseISODate(isoFecha);
    const abridor = t.abre;
    const asignados_dia: string[] = [abridor];

    for (const familiar of obtenerFamiliares(abridor, grupos, diacono_grupo)) {
      // Verificar que no sea abridor de sábado (para no tener 2 abridores)
      if (
        !asignados_dia.includes(familiar) &&
        !set_abre_sabado.has(familiar) &&
        puedeAsignarSabado(familiar) &&
        !tieneExcepcion(familiar, fechaObj, excepciones, grupos, diacono_grupo)
      ) {
        asignados_dia.push(familiar);
        conteo[familiar]++;
        conteoSabados[familiar]++;
        pool_pendientes.delete(familiar);
      }
    }

    t.adicionales = asignados_dia.slice(1);
  }

  // --- FASE 3: Abridores de Miércoles ---
  // Priorizar los que NO abren sábado
  const candidatos_miercoles_prioritarios = abre_miercoles.filter(
    d => !set_abre_sabado.has(d)
  );
  const candidatos_miercoles_fallback = abre_miercoles.filter(
    d => set_abre_sabado.has(d)
  );
  shuffle(candidatos_miercoles_prioritarios, rng);
  shuffle(candidatos_miercoles_fallback, rng);

  // Combinar: prioritarios primero, fallback después
  const candidatos_miercoles_ordenados = [
    ...candidatos_miercoles_prioritarios,
    ...candidatos_miercoles_fallback,
  ];

  let idx_miercoles = 0;
  const openersWedAssigned = new Set<string>();

  for (const isoFecha of fechasMiercoles) {
    const fechaObj = parseISODate(isoFecha);
    let quien_abre: string | null = null;
    const allWedAssigned = openersWedAssigned.size >= candidatos_miercoles_ordenados.length;

    // Primero buscar abridor con preferencia para esta fecha
    for (const candidato of candidatos_miercoles_ordenados) {
      if (
        candidato in preferencias &&
        preferencias[candidato].some(fp => isSameDate(fp, fechaObj)) &&
        !tieneExcepcion(candidato, fechaObj, excepciones, grupos, diacono_grupo) &&
        (allWedAssigned || !openersWedAssigned.has(candidato))
      ) {
        quien_abre = candidato;
        break;
      }
    }

    // Si no hay preferencia, usar rotación normal
    if (quien_abre === null) {
      let intentos = 0;
      while (intentos < candidatos_miercoles_ordenados.length) {
        const candidato = candidatos_miercoles_ordenados[
          (idx_miercoles + intentos) % candidatos_miercoles_ordenados.length
        ];
        if (
          !tieneExcepcion(candidato, fechaObj, excepciones, grupos, diacono_grupo) &&
          (allWedAssigned || !openersWedAssigned.has(candidato))
        ) {
          quien_abre = candidato;
          idx_miercoles += intentos + 1;
          break;
        }
        intentos++;
      }
    }

    if (quien_abre === null) {
      quien_abre = candidatos_miercoles_ordenados[
        idx_miercoles % candidatos_miercoles_ordenados.length
      ];
      idx_miercoles++;
    }

    turnosMap[isoFecha].abre = quien_abre;
    conteo[quien_abre]++;
    openersWedAssigned.add(quien_abre);
    pool_pendientes.delete(quien_abre);
  }

  // --- FASE 4: Completar Sábados (con balanceo equitativo) ---
  // Primero, procesar preferencias
  for (const isoFecha of fechasSabado) {
    const t = turnosMap[isoFecha];
    const fechaObj = parseISODate(isoFecha);
    const asignados_dia: string[] = [t.abre, ...t.adicionales];

    for (const [nombre, fechas_pref] of Object.entries(preferencias)) {
      const tienePreferencia = fechas_pref.some(fp => isSameDate(fp, fechaObj));
      if (tienePreferencia && !asignados_dia.includes(nombre)) {
        // Verificar que no sea abridor de sábado (restricción de separar abridores)
        if (set_abre_sabado.has(nombre)) {
          continue;
        }
        if (!puedeAsignarSabado(nombre)) {
          continue;
        }
        if (tieneExcepcion(nombre, fechaObj, excepciones, grupos, diacono_grupo)) {
          continue;
        }

        asignados_dia.push(nombre);
        conteo[nombre]++;
        conteoSabados[nombre]++;
        pool_pendientes.delete(nombre);

        // Familiares del de la preferencia (que no sean abridores)
        for (const familiar of obtenerFamiliares(nombre, grupos, diacono_grupo)) {
          if (
            !asignados_dia.includes(familiar) &&
            !set_abre_sabado.has(familiar) &&
            puedeAsignarSabado(familiar) &&
            !tieneExcepcion(familiar, fechaObj, excepciones, grupos, diacono_grupo)
          ) {
            asignados_dia.push(familiar);
            conteo[familiar]++;
            conteoSabados[familiar]++;
            pool_pendientes.delete(familiar);
          }
        }
      }
    }

    t.adicionales = asignados_dia.slice(1);
  }

  // Candidatos válidos para sábados: todos los que NO son abridores de sábado
  const candidatos_validos = diaconosData.todos.filter(
    d => !set_abre_sabado.has(d)
  );

  // Distribuir equitativamente: asignar al sábado con menos personas
  // Prioridad: diáconos sin turno primero
  const diaconos_sin_turno = candidatos_validos.filter(d => conteo[d] === 0);
  const diaconos_con_turno = candidatos_validos.filter(
    d => conteo[d] > 0 && !set_abre_sabado.has(d)
  );
  shuffle(diaconos_sin_turno, rng);
  shuffle(diaconos_con_turno, rng);

  // Asignar primero los que no tienen turno
  for (const candidato of diaconos_sin_turno) {
    if (!puedeAsignarSabado(candidato)) {
      continue;
    }

    // Encontrar el sábado con menos personas donde pueda ser asignado
    const sabados_disponibles = fechasSabado.filter(isoFecha => {
      const fechaObj = parseISODate(isoFecha);
      const t = turnosMap[isoFecha];
      return (
        !tieneExcepcion(candidato, fechaObj, excepciones, grupos, diacono_grupo) &&
        !t.adicionales.includes(candidato) &&
        t.abre !== candidato
      );
    });

    if (sabados_disponibles.length > 0) {
      const sabado_menor = sabados_disponibles.reduce((min, curr) =>
        turnosMap[curr].adicionales.length < turnosMap[min].adicionales.length
          ? curr
          : min
      );

      turnosMap[sabado_menor].adicionales.push(candidato);
      conteo[candidato]++;
      conteoSabados[candidato]++;
      pool_pendientes.delete(candidato);

      // Incluir familiares (que no sean abridores)
      const fechaObjMenor = parseISODate(sabado_menor);
      for (const familiar of obtenerFamiliares(candidato, grupos, diacono_grupo)) {
        if (
          !turnosMap[sabado_menor].adicionales.includes(familiar) &&
          turnosMap[sabado_menor].abre !== familiar &&
          !set_abre_sabado.has(familiar) &&
          puedeAsignarSabado(familiar) &&
          !tieneExcepcion(familiar, fechaObjMenor, excepciones, grupos, diacono_grupo)
        ) {
          turnosMap[sabado_menor].adicionales.push(familiar);
          conteo[familiar]++;
          conteoSabados[familiar]++;
          pool_pendientes.delete(familiar);
        }
      }
    }
  }

  // Luego distribuir el resto para balancear
  for (const candidato of diaconos_con_turno) {
    if (!puedeAsignarSabado(candidato)) {
      continue;
    }

    // Encontrar el sábado con menos personas
    const sabados_disponibles = fechasSabado.filter(isoFecha => {
      const fechaObj = parseISODate(isoFecha);
      const t = turnosMap[isoFecha];
      return (
        !tieneExcepcion(candidato, fechaObj, excepciones, grupos, diacono_grupo) &&
        !t.adicionales.includes(candidato) &&
        t.abre !== candidato
      );
    });

    if (sabados_disponibles.length > 0) {
      // Calcular el promedio actual de personas por sábado
      const personas_por_sabado = fechasSabado.map(
        f => 1 + turnosMap[f].adicionales.length
      );
      const min_personas = Math.min(...personas_por_sabado);
      const max_personas = Math.max(...personas_por_sabado);

      // Solo asignar si ayuda a balancear (diferencia > 1)
      if (max_personas - min_personas > 1) {
        const sabado_menor = sabados_disponibles.reduce((min, curr) =>
          turnosMap[curr].adicionales.length < turnosMap[min].adicionales.length
            ? curr
            : min
        );

        if (1 + turnosMap[sabado_menor].adicionales.length < max_personas) {
          turnosMap[sabado_menor].adicionales.push(candidato);
          conteo[candidato]++;
          conteoSabados[candidato]++;
          pool_pendientes.delete(candidato);
        }
      }
    }
  }

  // --- Verificación final (Faltantes) ---
  const faltantes = diaconosData.todos.filter(d => conteo[d] === 0);
  if (faltantes.length > 0) {
    const turnos_sabado = fechasSabado.map(f => turnosMap[f]);
    for (const f of faltantes) {
      const disponibles = turnos_sabado.filter(
        t =>
          !tieneExcepcion(f, parseISODate(t.fecha), excepciones, grupos, diacono_grupo) &&
          puedeAsignarSabado(f)
      );
      if (disponibles.length > 0) {
        const t_menor = disponibles.reduce((min, curr) =>
          curr.adicionales.length < min.adicionales.length ? curr : min
        );
        if (!t_menor.adicionales.includes(f) && t_menor.abre !== f) {
          t_menor.adicionales.push(f);
          conteo[f]++;
          conteoSabados[f]++;
          for (const familiar of obtenerFamiliares(f, grupos, diacono_grupo)) {
            if (
              !t_menor.adicionales.includes(familiar) &&
              t_menor.abre !== familiar &&
              !set_abre_sabado.has(familiar) &&
              puedeAsignarSabado(familiar)
            ) {
              t_menor.adicionales.push(familiar);
              conteo[familiar]++;
              conteoSabados[familiar]++;
            }
          }
        }
      }
    }
  }

  return { turnos: Object.values(turnosMap), conteo };
}
