import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { parseDiaconosYaml } from '../../lib/yaml/parser';
import { parseDiaconosMarkdown } from '../../lib/markdown/parser';
import { useDiaconosStore } from '../../store/diaconosStore';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const setDiaconos = useDiaconosStore((state) => state.setDiaconos);

  const handleFileRead = (content: string, fileName: string) => {
    try {
      let diaconos;
      if (fileName.endsWith('.md')) {
        diaconos = parseDiaconosMarkdown(content);
      } else {
        diaconos = parseDiaconosYaml(content);
      }
      
      setDiaconos(diaconos);
      setImportStatus(`✓ ${diaconos.length} diáconos importados exitosamente`);
      setTimeout(() => {
        onOpenChange(false);
        setImportStatus('');
      }, 1500);
    } catch (error) {
      console.error('Error al importar:', error);
      setImportStatus('Error al parsear el archivo. Verifica el formato.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleFileRead(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.yaml') || file.name.endsWith('.yml') || file.name.endsWith('.md'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleFileRead(content, file.name);
      };
      reader.readAsText(file);
    } else {
      setImportStatus('Por favor, arrastra un archivo .yaml, .yml o .md');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Diáconos</DialogTitle>
          <DialogDescription>
            Carga un archivo .yaml o .md (tabla markdown) para importar los diáconos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
            `}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arrastra un archivo .yaml o .md aquí o haz clic para seleccionar
            </p>
            <input
              type="file"
              accept=".yaml,.yml,.md"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Seleccionar Archivo
            </Button>
          </div>

          {importStatus && (
            <div
              className={`text-sm text-center p-2 rounded ${
                importStatus.startsWith('✓')
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {importStatus}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Formato esperado:</p>
            <pre className="bg-muted p-2 rounded overflow-x-auto">
{`diaconos:
  - nombre: Juan Pérez
    abreSabado: true
    abreMiercoles: false
    grupo: A
    activo: true
    excepciones: []
    preferencias: []`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
