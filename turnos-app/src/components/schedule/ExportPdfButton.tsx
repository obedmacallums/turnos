import { FileText } from 'lucide-react';
import { Button } from '../ui/button';
import type { GeneratedSchedule } from '../../types';
import { descargarPdfTurnos } from '../../lib/pdf/generator';
import { type ColorScheme, DEFAULT_COLOR_SCHEME } from '../../lib/pdf/colorSchemes';

interface ExportPdfButtonProps {
  schedule: GeneratedSchedule;
  colorScheme?: ColorScheme;
}

export function ExportPdfButton({ schedule, colorScheme = DEFAULT_COLOR_SCHEME }: ExportPdfButtonProps) {
  const handleExportPdf = () => {
    console.log('Botón PDF clickeado');
    descargarPdfTurnos(schedule, colorScheme);
  };

  return (
    <Button 
      onClick={handleExportPdf} 
      variant="outline" 
      type="button"
    >
      <FileText className="h-4 w-4 mr-2" />
      Descargar PDF
    </Button>
  );
}
