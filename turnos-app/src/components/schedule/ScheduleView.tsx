import { useScheduleStore } from '../../store/scheduleStore';
import { MESES } from '../../types';
import { TurnoCard } from './TurnoCard';
import { ExportButton } from './ExportButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function ScheduleView() {
  const currentSchedule = useScheduleStore((state) => state.currentSchedule);

  if (!currentSchedule) {
    return (
      <div className="border border-dashed rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          No hay turnos generados. Usa el formulario de arriba para generar un nuevo
          calendario.
        </p>
      </div>
    );
  }

  const { mes, año, turnos, conteo } = currentSchedule;
  const nombreMes = MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1);

  const turnosSabado = turnos.filter((t) => t.diaSemana === 5);
  const turnosMiercoles = turnos.filter((t) => t.diaSemana === 2);

  const conteoPorTurnos = Object.entries(conteo).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Turnos {nombreMes} {año}
        </h2>
        <ExportButton schedule={currentSchedule} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Sábados ({turnosSabado.length})</h3>
          {turnosSabado.map((turno) => (
            <TurnoCard key={turno.fecha} turno={turno} mes={mes} año={año} />
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Miércoles ({turnosMiercoles.length})</h3>
          {turnosMiercoles.map((turno) => (
            <TurnoCard key={turno.fecha} turno={turno} mes={mes} año={año} />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Participación</CardTitle>
          <CardDescription>
            Cantidad de turnos asignados a cada diácono en {nombreMes} {año}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diácono</TableHead>
                <TableHead className="text-right">Turnos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conteoPorTurnos.map(([diacono, cantidad]) => (
                <TableRow key={diacono}>
                  <TableCell className="font-medium">{diacono}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                      {cantidad}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
