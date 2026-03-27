import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useDiaconosStore } from '../../store/diaconosStore';
import { canBeOpener } from '../../lib/scheduling/validation';
import type { Turno } from '../../types';

interface OpenerChangeDialogProps {
  turno: Turno;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (nombre: string) => void;
}

export function OpenerChangeDialog({ turno, open, onOpenChange, onSelect }: OpenerChangeDialogProps) {
  const diaconos = useDiaconosStore((s) => s.diaconos);
  const [search, setSearch] = useState('');

  const eligible = diaconos.filter(
    (d) => d.activo && canBeOpener(d, turno.diaSemana) && d.nombre !== turno.abre
  );

  const filtered = search
    ? eligible.filter((d) => d.nombre.toLowerCase().includes(search.toLowerCase()))
    : eligible;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar quien abre</DialogTitle>
          <DialogDescription>
            Selecciona el diacono que abrira este turno
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Buscar diacono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay diaconos elegibles
            </p>
          ) : (
            filtered.map((d) => {
              const isInShift = turno.adicionales.includes(d.nombre);
              return (
                <Button
                  key={d.id}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    onSelect(d.nombre);
                    onOpenChange(false);
                    setSearch('');
                  }}
                >
                  {d.nombre}
                  {isInShift && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      (ya en este turno)
                    </span>
                  )}
                </Button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
