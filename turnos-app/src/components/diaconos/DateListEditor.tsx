import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { parseISODate, toISODate, parseDDMMYYYY } from '../../lib/scheduling/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface DateListEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  dates: string[];  // ISO dates
  onSave: (dates: string[]) => void;
}

export function DateListEditor({
  open,
  onOpenChange,
  title,
  description,
  dates,
  onSave,
}: DateListEditorProps) {
  const [localDates, setLocalDates] = useState<string[]>([...dates]);
  const [newDate, setNewDate] = useState('');

  const handleAddDate = () => {
    if (!newDate.trim()) return;

    // Try parsing as YYYY-MM-DD first (HTML date input)
    let date: Date | null = null;
    if (newDate.includes('-')) {
      date = parseISODate(newDate);
    } else if (newDate.includes('/')) {
      // Try parsing as DD/MM/YYYY
      date = parseDDMMYYYY(newDate);
    }

    if (date) {
      const isoDate = toISODate(date);
      if (!localDates.includes(isoDate)) {
        setLocalDates([...localDates, isoDate].sort());
      }
      setNewDate('');
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setLocalDates(localDates.filter((d) => d !== dateToRemove));
  };

  const handleSave = () => {
    onSave(localDates);
    onOpenChange(false);
  };

  const formatDisplayDate = (isoDate: string) => {
    const date = parseISODate(isoDate);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newDate">Agregar Fecha</Label>
            <div className="flex space-x-2">
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDate();
                  }
                }}
              />
              <Button type="button" size="icon" onClick={handleAddDate}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fechas Agregadas ({localDates.length})</Label>
            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
              {localDates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay fechas agregadas
                </p>
              ) : (
                localDates.map((date) => (
                  <div
                    key={date}
                    className="flex items-center justify-between bg-secondary rounded px-2 py-1"
                  >
                    <span className="text-sm">{formatDisplayDate(date)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDate(date)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
