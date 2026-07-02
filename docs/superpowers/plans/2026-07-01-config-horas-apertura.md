# Configuración de horas de apertura — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer configurables desde la UI las horas de apertura y los textos del PDF exportado (hoy hardcodeados en `pdf/generator.ts`), con persistencia en localStorage.

**Architecture:** Nuevo store Zustand con `persist` (patrón existente en `diaconosStore`/`scheduleStore`) que guarda 9 campos de texto con defaults iguales a los valores actuales. El generador de PDF lee la config con `useConfigStore.getState()`. Nueva pestaña "Configuración" con formulario (estado local + Guardar + Restaurar defaults).

**Tech Stack:** React + TypeScript, Zustand persist, componentes ui existentes (Card, Input, Label, Button), jsPDF.

## Global Constraints

- Los defaults deben ser EXACTAMENTE los valores actuales: `8:10 AM`, `7:40 PM`, `6:10 PM`, `Turnos de Diáconos`, `FECHA`, `Apertura y cierre del Templo`, `Diezmos, Ofrendas y Apoyo en instalaciones del Templo`, `Culto Joven`, `Abrir y cerrar templo - Recoger ofrendas`.
- Si una hora queda vacía, el PDF omite el paréntesis `(hora)`.
- No se toca el algoritmo, el CLI Python ni los exports markdown/YAML.
- Textos de UI en español. Verificación: `npm run build` y `npm run lint` sin errores nuevos (existe 1 warning preexistente en `InteractiveView.tsx`).

---

### Task 1: configStore

**Files:**
- Create: `turnos-app/src/store/configStore.ts`

**Interfaces:**
- Produces: `ExportConfig` (interface), `DEFAULT_CONFIG: ExportConfig`, `useConfigStore` con `{ config: ExportConfig; setConfig: (partial: Partial<ExportConfig>) => void; resetConfig: () => void }`.

- [ ] **Step 1: Crear el store**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExportConfig {
  horaAperturaSabado: string;
  horaAperturaMiercoles: string;
  horaCultoJoven: string;
  tituloDocumento: string;
  colFecha: string;
  colApertura: string;
  colDiezmos: string;
  colCultoJoven: string;
  textoTareaSabado: string;
}

export const DEFAULT_CONFIG: ExportConfig = {
  horaAperturaSabado: '8:10 AM',
  horaAperturaMiercoles: '7:40 PM',
  horaCultoJoven: '6:10 PM',
  tituloDocumento: 'Turnos de Diáconos',
  colFecha: 'FECHA',
  colApertura: 'Apertura y cierre del Templo',
  colDiezmos: 'Diezmos, Ofrendas y Apoyo en instalaciones del Templo',
  colCultoJoven: 'Culto Joven',
  textoTareaSabado: 'Abrir y cerrar templo - Recoger ofrendas',
};

interface ConfigState {
  config: ExportConfig;
  setConfig: (partial: Partial<ExportConfig>) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setConfig: (partial) =>
        set((state) => ({ config: { ...state.config, ...partial } })),
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: 'config-storage',
      // Merge profundo del config: si en el futuro se agregan campos nuevos,
      // los valores guardados viejos no los pisan
      merge: (persisted, current) => {
        const p = persisted as Partial<ConfigState> | undefined;
        return {
          ...current,
          config: { ...current.config, ...(p?.config ?? {}) },
        };
      },
    }
  )
);
```

- [ ] **Step 2: Smoke test con tsx**

Ejecutar desde `turnos-app/`:

```bash
npx tsx -e "
import { useConfigStore, DEFAULT_CONFIG } from './src/store/configStore';
const s = useConfigStore.getState();
console.assert(s.config.horaAperturaSabado === '8:10 AM', 'default sabado');
s.setConfig({ horaAperturaSabado: '9:00 AM' });
console.assert(useConfigStore.getState().config.horaAperturaSabado === '9:00 AM', 'set');
useConfigStore.getState().resetConfig();
console.assert(useConfigStore.getState().config.horaAperturaSabado === DEFAULT_CONFIG.horaAperturaSabado, 'reset');
console.log('configStore OK');
"
```

Expected: `configStore OK` (sin asserts fallidos).

- [ ] **Step 3: Commit**

```bash
git add turnos-app/src/store/configStore.ts
git commit -m "feat(config): add configStore with export settings and defaults"
```

### Task 2: pdf/generator.ts consume la config

**Files:**
- Modify: `turnos-app/src/lib/pdf/generator.ts` (funciones `generarDocumentoPdf` y `generarDocumentoPdfAjustado`)

**Interfaces:**
- Consumes: `useConfigStore.getState().config` y `ExportConfig` de Task 1.
- Produces: sin cambios de API pública (`descargarPdfTurnos`, `descargarImagenTurnos` mantienen firmas).

- [ ] **Step 1: Agregar import y helper**

Tras los imports existentes:

```typescript
import { useConfigStore } from '../../store/configStore';

