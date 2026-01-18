import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useDiaconosStore } from '../../store/diaconosStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { prepararDiaconosData, asignarTurnos } from '../../lib/scheduling/algorithm';
import { MESES } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function ScheduleGenerator() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [mes, setMes] = useState<number>(currentMonth);
  const [año, setAño] = useState<number>(currentYear);
  const [isGenerating, setIsGenerating] = useState(false);

  const diaconos = useDiaconosStore((state) => state.diaconos);
  const addSchedule = useScheduleStore((state) => state.addSchedule);

  const handleGenerate = () => {
    setIsGenerating(true);

    try {
      const diaconosData = prepararDiaconosData(diaconos);

      if (diaconosData.todos.length === 0) {
        alert('No hay diáconos activos para generar turnos');
        setIsGenerating(false);
        return;
      }

      if (diaconosData.abre_sabado.length === 0) {
        alert('No hay diáconos que puedan abrir el sábado');
        setIsGenerating(false);
        return;
      }

      if (diaconosData.abre_miercoles.length === 0) {
        alert('No hay diáconos que puedan abrir el miércoles');
        setIsGenerating(false);
        return;
      }

      const { turnos, conteo } = asignarTurnos(mes, año, diaconosData);

      const schedule = {
        id: uuidv4(),
        mes,
        año,
        turnos,
        conteo,
        generatedAt: new Date().toISOString(),
      };

      addSchedule(schedule);
    } catch (error) {
      console.error('Error generando turnos:', error);
      alert('Hubo un error al generar los turnos');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeDiaconos = diaconos.filter((d) => d.activo);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Turnos</CardTitle>
        <CardDescription>
          Selecciona el mes y año para generar el calendario de turnos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mes">Mes</Label>
            <Select value={mes.toString()} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger id="mes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MESES).map(([num, nombre]) => (
                  <SelectItem key={num} value={num}>
                    {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="año">Año</Label>
            <Select value={año.toString()} onValueChange={(v) => setAño(Number(v))}>
              <SelectTrigger id="año">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - 1 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeDiaconos.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No hay diáconos activos. Agrega diáconos en la pestaña de Diáconos antes de
              generar turnos.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Diáconos activos: {activeDiaconos.length}
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || activeDiaconos.length === 0}
          className="w-full"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generando...' : 'Generar Turnos'}
        </Button>
      </CardContent>
    </Card>
  );
}
