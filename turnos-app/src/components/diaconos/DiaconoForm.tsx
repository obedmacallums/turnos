import { useState } from 'react';
import type { Diacono } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface DiaconoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diacono?: Diacono | null;
  onSave: (diacono: Omit<Diacono, 'id'> | Diacono) => void;
}

export function DiaconoForm({ open, onOpenChange, diacono, onSave }: DiaconoFormProps) {
  const [formData, setFormData] = useState<Omit<Diacono, 'id'>>({
    nombre: diacono?.nombre || '',
    abreSabado: diacono?.abreSabado || false,
    abreMiercoles: diacono?.abreMiercoles || false,
    grupo: diacono?.grupo || '',
    activo: diacono?.activo ?? true,
    excepciones: diacono?.excepciones || [],
    preferencias: diacono?.preferencias || [],
    maxTurnosSab: diacono?.maxTurnosSab,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (diacono) {
      onSave({ ...formData, id: diacono.id });
    } else {
      onSave(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{diacono ? 'Editar Diácono' : 'Agregar Diácono'}</DialogTitle>
          <DialogDescription>
            {diacono
              ? 'Modifica los datos del diácono'
              : 'Completa los datos del nuevo diácono'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="abreSabado"
                checked={formData.abreSabado}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, abreSabado: checked as boolean })
                }
              />
              <Label htmlFor="abreSabado" className="cursor-pointer">
                Abre Sábado
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="abreMiercoles"
                checked={formData.abreMiercoles}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, abreMiercoles: checked as boolean })
                }
              />
              <Label htmlFor="abreMiercoles" className="cursor-pointer">
                Abre Miércoles
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo Familiar (Opcional)</Label>
            <Input
              id="grupo"
              value={formData.grupo}
              onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
              placeholder="A, B, C, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTurnosSab">Máximo de Turnos Sábados (Opcional)</Label>
            <Input
              id="maxTurnosSab"
              type="number"
              min="1"
              value={formData.maxTurnosSab || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxTurnosSab: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="Sin límite"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, activo: checked as boolean })
              }
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Activo
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
