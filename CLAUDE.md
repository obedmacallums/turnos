# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Church shift scheduler with dual implementations:
- **Python CLI**: `generar_turnos.py` - Reads from `diaconos.md`, outputs `{mes}_{año}.md`
- **React Web App**: `turnos-app/` - Full CRUD UI with localStorage persistence

Both implement **identical algorithms** using deterministic randomness (seed: `año * 100 + mes`).

## Commands

### Web App (turnos-app/)
```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint
```

### Python CLI
```bash
python3 generar_turnos.py <mes> <año>   # e.g., python3 generar_turnos.py 2 2026
```

## Architecture

### 4-Phase Scheduling Algorithm

Both implementations use the same phased approach (`algorithm.ts:128` and `generar_turnos.py:172`):

1. **Phase 1 - Saturday Openers**: Assign qualified deacons to open Saturdays (rotating index)
2. **Phase 2 - Opener Families**: Assign family members of Saturday openers (same `grupo`)
3. **Phase 3 - Wednesday Openers**: Prioritize deacons NOT opening Saturday, fallback to those who do
4. **Phase 4 - Complete Saturdays**: Fill remaining slots with equitable distribution

### Key Constraints

| Field | Purpose |
|-------|---------|
| `excepciones` | Dates deacon is unavailable |
| `preferencias` | Requested service dates |
| `maxTurnosSab` | Max Saturday shifts per month (0 or null = unlimited) |
| `grupo` | Family grouping (assigned together) |
| `abreSabado/abreMiercoles` | Role capabilities |

### Date Handling

JavaScript weekday (0=Sun) must convert to Python weekday (0=Mon):
```typescript
// dateUtils.ts
const pythonWeekday = (jsDay + 6) % 7;  // Wed=2, Sat=5
```

### State Management

Zustand stores with localStorage persistence:
- `diaconosStore.ts` → `diaconos-storage` key
- `scheduleStore.ts` → `schedules-storage` key

### Data Formats

**Markdown table** (used by Python CLI and import):
```markdown
| Nombre | Abre Sábado | Abre Miércoles | Grupo | Activo | Excepciones | Preferencias | Max Sáb |
|--------|-------------|----------------|-------|--------|-------------|--------------|---------|
| Juan   | SI          | NO             | A     | SI     | 01/01/2026  | 15/01/2026   | 2       |
```

**TypeScript interfaces** (`types/index.ts`):
- `Diacono` - Individual deacon with all settings
- `Turno` - Single shift (date, opener, additional people)
- `DiaconosData` - Algorithm input structure

## Key Files

- `generar_turnos.py` - Python reference implementation
- `turnos-app/src/lib/scheduling/algorithm.ts` - TypeScript port of algorithm
- `turnos-app/src/lib/scheduling/dateUtils.ts` - Date conversion utilities
- `turnos-app/src/store/diaconosStore.ts` - Deacon state management
- `turnos-app/src/types/index.ts` - Core TypeScript interfaces

## Cross-Platform Parity

When modifying the scheduling algorithm:
1. Update Python version first (easier to test via CLI)
2. Port identical changes to TypeScript
3. Verify both produce identical results for same month/year
