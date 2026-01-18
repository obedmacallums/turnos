import { FileText } from 'lucide-react';
import { Button } from '../ui/button';
import type { GeneratedSchedule } from '../../types';
import { descargarPdfTurnos } from '../../lib/pdf/generator';

interface ExportPdfButtonProps {
  schedule: GeneratedSchedule;
}

export function ExportPdfButton({ schedule }: ExportPdfButtonProps) {
  const handleExportPdf = () => {
    console.log('Botón PDF clickeado');
    descargarPdfTurnos(schedule);
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
