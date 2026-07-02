# Configuración de horas de apertura y textos del PDF

**Fecha:** 2026-07-01
**Estado:** Aprobado

## Problema

Las horas de apertura y los textos del PDF exportado están hardcodeados en
`turnos-app/src/lib/pdf/generator.ts`:

- Apertura sábado: `8:10 AM`
- Apertura miércoles: `7:40 PM`
- Culto Joven: `6:10 PM`
- Título del documento: `Turnos de Diáconos - {Mes} {Año}`
- Encabezados de columnas y texto de tarea del sábado

Cambiar cualquiera de estos valores requiere editar código.

## Solución

Nueva pestaña **Configuración** en la app web donde el usuario edita estos
valores. Se persisten en localStorage y el generador de PDF/imagen los lee
desde ahí.

## Alcance

- Solo afecta a la app React (`turnos-app/`). El algoritmo de asignación, el
  CLI Python y los exports markdown/YAML no usan horas y no cambian.
- El PDF y la imagen JPG comparten generador, por lo que ambos quedan
  configurables con el mismo cambio.

## Diseño

### 1. Store: `src/store/configStore.ts`

Zustand + `persist` (clave `config-storage`), mismo patrón que
`diaconosStore` y `scheduleStore`.

```ts
interface ExportConfig {
  horaAperturaSabado: string;    // '8:10 AM'
  horaAperturaMiercoles: string; // '7:40 PM'
  horaCultoJoven: string;        // '6:10 PM'
  tituloDocumento: string;       // 'Turnos de Diáconos'
  colFecha: string;              // 'FECHA'
  colApertura: string;           // 'Apertura y cierre del Templo'
  colDiezmos: string;            // 'Diezmos, Ofrendas y Apoyo en instalaciones del Templo'
  colCultoJoven: string;         // 'Culto Joven'
  textoTareaSabado: string;      // 'Abrir y cerrar templo - Recoger ofrendas'
}
```

- Los **defaults son los valores actuales** (arriba): sin tocar nada, el PDF
  sale idéntico al de hoy.
- Acciones: `setConfig(partial)` y `resetConfig()`.
- Las horas son texto libre (mantiene el formato `8:10 AM` existente, sin
  validación de formato).

### 2. UI: `src/components/config/ConfigView.tsx`

Cuarta pestaña "Configuración" en `App.tsx` (la grilla de tabs pasa a
`grid-cols-4`). Contenido:

- **Card "Horarios"**: 3 inputs (apertura sábado, apertura miércoles, Culto
  Joven).
- **Card "Textos del PDF"**: título del documento, 4 encabezados de columna,
  texto de tarea del sábado.
- Botón **Guardar** (aplica el estado local del formulario al store) y botón
  **Restaurar valores por defecto** (llama `resetConfig()` y refresca el
  formulario).
- Nota bajo el título del documento: "se agrega '- {Mes} {Año}'
  automáticamente".

### 3. Consumo: `src/lib/pdf/generator.ts`

- Se eliminan los strings hardcodeados.
- Las funciones internas leen la config con `useConfigStore.getState()` (uso
  fuera de React, soportado por Zustand) al momento de generar.
- La cabecera de Culto Joven se construye como
  `` `${colCultoJoven} (${horaCultoJoven})` ``.
- El título se construye como
  `` `${tituloDocumento} - ${Mes} ${Año}` ``.

## Manejo de errores

- Campos vacíos: se permiten (el usuario puede no querer mostrar una hora);
  si una hora queda vacía se omite el paréntesis `(hora)` en el PDF.
- `persist` con `merge` por defecto: si en el futuro se agregan campos
  nuevos, los valores guardados viejos se combinan con los defaults nuevos.

## Verificación

1. `npm run build` y `npm run lint` sin errores nuevos.
2. Sin tocar configuración: exportar PDF → idéntico al actual (defaults).
3. Cambiar una hora y un texto → exportar PDF e imagen → reflejan el cambio.
4. Restaurar valores por defecto → PDF vuelve al formato original.
5. Recargar la página → la configuración persiste.
