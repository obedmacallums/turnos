import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import type { GeneratedSchedule } from '../../types';
import { MESES } from '../../types';
import { generarYamlTurnos, descargarYaml } from '../../lib/yaml/generator';

interface ExportButtonProps {
  schedule: GeneratedSchedule;
}

export function ExportButton({ schedule }: ExportButtonProps) {
  const handleExport = () => {
    const contenido = generarYamlTurnos(schedule);
    const nombreMes = MESES[schedule.mes];
    const nombreArchivo = `${nombreMes}_${schedule.año}.yaml`;

    descargarYaml(contenido, nombreArchivo);
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Exportar YAML
    </Button>
  );
}
