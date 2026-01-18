# Gestión de Turnos de Diáconos

Aplicación web React para gestionar y generar automáticamente turnos de diáconos para sábados y miércoles.

## Características

- **Gestión de Diáconos**: CRUD completo para administrar la lista de diáconos
- **Importación desde Markdown**: Importa fácilmente diáconos desde archivos `.md`
- **Generación Automática**: Algoritmo que asigna turnos respetando restricciones y preferencias
- **Almacenamiento Local**: Todos los datos se guardan en localStorage del navegador
- **Exportación a Markdown**: Descarga los turnos generados en formato markdown
- **Interfaz Moderna**: UI construida con shadcn/ui y Tailwind CSS

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build

```bash
npm run build
```

El build de producción se generará en la carpeta `dist/`

## Uso

### 1. Gestión de Diáconos

#### Importar desde archivo
1. Ve a la pestaña "Diáconos"
2. Haz clic en "Importar MD"
3. Arrastra o selecciona tu archivo `diaconos.md`

El archivo debe tener este formato:

```markdown
| Nombre | Abre Sábado | Abre Miércoles | Grupo | Activo | Excepciones | Preferencias | Max |
|--------|-------------|----------------|-------|--------|-------------|--------------|-----|
| Juan   | SI          | NO             | A     | SI     | 01/01/2026  | 15/01/2026   | 2   |
```

#### Agregar/Editar manualmente
- Haz clic en "Agregar Diácono" para crear uno nuevo
- Usa el ícono de lápiz para editar diáconos existentes
- Haz clic en el botón de calendario para gestionar excepciones/preferencias

### 2. Generar Turnos

1. Ve a la pestaña "Generar Turnos"
2. Selecciona el mes y año
3. Haz clic en "Generar Turnos"
4. Los turnos aparecerán automáticamente abajo
5. Usa "Exportar Markdown" para descargar el calendario

### 3. Algoritmo de Asignación

El algoritmo considera:

- **Disponibilidad**: Excepciones de fecha para cada diácono
- **Preferencias**: Fechas específicas solicitadas
- **Grupos familiares**: Asigna familiares juntos
- **Equidad**: Garantiza al menos 1 turno para todos los activos
- **Límites**: Respeta el máximo de turnos por mes
- **Roles**: Solo asigna "quien abre" a diáconos habilitados

El algoritmo usa **random determinístico** (seedrandom) con semilla `año * 100 + mes`, garantizando resultados reproducibles.

## Stack Tecnológico

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Zustand** - Estado global con persistencia localStorage
- **Tailwind CSS** + **shadcn/ui** - UI Components
- **Radix UI** - Componentes base accesibles
- **seedrandom** - Random determinístico
- **date-fns** - Utilidades de fechas
- **lucide-react** - Iconos

## Estructura del Proyecto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── diaconos/        # Gestión de diáconos
│   └── schedule/        # Generación y vista de turnos
├── lib/
│   ├── scheduling/      # Algoritmo de asignación
│   └── markdown/        # Parser y generador MD
├── store/               # Zustand stores
├── types/               # Interfaces TypeScript
└── App.tsx              # Componente principal
```

## Compatibilidad con Python

Esta aplicación es un port del script Python `generar_turnos.py`. El algoritmo de asignación produce **exactamente los mismos resultados** que la versión Python para el mismo mes/año gracias al uso de random determinístico.

## Datos Locales

Todos los datos se almacenan en localStorage:
- `diaconos-storage`: Lista de diáconos
- `schedules-storage`: Turnos generados

Para resetear la aplicación, limpia localStorage desde DevTools.

## Licencia

MIT
