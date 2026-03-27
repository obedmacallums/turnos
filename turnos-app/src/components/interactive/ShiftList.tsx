import type { Turno } from '../../types';
import { DraggableTurnoCard } from './DraggableTurnoCard';

interface ShiftListProps {
  turnos: Turno[];
  mes: number;
  año: number;
  onRemoveDeacon: (fecha: string, nombre: string) => void;
  onChangeOpener: (fecha: string, newOpener: string) => void;
}

export function ShiftList({ turnos, mes, año, onRemoveDeacon, onChangeOpener }: ShiftListProps) {
  const sabados = [...turnos].filter((t) => t.diaSemana === 5).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const miercoles = [...turnos].filter((t) => t.diaSemana === 2).sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Sábados ({sabados.length})
        </h3>
        {sabados.map((turno) => (
          <DraggableTurnoCard
            key={turno.fecha}
            turno={turno}
            mes={mes}
            año={año}
            onRemoveDeacon={onRemoveDeacon}
            onChangeOpener={onChangeOpener}
          />
        ))}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Miércoles ({miercoles.length})
        </h3>
        {miercoles.map((turno) => (
          <DraggableTurnoCard
            key={turno.fecha}
            turno={turno}
            mes={mes}
            año={año}
            onRemoveDeacon={onRemoveDeacon}
            onChangeOpener={onChangeOpener}
          />
        ))}
      </div>
    </div>
  );
}
