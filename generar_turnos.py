#!/usr/bin/env python3
"""
Script para generar turnos de diáconos para un mes específico.
Uso: python generar_turnos.py <mes> <año>
Ejemplo: python generar_turnos.py 12 2025
"""

import sys
import random
import calendar
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DIACONOS_FILE = SCRIPT_DIR / "diaconos.md"

MESES = {
    1: "enero",
    2: "febrero",
    3: "marzo",
    4: "abril",
    5: "mayo",
    6: "junio",
    7: "julio",
    8: "agosto",
    9: "septiembre",
    10: "octubre",
    11: "noviembre",
    12: "diciembre",
}

DIAS_SEMANA = {
    0: "lunes",
    1: "martes",
    2: "miércoles",
    3: "jueves",
    4: "viernes",
    5: "sábado",
    6: "domingo",
}


def parsear_excepciones(texto: str) -> list:
    """Convierte string de fechas DD/MM/YYYY a lista de objetos date."""
    if not texto or not texto.strip():
        return []

    fechas = []
    for fecha_str in texto.split(","):
        fecha_str = fecha_str.strip()
        if fecha_str:
            try:
                dia, mes, año = map(int, fecha_str.split("/"))
                fechas.append(date(año, mes, dia))
            except ValueError:
                continue
    return fechas


def tiene_excepcion(
    nombre: str, fecha: date, excepciones: dict, grupos: dict, diacono_grupo: dict
) -> bool:
    """Verifica si el diácono o algún familiar tiene excepción en esta fecha."""
    if fecha in excepciones.get(nombre, []):
        return True

    if nombre in diacono_grupo:
        grupo = diacono_grupo[nombre]
        for familiar in grupos[grupo]:
            if fecha in excepciones.get(familiar, []):
                return True

    return False


def leer_diaconos(archivo: Path) -> dict:
    """Lee el archivo MD de diáconos y retorna la información estructurada."""
    todos = []
    abre_sabado = []
    abre_miercoles = []
    grupos = {}
    diacono_grupo = {}
    excepciones = {}
    preferencias = {}
    max_turnos_sab = {}

    with open(archivo, "r", encoding="utf-8") as f:
        lineas = f.readlines()

    for linea in lineas:
        linea = linea.strip()
        if linea.startswith("|") and "Nombre" not in linea and "---" not in linea:
            partes = [p.strip() for p in linea.split("|")]
            if len(partes) >= 5:
                nombre = partes[1]
                sabado = partes[2].upper() == "SI"
                miercoles = partes[3].upper() == "SI"
                grupo = partes[4] if len(partes) > 4 else ""

                # Columna Activo (índice 5): SI por defecto si vacío
                activo_str = partes[5] if len(partes) > 5 else ""
                activo = activo_str.upper() != "NO"

                # Columna Excepciones (índice 6)
                excepciones_str = partes[6] if len(partes) > 6 else ""
                fechas_excepcion = parsear_excepciones(excepciones_str)

                # Columna Preferencias (índice 7)
                preferencias_str = partes[7] if len(partes) > 7 else ""
                fechas_preferencia = parsear_excepciones(preferencias_str)

                # Columna Max (índice 8): máximo de turnos sabado por mes
                max_str = partes[8] if len(partes) > 8 else ""
                if max_str.strip().isdigit():
                    max_turnos_sab[nombre] = int(max_str.strip())

                if not activo:
                    continue  # Saltar diáconos inactivos

                todos.append(nombre)
                if sabado:
                    abre_sabado.append(nombre)
                if miercoles:
                    abre_miercoles.append(nombre)

                if grupo:
                    diacono_grupo[nombre] = grupo
                    if grupo not in grupos:
                        grupos[grupo] = []
                    grupos[grupo].append(nombre)

                if fechas_excepcion:
                    excepciones[nombre] = fechas_excepcion

                if fechas_preferencia:
                    preferencias[nombre] = fechas_preferencia

    return {
        "todos": todos,
        "abre_sabado": abre_sabado,
        "abre_miercoles": abre_miercoles,
        "grupos": grupos,
        "diacono_grupo": diacono_grupo,
        "excepciones": excepciones,
        "preferencias": preferencias,
        "max_turnos_sab": max_turnos_sab,
    }


