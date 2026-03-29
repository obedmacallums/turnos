import { useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDiaconosStore } from '../../store/diaconosStore';
import { recalcularConteo } from '../../lib/scheduling/conteo';
import { isDeaconInShift } from '../../lib/scheduling/validation';
import { MESES } from '../../types';
import type { Turno, GeneratedSchedule } from '../../types';
import { ShiftList } from './ShiftList';
import { DeaconSidebar } from './DeaconSidebar';

interface DragData {
  type: 'sidebar-deacon' | 'shift-deacon';
  nombre: string;
  fromFecha?: string;
  role?: 'abre' | 'adicional';
}

export function InteractiveView() {
  const currentSchedule = useScheduleStore((s) => s.currentSchedule);
  const updateSchedule = useScheduleStore((s) => s.updateSchedule);
  const diaconos = useDiaconosStore((s) => s.diaconos);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const applyUpdate = useCallback(
    (newTurnos: Turno[]) => {
      if (!currentSchedule) return;
      const updated: GeneratedSchedule = {
        ...currentSchedule,
        turnos: newTurnos,
        conteo: recalcularConteo(newTurnos),
      };
      updateSchedule(updated);
    },
    [currentSchedule, updateSchedule]
  );

  const handleRemoveDeacon = useCallback(
    (fecha: string, nombre: string) => {
      if (!currentSchedule) return;
      const newTurnos = currentSchedule.turnos.map((t) => {
        if (t.fecha !== fecha) return t;
        return { ...t, adicionales: t.adicionales.filter((n) => n !== nombre) };
      });
      applyUpdate(newTurnos);
    },
    [currentSchedule, applyUpdate]
  );

  const handleChangeOpener = useCallback(
    (fecha: string, newOpener: string) => {
      if (!currentSchedule) return;
      const newTurnos = currentSchedule.turnos.map((t) => {
        if (t.fecha !== fecha) return t;
        const oldOpener = t.abre;
        // Quitar el nuevo opener de adicionales si estaba, y quitar el opener viejo
        const newAdicionales = t.adicionales
          .filter((n) => n !== newOpener && n !== oldOpener);
        return { ...t, abre: newOpener, adicionales: newAdicionales };
      });
      applyUpdate(newTurnos);
    },
    [currentSchedule, applyUpdate]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag(event.active.data.current as DragData);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over || !currentSchedule) return;

      const dragData = active.data.current as DragData;
      const dropData = over.data.current as { type: string; fecha?: string } | undefined;
      if (!dropData) return;

      // Drop on remove zone — quita al diácono de todos los turnos
      if (dropData.type === 'remove-zone') {
        const nombre = dragData.nombre;
        const newTurnos = currentSchedule.turnos.map((t) => ({
          ...t,
          adicionales: t.adicionales.filter((n) => n !== nombre),
        }));
        applyUpdate(newTurnos);
        return;
      }

      // Drop on a shift card
      if (dropData.type === 'shift-card' && dropData.fecha) {
        const targetFecha = dropData.fecha;
        const targetTurno = currentSchedule.turnos.find((t) => t.fecha === targetFecha);
        if (!targetTurno) return;

        // Miércoles solo admite un diácono (el opener)
        if (targetTurno.diaSemana === 2) return;

        // Don't drop on same shift
        if (dragData.type === 'shift-deacon' && dragData.fromFecha === targetFecha) return;

        // Check if already in target shift
        if (isDeaconInShift(targetTurno, dragData.nombre)) return;

        let newTurnos = [...currentSchedule.turnos];

        // If moving from another shift, remove from source
        if (dragData.type === 'shift-deacon' && dragData.fromFecha && dragData.role === 'adicional') {
          newTurnos = newTurnos.map((t) => {
            if (t.fecha !== dragData.fromFecha) return t;
            return { ...t, adicionales: t.adicionales.filter((n) => n !== dragData.nombre) };
          });
        }

        // Add to target shift
        newTurnos = newTurnos.map((t) => {
          if (t.fecha !== targetFecha) return t;
          return { ...t, adicionales: [...t.adicionales, dragData.nombre] };
        });

        applyUpdate(newTurnos);
      }
    },
    [currentSchedule, applyUpdate, handleRemoveDeacon]
  );

  if (!currentSchedule) {
    return (
      <div className="border border-dashed rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          No hay turnos generados. Ve a la pestana "Generar Turnos" para crear un calendario primero.
        </p>
      </div>
    );
  }

  const { mes, año, conteo } = currentSchedule;
  const nombreMes = MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Editar Turnos - {nombreMes} {año}
      </h2>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <ShiftList
              turnos={currentSchedule.turnos}
              mes={mes}
              año={año}
              onRemoveDeacon={handleRemoveDeacon}
              onChangeOpener={handleChangeOpener}
            />
          </div>
          <div className="w-56 shrink-0 sticky top-4 self-start">
            <DeaconSidebar diaconos={diaconos} conteo={conteo} />
          </div>
        </div>

        <DragOverlay>
          {activeDrag ? (
            <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium shadow-lg">
              {activeDrag.nombre}
            </span>
          ) : null}
        </DragOverlay>
      </DndContext>

    </div>
  );
}
