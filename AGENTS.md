# AGENTS.md - Developer Guide for Agentic Coding Agents

This repository contains tools for generating diaconos shifts (turnos) for church services, including a Python CLI tool and a React-based Web application.

## 1. Project Structure

- `/generar_turnos.py`: Python CLI script for generating monthly shifts from `diaconos.md`.
- `/diaconos.md`: Source of truth for diaconos availability (Markdown table).
- `/diaconos.yaml`: YAML version of diaconos data used for importing into the Web app.
- `/turnos-app/`: A Vite + React + TypeScript + Tailwind CSS web application.
  - `src/components/`: UI components (using Radix UI/Shadcn patterns).
  - `src/lib/`: Logic for scheduling, YAML parsing, and markdown generation.
  - `src/store/`: State management using Zustand (with persistence).
  - `src/types/`: Shared TypeScript interfaces.

## 2. Build, Lint, and Test Commands

### Web Application (`/turnos-app/`)
- **Install Dependencies**: `npm install`
- **Development Server**: `npm run dev`
- **Build**: `npm run build` (Runs `tsc` and Vite build).
- **Lint**: `npm run lint` (Uses ESLint 9+ with flat config).
- **Test**: Currently, there are no automated tests. If adding tests, use Vitest.

### Python CLI (`/`)
- **Run Generator**: `python generar_turnos.py <mes> <año>`
  - Example: `python generar_turnos.py 1 2026`
  - Output: Creates a file like `enero_2026.md` in the root directory.
- **Dependencies**: Standard library + `random`, `calendar`, `pathlib`.

## 3. Code Style Guidelines

### TypeScript / React
- **Naming Conventions**:
  - Components & Types: `PascalCase`.
  - Variables, Functions, & Properties: `camelCase`.
  - Constants: `UPPER_SNAKE_CASE`.
- **Imports**:
  - Group imports: React/External libraries first, then internal project files.
  - Use `import type` for TypeScript interfaces when possible.
- **Types**:
  - Prefer `interface` over `type` for object definitions.
  - Shared types must be defined in `src/types/index.ts`.
- **State Management**: Use Zustand stores in `src/store/`. Favor `persist` middleware for local storage synchronization.
- **Styling**: Use Tailwind CSS utility classes. Use the `cn()` utility from `src/lib/utils.ts` for conditional classes.
- **Error Handling**: Use try/catch blocks for async operations and provide user feedback via UI (toasts or alerts).

### Python
- **Style**: Adhere to PEP 8.
- **Naming**: `snake_case` for variables and functions.
- **Typing**: Use type hints (e.g., `def func(param: int) -> str:`).
- **Documentation**: Include docstrings for all functions explaining purpose and parameters.

### Data Formats
- **Dates**: Use ISO format `YYYY-MM-DD` for internal storage and YAML. Use `DD/MM/YYYY` only when parsing/writing `diaconos.md` tables.
- **Diaconos MD Table**: The table in `diaconos.md` is the primary human-editable source. Ensure the Python script can correctly parse all columns (Nombre, Abre Sábado, Abre Miércoles, Grupo, Activo, Excepciones, Preferencias, Max).

## 4. Scheduling Logic & Business Rules

The scheduling algorithm (both in Python and TypeScript) follows these primary constraints:

1.  **Participation Equality**: The algorithm attempts to give every active diácono at least one shift per month.
2.  **Wednesday vs. Saturday**:
    -   Wednesdays: Only 1 person is assigned (the one who opens).
    -   Saturdays: 1 person opens, and typically 2-3 "additional" people are assigned.
3.  **Opening Constraints**: Only diáconos marked with `SI` in "Abre Sábado" or "Abre Miércoles" can be assigned the "Abre" role for those days.
4.  **Family Groups**: Diáconos in the same "Grupo" (e.g., family members) should ideally be scheduled on the same day if possible, or their exceptions should apply to the whole group (in Python).
5.  **Excepciones (Exceptions)**: Specific dates where a diácono is unavailable. Format: `DD/MM/YYYY` in MD, `YYYY-MM-DD` in JSON/YAML.
6.  **Preferencias (Preferences)**: Specific dates where a diácono *prefers* to serve.
7.  **Max (Maximum Shifts)**: Cap on the number of times a diácono can be scheduled in a single month.

## 5. Folder & File Descriptions

-   `generar_turnos.py`: Core logic for CLI generation. Uses `random.seed` based on month/year for deterministic (reproducible) results.
-   `turnos-app/src/lib/scheduling/`: Contains the TypeScript port of the scheduling logic.
-   `turnos-app/src/lib/yaml/`: Utilities for parsing `diaconos.yaml` and exporting state.
-   `turnos-app/src/components/ui/`: Low-level UI primitives (buttons, inputs, dialogs) following Radix UI patterns.
-   `turnos-app/src/components/ScheduleView.tsx`: Main component for displaying and managing the generated schedule.

## 6. Operational Context for Agents

-   **Verification**: Always verify `diaconos.md` before generating shifts.
-   **Consistency**: When modifying the scheduling algorithm, ensure consistency between the Python implementation and the TypeScript implementation (`turnos-app/src/lib/scheduling/`).
-   **Design System**: If adding new features to the Web app, maintain the design system (Radix UI + Tailwind).
-   **Deterministic Outputs**: Both generator implementations should remain deterministic for a given input (month, year, and data).

## 7. Troubleshooting & Common Tasks

-   **Adding a Diácono**: Update `diaconos.md` first. Then regenerate `diaconos.yaml` if needed for the web app, or use the Web UI to add them (stored in local storage).
-   **Linting Errors**: Run `npm run lint` in `turnos-app/`. It uses ESLint 9. Fix errors before committing.
-   **Build Failures**: Ensure `tsc` passes by running `npm run build`. TypeScript errors in `src/types/` often cascade.

