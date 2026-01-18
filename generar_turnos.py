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
    """Asigna los diáconos de forma equitativa, garantizando participación de todos."""
    random.seed(año * 100 + mes)

    turnos = []
    conteo = {d: 0 for d in diaconos["todos"]}
    conteo_sabados = {d: 0 for d in diaconos["todos"]}

    # Pool de pendientes (diáconos que aún no tienen turno este mes)
    pool_pendientes = set(diaconos["todos"])

    # Copiar y mezclar listas
    abre_sabado = diaconos["abre_sabado"].copy()
    abre_miercoles = diaconos["abre_miercoles"].copy()
    random.shuffle(abre_sabado)
    random.shuffle(abre_miercoles)

    grupos = diaconos["grupos"]
    diacono_grupo = diaconos["diacono_grupo"]
    excepciones = diaconos["excepciones"]
    preferencias = diaconos["preferencias"]
    max_turnos_sab = diaconos["max_turnos_sab"]

    def puede_asignar_sabado(nombre):
        """Verifica si el diácono puede recibir más turnos los SÁBADOS."""
        if nombre in max_turnos_sab:
            return conteo_sabados[nombre] < max_turnos_sab[nombre]
        return True

    idx_sabado = 0
    idx_miercoles = 0

    for fecha, dia_semana in fechas:
        if dia_semana == 5:  # Sábado
            # Buscar quien abre que no tenga excepción y no haya alcanzado su máximo de sábados
            quien_abre = None
            intentos = 0
            while intentos < len(abre_sabado):
                candidato_abre = abre_sabado[(idx_sabado + intentos) % len(abre_sabado)]
                if not tiene_excepcion(
                    candidato_abre, fecha, excepciones, grupos, diacono_grupo
                ) and puede_asignar_sabado(candidato_abre):
                    quien_abre = candidato_abre
                    idx_sabado += intentos + 1
                    break
                intentos += 1

            if quien_abre is None:
                # Todos tienen excepción o alcanzaron máximo, usar el primero
                quien_abre = abre_sabado[idx_sabado % len(abre_sabado)]
                idx_sabado += 1

            asignados_dia = [quien_abre]
            conteo[quien_abre] += 1
            conteo_sabados[quien_abre] += 1
            pool_pendientes.discard(quien_abre)

            # Agregar familiar de quien abre (si puede recibir más turnos sábado)
            for familiar in obtener_familiares(quien_abre, grupos, diacono_grupo):
                if familiar not in asignados_dia and puede_asignar_sabado(familiar):
                    asignados_dia.append(familiar)
                    conteo[familiar] += 1
                    conteo_sabados[familiar] += 1
                    pool_pendientes.discard(familiar)

            # Agregar diáconos con preferencia para esta fecha (si pueden sábados)
            for nombre, fechas_pref in preferencias.items():
                if (
                    fecha in fechas_pref
                    and nombre not in asignados_dia
                    and puede_asignar_sabado(nombre)
                ):
                    asignados_dia.append(nombre)
                    conteo[nombre] += 1
                    conteo_sabados[nombre] += 1
                    pool_pendientes.discard(nombre)
                    # Agregar familiares del diácono con preferencia
                    for familiar in obtener_familiares(nombre, grupos, diacono_grupo):
                        if familiar not in asignados_dia and puede_asignar_sabado(
                            familiar
                        ):
                            asignados_dia.append(familiar)
                            conteo[familiar] += 1
                            conteo_sabados[familiar] += 1
                            pool_pendientes.discard(familiar)

            # Seleccionar adicionales priorizando pendientes
            adicionales_necesarios = 3 - (len(asignados_dia) - 1)

            # Crear lista de candidatos priorizando pendientes
            # Excluir a los que pueden abrir sábado (ya tienen turnos garantizados)
            pendientes_lista = [
                d
                for d in pool_pendientes
                if d not in asignados_dia
                and d not in diaconos["abre_sabado"]
                and not tiene_excepcion(d, fecha, excepciones, grupos, diacono_grupo)
                and puede_asignar_sabado(d)
            ]
            random.shuffle(pendientes_lista)

            otros = [
                d
                for d in diaconos["todos"]
                if d not in asignados_dia
                and d not in pool_pendientes
                and d not in diaconos["abre_sabado"]
                and not tiene_excepcion(d, fecha, excepciones, grupos, diacono_grupo)
                and puede_asignar_sabado(d)
            ]
            random.shuffle(otros)

            candidatos = pendientes_lista + otros

            # Fallback: si no hay suficientes, agregar los que abren sábado
            if len(candidatos) < adicionales_necesarios:
                fallback = [
                    d
                    for d in diaconos["abre_sabado"]
                    if d not in asignados_dia
                    and not tiene_excepcion(
                        d, fecha, excepciones, grupos, diacono_grupo
                    )
                    and puede_asignar_sabado(d)
                ]
                random.shuffle(fallback)
                candidatos.extend(fallback)

            adicionales_agregados = 0
            i = 0
            while adicionales_agregados < adicionales_necesarios and i < len(
                candidatos
            ):
                candidato = candidatos[i]
                i += 1

                if candidato in asignados_dia:
                    continue

                asignados_dia.append(candidato)
                conteo[candidato] += 1
                conteo_sabados[candidato] += 1
                pool_pendientes.discard(candidato)
                adicionales_agregados += 1

                # Agregar familiares del candidato (si pueden sábados)
                for familiar in obtener_familiares(candidato, grupos, diacono_grupo):
                    if familiar not in asignados_dia and puede_asignar_sabado(familiar):
                        asignados_dia.append(familiar)
                        conteo[familiar] += 1
                        conteo_sabados[familiar] += 1
                        pool_pendientes.discard(familiar)

            turnos.append(
                {
                    "fecha": fecha,
                    "dia_semana": dia_semana,
                    "abre": quien_abre,
                    "adicionales": asignados_dia[1:],  # Todos menos quien abre
                }
            )

        else:  # Miércoles (No verifica ni incrementa sábados)
            # Buscar quien abre que no tenga excepción
            quien_abre = None
            intentos = 0
            while intentos < len(abre_miercoles):
                candidato_abre = abre_miercoles[
                    (idx_miercoles + intentos) % len(abre_miercoles)
                ]
                if not tiene_excepcion(
                    candidato_abre, fecha, excepciones, grupos, diacono_grupo
                ):
                    quien_abre = candidato_abre
                    idx_miercoles += intentos + 1
                    break
                intentos += 1

            if quien_abre is None:
                quien_abre = abre_miercoles[idx_miercoles % len(abre_miercoles)]
                idx_miercoles += 1

            conteo[quien_abre] += 1
            pool_pendientes.discard(quien_abre)

            turnos.append(
                {
                    "fecha": fecha,
                    "dia_semana": dia_semana,
                    "abre": quien_abre,
                    "adicionales": [],
                }
            )

    # Verificación final: distribuir faltantes (Sábados)
    faltantes = [d for d, c in conteo.items() if c == 0]

    if faltantes:
        turnos_sabado = [t for t in turnos if t["dia_semana"] == 5]

        for faltante in faltantes:
            # Buscar sábado donde no tenga excepción, pueda sabado y con menos personas
            turnos_disponibles = [
                t
                for t in turnos_sabado
                if not tiene_excepcion(
                    faltante, t["fecha"], excepciones, grupos, diacono_grupo
                )
                and puede_asignar_sabado(faltante)
            ]

            if not turnos_disponibles:
                continue  # No hay fecha disponible para este diácono

            turno_menor = min(
                turnos_disponibles, key=lambda t: len(t["adicionales"]) + 1
            )

            if (
                faltante not in turno_menor["adicionales"]
                and faltante != turno_menor["abre"]
            ):
                turno_menor["adicionales"].append(faltante)
                conteo[faltante] += 1
                conteo_sabados[faltante] += 1

                for familiar in obtener_familiares(faltante, grupos, diacono_grupo):
                    if (
                        familiar not in turno_menor["adicionales"]
                        and familiar != turno_menor["abre"]
                        and puede_asignar_sabado(familiar)
                    ):
                        turno_menor["adicionales"].append(familiar)
                        conteo[familiar] += 1
                        conteo_sabados[familiar] += 1

    return turnos, conteo


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
