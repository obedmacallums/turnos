import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeneratedSchedule } from '../types';

interface ScheduleState {
  schedules: GeneratedSchedule[];
  currentSchedule: GeneratedSchedule | null;
  addSchedule: (schedule: GeneratedSchedule) => void;
  setCurrentSchedule: (schedule: GeneratedSchedule | null) => void;
  getScheduleByMonthYear: (mes: number, año: number) => GeneratedSchedule | undefined;
  deleteSchedule: (id: string) => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],
      currentSchedule: null,

      addSchedule: (schedule) => {
        set((state) => {
          // Reemplazar si ya existe uno para este mes/año
          const filtered = state.schedules.filter(
            (s) => !(s.mes === schedule.mes && s.año === schedule.año)
          );
          return {
            schedules: [...filtered, schedule],
            currentSchedule: schedule,
          };
        });
      },

      setCurrentSchedule: (schedule) => {
        set({ currentSchedule: schedule });
      },

      getScheduleByMonthYear: (mes, año) => {
        return get().schedules.find((s) => s.mes === mes && s.año === año);
      },

      deleteSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
          currentSchedule:
            state.currentSchedule?.id === id ? null : state.currentSchedule,
        }));
      },
    }),
    {
      name: 'schedules-storage',
    }
  )
);