def obtener_fechas_mes(mes: int, año: int) -> list:
    """Genera todas las fechas de sábados y miércoles del mes."""
    fechas = []
    _, num_dias = calendar.monthrange(año, mes)

    for dia in range(1, num_dias + 1):
        fecha = date(año, mes, dia)
        dia_semana = fecha.weekday()
        if dia_semana == 2 or dia_semana == 5:
            fechas.append((fecha, dia_semana))

    return fechas


def obtener_familiares(nombre: str, grupos: dict, diacono_grupo: dict) -> list:
    """Retorna la lista de familiares de un diácono (excluyéndolo a él)."""
    if nombre not in diacono_grupo:
        return []
    grupo = diacono_grupo[nombre]
    return [f for f in grupos[grupo] if f != nombre]


def asignar_turnos(fechas: list, diaconos: dict, mes: int, año: int) -> tuple:
    """Asigna los diáconos de forma equitativa en cuatro fases:
    1. Abridores de Sábados
    2. Familiares de abridores de Sábado
    3. Abridores de Miércoles (prioridad: los que NO abren sábado)
    4. Completar Sábados con resto de diáconos (balanceo equitativo)
    """
    random.seed(año * 100 + mes)
    rng = random.Random(año * 100 + mes)

    # Inicializar estructuras
    conteo = {d: 0 for d in diaconos["todos"]}
    conteo_sabados = {d: 0 for d in diaconos["todos"]}
    pool_pendientes = set(diaconos["todos"])

    # Preparar turnos vacíos
    turnos_dict = {}
    for fecha, dia_semana in fechas:
        turnos_dict[fecha] = {
            "fecha": fecha,
            "dia_semana": dia_semana,
            "abre": None,
            "adicionales": [],
        }

    abre_sabado = diaconos["abre_sabado"].copy()
    abre_miercoles = diaconos["abre_miercoles"].copy()
    rng.shuffle(abre_sabado)
    rng.shuffle(abre_miercoles)

    grupos = diaconos["grupos"]
    diacono_grupo = diaconos["diacono_grupo"]
    excepciones = diaconos["excepciones"]
    preferencias = diaconos["preferencias"]
    max_turnos_sab = diaconos["max_turnos_sab"]

    def puede_asignar_sabado(nombre):
        if nombre in max_turnos_sab:
            max_val = max_turnos_sab[nombre]
            # 0 o None = sin límite
            if max_val is None or max_val == 0:
                return True
            return conteo_sabados[nombre] < max_val
        return True

    fechas_sabado = [f for f, d in fechas if d == 5]
    fechas_miercoles = [f for f, d in fechas if d == 2]

    # Set de abridores de sábado para verificación rápida
    set_abre_sabado = set(abre_sabado)

    # --- FASE 1: Abridores de Sábados ---
    idx_sabado = 0
    for fecha in fechas_sabado:
        quien_abre = None
        intentos = 0
        while intentos < len(abre_sabado):
            candidato = abre_sabado[(idx_sabado + intentos) % len(abre_sabado)]
            if not tiene_excepcion(
                candidato, fecha, excepciones, grupos, diacono_grupo
            ) and puede_asignar_sabado(candidato):
                quien_abre = candidato
                idx_sabado += intentos + 1
                break
            intentos += 1

        if quien_abre is None:
            quien_abre = abre_sabado[idx_sabado % len(abre_sabado)]
            idx_sabado += 1

        turnos_dict[fecha]["abre"] = quien_abre
        conteo[quien_abre] += 1
        conteo_sabados[quien_abre] += 1
        pool_pendientes.discard(quien_abre)

    # --- FASE 2: Familiares de Abridores de Sábado ---
    for fecha in fechas_sabado:
        t = turnos_dict[fecha]
        abridor = t["abre"]
        asignados_dia = [abridor]

        for familiar in obtener_familiares(abridor, grupos, diacono_grupo):
            # NUEVO: Verificar que no sea abridor de sábado (para no tener 2 abridores)
            if (
                familiar not in asignados_dia
                and familiar not in set_abre_sabado
                and puede_asignar_sabado(familiar)
                and not tiene_excepcion(
                    familiar, fecha, excepciones, grupos, diacono_grupo
                )
            ):
                asignados_dia.append(familiar)
                conteo[familiar] += 1
                conteo_sabados[familiar] += 1
                pool_pendientes.discard(familiar)

        t["adicionales"] = asignados_dia[1:]

    # --- FASE 3: Abridores de Miércoles ---
    # Priorizar los que NO abren sábado
    candidatos_miercoles_prioritarios = [
        d for d in abre_miercoles if d not in set_abre_sabado
    ]
    candidatos_miercoles_fallback = [
        d for d in abre_miercoles if d in set_abre_sabado
    ]
    rng.shuffle(candidatos_miercoles_prioritarios)
    rng.shuffle(candidatos_miercoles_fallback)

    # Combinar: prioritarios primero, fallback después
    candidatos_miercoles_ordenados = (
        candidatos_miercoles_prioritarios + candidatos_miercoles_fallback
    )

    idx_miercoles = 0
    for fecha in fechas_miercoles:
        quien_abre = None
        intentos = 0
        while intentos < len(candidatos_miercoles_ordenados):
            candidato = candidatos_miercoles_ordenados[
                (idx_miercoles + intentos) % len(candidatos_miercoles_ordenados)
            ]
            if not tiene_excepcion(
                candidato, fecha, excepciones, grupos, diacono_grupo
            ):
                quien_abre = candidato
                idx_miercoles += intentos + 1
                break
            intentos += 1

        if quien_abre is None:
            quien_abre = candidatos_miercoles_ordenados[
                idx_miercoles % len(candidatos_miercoles_ordenados)
            ]
            idx_miercoles += 1

        turnos_dict[fecha]["abre"] = quien_abre
        conteo[quien_abre] += 1
        pool_pendientes.discard(quien_abre)

    # --- FASE 4: Completar Sábados (con balanceo equitativo) ---
    # Primero, procesar preferencias
    for fecha in fechas_sabado:
        t = turnos_dict[fecha]
        asignados_dia = [t["abre"]] + t["adicionales"]

        for nombre, fechas_pref in preferencias.items():
            if fecha in fechas_pref and nombre not in asignados_dia:
                # Verificar que no sea abridor de sábado (restricción de separar abridores)
                if nombre in set_abre_sabado:
                    continue
                if not puede_asignar_sabado(nombre):
                    continue
                if tiene_excepcion(nombre, fecha, excepciones, grupos, diacono_grupo):
                    continue

                asignados_dia.append(nombre)
                conteo[nombre] += 1
                conteo_sabados[nombre] += 1
                pool_pendientes.discard(nombre)

                # Familiares del de la preferencia (que no sean abridores)
                for familiar in obtener_familiares(nombre, grupos, diacono_grupo):
                    if (
                        familiar not in asignados_dia
                        and familiar not in set_abre_sabado
                        and puede_asignar_sabado(familiar)
                        and not tiene_excepcion(
                            familiar, fecha, excepciones, grupos, diacono_grupo
                        )
                    ):
                        asignados_dia.append(familiar)
                        conteo[familiar] += 1
                        conteo_sabados[familiar] += 1
                        pool_pendientes.discard(familiar)

        t["adicionales"] = asignados_dia[1:]

    # Calcular distribución equitativa
    num_sabados = len(fechas_sabado)
    # Candidatos válidos para sábados: todos los que NO son abridores de sábado
    candidatos_validos = [
        d for d in diaconos["todos"] if d not in set_abre_sabado
    ]

    # Contar cuántas asignaciones adicionales tenemos actualmente
    total_adicionales_actual = sum(
        len(turnos_dict[f]["adicionales"]) for f in fechas_sabado
    )

    # Calcular cuántas personas adicionales podemos asignar
    # (los que aún no tienen turno o tienen menos turnos)
    candidatos_restantes = [
        d
        for d in candidatos_validos
        if d not in set_abre_sabado and puede_asignar_sabado(d)
    ]

    # Calcular personas objetivo por sábado para distribución equitativa
    # Total de personas disponibles / número de sábados
    personas_ya_asignadas = sum(
        1 + len(turnos_dict[f]["adicionales"]) for f in fechas_sabado
    )

    # Distribuir equitativamente: asignar al sábado con menos personas
    # Prioridad: diáconos sin turno primero
    diaconos_sin_turno = [d for d in candidatos_validos if conteo[d] == 0]
    diaconos_con_turno = [
        d
        for d in candidatos_validos
        if conteo[d] > 0 and d not in set_abre_sabado
    ]
    rng.shuffle(diaconos_sin_turno)
    rng.shuffle(diaconos_con_turno)

    # Asignar primero los que no tienen turno
    for candidato in diaconos_sin_turno:
        if not puede_asignar_sabado(candidato):
            continue

        # Encontrar el sábado con menos personas donde pueda ser asignado
        sabados_disponibles = [
            f
            for f in fechas_sabado
            if not tiene_excepcion(
                candidato, f, excepciones, grupos, diacono_grupo
            )
            and candidato not in turnos_dict[f]["adicionales"]
            and candidato != turnos_dict[f]["abre"]
        ]

        if sabados_disponibles:
            sabado_menor = min(
                sabados_disponibles,
                key=lambda f: len(turnos_dict[f]["adicionales"]),
            )
            turnos_dict[sabado_menor]["adicionales"].append(candidato)
            conteo[candidato] += 1
            conteo_sabados[candidato] += 1
            pool_pendientes.discard(candidato)

            # Incluir familiares (que no sean abridores)
            for familiar in obtener_familiares(candidato, grupos, diacono_grupo):
                if (
                    familiar not in turnos_dict[sabado_menor]["adicionales"]
                    and familiar != turnos_dict[sabado_menor]["abre"]
                    and familiar not in set_abre_sabado
                    and puede_asignar_sabado(familiar)
                    and not tiene_excepcion(
                        familiar, sabado_menor, excepciones, grupos, diacono_grupo
                    )
                ):
                    turnos_dict[sabado_menor]["adicionales"].append(familiar)
                    conteo[familiar] += 1
                    conteo_sabados[familiar] += 1
                    pool_pendientes.discard(familiar)

    # Luego distribuir el resto para balancear
    for candidato in diaconos_con_turno:
        if not puede_asignar_sabado(candidato):
            continue

        # Encontrar el sábado con menos personas
        sabados_disponibles = [
            f
            for f in fechas_sabado
            if not tiene_excepcion(
                candidato, f, excepciones, grupos, diacono_grupo
            )
            and candidato not in turnos_dict[f]["adicionales"]
            and candidato != turnos_dict[f]["abre"]
        ]

        if sabados_disponibles:
            # Calcular el promedio actual de personas por sábado
            personas_por_sabado = [
                1 + len(turnos_dict[f]["adicionales"]) for f in fechas_sabado
            ]
            min_personas = min(personas_por_sabado)
            max_personas = max(personas_por_sabado)

            # Solo asignar si ayuda a balancear (diferencia > 1)
            if max_personas - min_personas > 1:
                sabado_menor = min(
                    sabados_disponibles,
                    key=lambda f: len(turnos_dict[f]["adicionales"]),
                )
                if (
                    1 + len(turnos_dict[sabado_menor]["adicionales"])
                    < max_personas
                ):
                    turnos_dict[sabado_menor]["adicionales"].append(candidato)
                    conteo[candidato] += 1
                    conteo_sabados[candidato] += 1
                    pool_pendientes.discard(candidato)

    # --- Verificación final (Faltantes) ---
    faltantes = [d for d, c in conteo.items() if c == 0]
    if faltantes:
        turnos_sabado = [turnos_dict[f] for f in fechas_sabado]
        for f in faltantes:
            disponibles = [
                t
                for t in turnos_sabado
                if not tiene_excepcion(
                    f, t["fecha"], excepciones, grupos, diacono_grupo
                )
                and puede_asignar_sabado(f)
            ]
            if disponibles:
                t_menor = min(disponibles, key=lambda x: len(x["adicionales"]))
                if f not in t_menor["adicionales"] and f != t_menor["abre"]:
                    t_menor["adicionales"].append(f)
                    conteo[f] += 1
                    conteo_sabados[f] += 1
                    for familiar in obtener_familiares(f, grupos, diacono_grupo):
                        if (
                            familiar not in t_menor["adicionales"]
                            and familiar != t_menor["abre"]
                            and puede_asignar_sabado(familiar)
                        ):
                            t_menor["adicionales"].append(familiar)
                            conteo[familiar] += 1
                            conteo_sabados[familiar] += 1

    return list(turnos_dict.values()), conteo


