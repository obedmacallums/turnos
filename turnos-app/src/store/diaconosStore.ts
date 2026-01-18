import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Diacono } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DiaconosState {
  diaconos: Diacono[];
  addDiacono: (diacono: Omit<Diacono, 'id'>) => void;
  updateDiacono: (id: string, diacono: Partial<Diacono>) => void;
  deleteDiacono: (id: string) => void;
  setDiaconos: (diaconos: Diacono[]) => void;
  getDiaconoById: (id: string) => Diacono | undefined;
}

export const useDiaconosStore = create<DiaconosState>()(
  persist(
    (set, get) => ({
      diaconos: [],

      addDiacono: (diacono) => {
        const newDiacono: Diacono = {
          ...diacono,
          id: uuidv4(),
        };
        set((state) => ({ diaconos: [...state.diaconos, newDiacono] }));
      },

      updateDiacono: (id, updates) => {
        set((state) => ({
          diaconos: state.diaconos.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      deleteDiacono: (id) => {
        set((state) => ({
          diaconos: state.diaconos.filter((d) => d.id !== id),
        }));
      },

      setDiaconos: (diaconos) => {
        set({ diaconos });
      },

      getDiaconoById: (id) => {
        return get().diaconos.find((d) => d.id === id);
      },
    }),
    {
      name: 'diaconos-storage',
    }
  )
);