/** Agrega la hora entre paréntesis solo si no está vacía */
function conHora(texto: string, hora: string, separador: string = ' '): string {
  return hora.trim() ? `${texto}${separador}(${hora.trim()})` : texto;
}
```

- [ ] **Step 2: Reemplazar strings hardcodeados en `generarDocumentoPdf`**

Al inicio de la función: `const config = useConfigStore.getState().config;`

- Título: `` const titulo = `${config.tituloDocumento} - ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${schedule.año}`; ``
- Celda sábado: `` conHora(turno.abre, config.horaAperturaSabado, '\n') `` en lugar de `` `${turno.abre}\n(8:10 AM)` ``
- Celda miércoles: `` conHora(turno.abre, config.horaAperturaMiercoles) `` en lugar de `` `${turno.abre} (7:40 PM)` ``
- Celda tarea sábado: `` `${config.textoTareaSabado}\n\n${turno.abre}` ``
- Head: `` [config.colFecha, config.colApertura, config.colDiezmos, conHora(config.colCultoJoven, config.horaCultoJoven)] ``

- [ ] **Step 3: Aplicar los mismos reemplazos en `generarDocumentoPdfAjustado`**

Misma sustitución (la función duplica la construcción de datos).

- [ ] **Step 4: Verificar build**

Run: `npm run build` en `turnos-app/`. Expected: `✓ built` sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add turnos-app/src/lib/pdf/generator.ts
git commit -m "feat(pdf): read export texts and hours from configStore"
```

### Task 3: pestaña Configuración

**Files:**
- Create: `turnos-app/src/components/config/ConfigView.tsx`
- Modify: `turnos-app/src/App.tsx` (agregar cuarta pestaña)

**Interfaces:**
- Consumes: `useConfigStore`, `DEFAULT_CONFIG`, `ExportConfig` de Task 1; componentes ui existentes.

- [ ] **Step 1: Crear ConfigView**

Formulario con estado local inicializado desde el store; Guardar aplica `setConfig`; Restaurar llama `resetConfig` y refresca el estado local. Dos Cards: Horarios (3 campos) y Textos del PDF (5 campos). Campo de título con nota "Se agrega \"- Mes Año\" automáticamente". Feedback simple al guardar (texto "Guardado ✓" temporal).