def generar_markdown(turnos: list, conteo: dict, mes: int, año: int) -> str:
    """Genera el contenido del archivo Markdown con resumen de participación."""
    nombre_mes = MESES[mes].capitalize()
    lineas = [f"# Turnos {nombre_mes} {año}\n"]

    for turno in turnos:
        fecha = turno["fecha"]
        dia_semana = DIAS_SEMANA[turno["dia_semana"]]
        fecha_str = f"{dia_semana} {fecha.day} de {MESES[mes]} de {año}"

        lineas.append(f"\n## {fecha_str.capitalize()}\n")
        lineas.append(f"- **Abre**: {turno['abre']}")

        for adicional in turno["adicionales"]:
            lineas.append(f"- {adicional}")

        lineas.append("")

    # Agregar resumen de participación
    lineas.append("\n---\n")
    lineas.append("## Resumen de Participación\n")
    lineas.append("| Diácono | Turnos |")
    lineas.append("|---------|--------|")

    for diacono, turnos_count in sorted(conteo.items(), key=lambda x: (-x[1], x[0])):
        lineas.append(f"| {diacono} | {turnos_count} |")

    lineas.append("")

    return "\n".join(lineas)


def main(mes: int, año: int) -> None:
    """Función principal que orquesta la generación de turnos."""
    diaconos = leer_diaconos(DIACONOS_FILE)
    print(f"Diáconos cargados: {len(diaconos['todos'])} total")
    print(f"  - Pueden abrir sábado: {len(diaconos['abre_sabado'])}")
    print(f"  - Pueden abrir miércoles: {len(diaconos['abre_miercoles'])}")
    print(f"  - Grupos familiares: {len(diaconos['grupos'])}")

    fechas = obtener_fechas_mes(mes, año)
    print(f"Fechas a asignar: {len(fechas)} días")

    turnos, conteo = asignar_turnos(fechas, diaconos, mes, año)

    # Mostrar resumen en consola
    sin_turno = [d for d, c in conteo.items() if c == 0]
    if sin_turno:
        print(f"\n⚠️  Diáconos sin turno: {', '.join(sin_turno)}")
    else:
        print(f"\n✓ Todos los diáconos tienen al menos 1 turno")

    contenido = generar_markdown(turnos, conteo, mes, año)

    nombre_archivo = f"{MESES[mes]}_{año}.md"
    archivo_salida = SCRIPT_DIR / nombre_archivo
    with open(archivo_salida, "w", encoding="utf-8") as f:
        f.write(contenido)

    print(f"Turnos generados en: {archivo_salida}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python generar_turnos.py <mes> <año>")
        print("Ejemplo: python generar_turnos.py 12 2025")
        sys.exit(1)

    try:
        mes = int(sys.argv[1])
        año = int(sys.argv[2])

        if not 1 <= mes <= 12:
            raise ValueError("El mes debe estar entre 1 y 12")

        main(mes, año)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
