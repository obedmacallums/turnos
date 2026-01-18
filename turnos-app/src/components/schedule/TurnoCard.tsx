import type { Turno } from '../../types';
import { MESES, DIAS_SEMANA } from '../../types';
import { parseISODate } from '../../lib/scheduling/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface TurnoCardProps {
  turno: Turno;
  mes: number;
  año: number;
}

export function TurnoCard({ turno, mes, año }: TurnoCardProps) {
  const fecha = parseISODate(turno.fecha);
  const diaSemana = DIAS_SEMANA[turno.diaSemana];
  const dia = fecha.getDate();
  const nombreMes = MESES[mes];

  const fechaCompleta = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${dia} de ${nombreMes} de ${año}`;

  const esSabado = turno.diaSemana === 5;

  return (
    <Card className={esSabado ? 'border-l-4 border-l-primary' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fechaCompleta}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start">
          <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground mr-2">
            Abre
          </span>
          <span className="font-medium">{turno.abre}</span>
        </div>

        {turno.adicionales.length > 0 && (
          <div className="pl-0">
            <ul className="space-y-1">
              {turno.adicionales.map((nombre) => (
                <li key={nombre} className="text-sm text-muted-foreground flex items-center">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 mr-2"></span>
                  {nombre}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 text-xs text-muted-foreground">
          Total: {turno.adicionales.length + 1} diácono{turno.adicionales.length + 1 > 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
