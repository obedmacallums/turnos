import { Image } from 'lucide-react';
import { Button } from '../ui/button';
import type { GeneratedSchedule } from '../../types';
import { descargarImagenTurnos } from '../../lib/pdf/generator';

interface ExportImageButtonProps {
  schedule: GeneratedSchedule;
}

export function ExportImageButton({ schedule }: ExportImageButtonProps) {
  const handleExport = async () => {
    await descargarImagenTurnos(schedule);
  };

  return (
    <Button onClick={handleExport} variant="outline" type="button">
      <Image className="h-4 w-4 mr-2" />
      Descargar Imagen
    </Button>
  );
}
