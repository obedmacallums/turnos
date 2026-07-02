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