```tsx
import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useConfigStore, DEFAULT_CONFIG, type ExportConfig } from '../../store/configStore';

const CAMPOS_HORARIOS: Array<{ key: keyof ExportConfig; label: string }> = [
  { key: 'horaAperturaSabado', label: 'Hora de apertura - Sábado' },
  { key: 'horaAperturaMiercoles', label: 'Hora de apertura - Miércoles' },
  { key: 'horaCultoJoven', label: 'Hora - Culto Joven' },
];

const CAMPOS_TEXTOS: Array<{ key: keyof ExportConfig; label: string; nota?: string }> = [
  { key: 'tituloDocumento', label: 'Título del documento', nota: 'Se agrega "- Mes Año" automáticamente' },
  { key: 'colFecha', label: 'Columna: Fecha' },
  { key: 'colApertura', label: 'Columna: Apertura y cierre' },
  { key: 'colDiezmos', label: 'Columna: Diezmos y ofrendas' },
  { key: 'colCultoJoven', label: 'Columna: Culto Joven', nota: 'La hora se agrega automáticamente entre paréntesis' },
  { key: 'textoTareaSabado', label: 'Texto de tarea del sábado' },
];

export function ConfigView() {
  const config = useConfigStore((s) => s.config);
  const setConfig = useConfigStore((s) => s.setConfig);
  const resetConfig = useConfigStore((s) => s.resetConfig);

  const [form, setForm] = useState<ExportConfig>({ ...config });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof ExportConfig, value: string) => {
    setForm({ ...form, [key]: value });
    setSaved(false);
  };

  const handleSave = () => {
    setConfig(form);
    setSaved(true);
  };

  const handleReset = () => {
    resetConfig();
    setForm({ ...DEFAULT_CONFIG });
    setSaved(false);
  };

  const renderCampo = (campo: { key: keyof ExportConfig; label: string; nota?: string }) => (
    <div key={campo.key} className="space-y-2">
      <Label htmlFor={campo.key}>{campo.label}</Label>
      <Input
        id={campo.key}
        value={form[campo.key]}
        onChange={(e) => handleChange(campo.key, e.target.value)}
      />
      {campo.nota && <p className="text-xs text-muted-foreground">{campo.nota}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Configuración</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Guardado ✓</span>}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar valores por defecto
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios</CardTitle>
          <CardDescription>
            Horas que aparecen en el PDF exportado. Deja un campo vacío para no mostrar la hora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CAMPOS_HORARIOS.map(renderCampo)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Textos del PDF</CardTitle>
          <CardDescription>
            Título y encabezados de columna del calendario exportado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CAMPOS_TEXTOS.map(renderCampo)}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Agregar pestaña en App.tsx**

- Import: `import { ConfigView } from './components/config/ConfigView';`
- `TabsList`: cambiar `grid-cols-3` por `grid-cols-4` y agregar `<TabsTrigger value="configuracion">Configuración</TabsTrigger>`
- Agregar `<TabsContent value="configuracion" className="space-y-6"><ConfigView /></TabsContent>`

- [ ] **Step 3: Verificar build y lint**

Run: `npm run build && npm run lint` en `turnos-app/`.
Expected: build OK; lint solo con el warning preexistente de `InteractiveView.tsx`.

- [ ] **Step 4: Commit**

```bash
git add turnos-app/src/components/config/ConfigView.tsx turnos-app/src/App.tsx
git commit -m "feat(config): add Configuración tab with export settings form"
```

### Task 4: Verificación end-to-end

**Files:** ninguno nuevo (solo verificación).

- [ ] **Step 1: Verificar PDF con defaults idéntico al actual**

Smoke test en node: generar el PDF con la config por defecto y comprobar que el texto extraído contiene `(8:10 AM)`, `(7:40 PM)` y `Culto Joven (6:10 PM)`; luego cambiar la config (`setConfig({ horaAperturaSabado: '9:30 AM', colCultoJoven: 'Reunión Jóvenes' })`) y comprobar que el nuevo PDF contiene `(9:30 AM)` y `Reunión Jóvenes` y ya no `(8:10 AM)`. Si jsPDF/pdfjs no corren en node, verificar en el navegador con la app (`npm run dev`) exportando un PDF antes y después de cambiar la configuración.

- [ ] **Step 2: Verificación en la app (dev server)**

Levantar `npm run dev`, abrir la pestaña Configuración, cambiar una hora, Guardar, exportar PDF desde Generar Turnos y confirmar el cambio; Restaurar valores por defecto y confirmar que vuelve al original.
