import { Image } from 'lucide-react';
import { Button } from '../ui/button';
import type { GeneratedSchedule } from '../../types';
import { descargarImagenTurnos } from '../../lib/pdf/generator';
import { type ColorScheme, DEFAULT_COLOR_SCHEME } from '../../lib/pdf/colorSchemes';

interface ExportImageButtonProps {
  schedule: GeneratedSchedule;
  colorScheme?: ColorScheme;
}

export function ExportImageButton({ schedule, colorScheme = DEFAULT_COLOR_SCHEME }: ExportImageButtonProps) {
  const handleExport = async () => {
    await descargarImagenTurnos(schedule, colorScheme);
  };

  return (
    <Button onClick={handleExport} variant="outline" type="button">
      <Image className="h-4 w-4 mr-2" />
      Descargar Imagen
    </Button>
  );
}
