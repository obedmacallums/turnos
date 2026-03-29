import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Turno } from '../../types';
import { MESES, DIAS_SEMANA } from '../../types';
import { parseISODate } from '../../lib/scheduling/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DraggableDeaconChip } from './DraggableDeaconChip';
import { OpenerChangeDialog } from './OpenerChangeDialog';
import { ArrowRightLeft } from 'lucide-react';

interface DraggableTurnoCardProps {
  turno: Turno;
  mes: number;
  año: number;
  onRemoveDeacon: (fecha: string, nombre: string) => void;
  onChangeOpener: (fecha: string, newOpener: string) => void;
}

export function DraggableTurnoCard({
  turno,
  mes,
  año,
  onRemoveDeacon,
  onChangeOpener,
}: DraggableTurnoCardProps) {
  const [openerDialogOpen, setOpenerDialogOpen] = useState(false);
  const esSabado = turno.diaSemana === 5;

  const { isOver, setNodeRef } = useDroppable({
    id: `turno-${turno.fecha}`,
    data: { type: 'shift-card', fecha: turno.fecha },
    disabled: !esSabado,
  });

  const fecha = parseISODate(turno.fecha);
  const diaSemana = DIAS_SEMANA[turno.diaSemana];
  const dia = fecha.getDate();
  const nombreMes = MESES[mes];
  const fechaCompleta = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${dia} de ${nombreMes} de ${año}`;

  return (
    <>
      <Card
        ref={setNodeRef}
        className={`transition-all ${
          esSabado ? 'border-l-4 border-l-primary' : ''
        } ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{fechaCompleta}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <DraggableDeaconChip
              nombre={turno.abre}
              fromFecha={turno.fecha}
              role="abre"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setOpenerDialogOpen(true)}
            >
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Cambiar
            </Button>
          </div>

          {esSabado && (
            <div className="flex flex-wrap gap-1.5">
              {turno.adicionales.map((nombre) => (
                <DraggableDeaconChip
                  key={nombre}
                  nombre={nombre}
                  fromFecha={turno.fecha}
                  role="adicional"
                  onRemove={() => onRemoveDeacon(turno.fecha, nombre)}
                />
              ))}
              {turno.adicionales.length === 0 && !isOver && (
                <span className="text-xs text-muted-foreground italic">
                  Arrastra diaconos aqui
                </span>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Total: {turno.adicionales.length + 1} diacono{turno.adicionales.length + 1 > 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      <OpenerChangeDialog
        turno={turno}
        open={openerDialogOpen}
        onOpenChange={setOpenerDialogOpen}
        onSelect={(newOpener) => onChangeOpener(turno.fecha, newOpener)}
      />
    </>
  );
}
