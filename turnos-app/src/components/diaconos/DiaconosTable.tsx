import { useState } from 'react';
import { Pencil, Trash2, Calendar, Upload, Plus, Download } from 'lucide-react';
import { useDiaconosStore } from '../../store/diaconosStore';
import type { Diacono } from '../../types';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { DiaconoForm } from './DiaconoForm';
import { DateListEditor } from './DateListEditor';
import { ImportDialog } from './ImportDialog';
import { generarYamlDiaconos, descargarYaml } from '../../lib/yaml/generator';

export function DiaconosTable() {
  const diaconos = useDiaconosStore((state) => state.diaconos);
  const addDiacono = useDiaconosStore((state) => state.addDiacono);
  const updateDiacono = useDiaconosStore((state) => state.updateDiacono);
  const deleteDiacono = useDiaconosStore((state) => state.deleteDiacono);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDiacono, setEditingDiacono] = useState<Diacono | null>(null);

  const [dateEditorOpen, setDateEditorOpen] = useState(false);
  const [dateEditorType, setDateEditorType] = useState<'excepciones' | 'preferencias'>(
    'excepciones'
  );
  const [dateEditorDiacono, setDateEditorDiacono] = useState<Diacono | null>(null);

  const [importOpen, setImportOpen] = useState(false);

  const handleEdit = (diacono: Diacono) => {
    setEditingDiacono(diacono);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingDiacono(null);
    setFormOpen(true);
  };

  const handleSave = (diacono: Omit<Diacono, 'id'> | Diacono) => {
    if ('id' in diacono) {
      updateDiacono(diacono.id, diacono);
    } else {
      addDiacono(diacono);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este diácono?')) {
      deleteDiacono(id);
    }
  };

  const handleEditDates = (
    diacono: Diacono,
    type: 'excepciones' | 'preferencias'
  ) => {
    setDateEditorDiacono(diacono);
    setDateEditorType(type);
    setDateEditorOpen(true);
  };

  const handleSaveDates = (dates: string[]) => {
    if (dateEditorDiacono) {
      updateDiacono(dateEditorDiacono.id, {
        [dateEditorType]: dates,
      });
    }
  };

  const handleExportYaml = () => {
    if (diaconos.length === 0) return;
    const yamlContent = generarYamlDiaconos(diaconos);
    descargarYaml(yamlContent, 'diaconos_backup.yaml');
  };

  const activeDiaconos = diaconos.filter((d) => d.activo);
  const inactiveDiaconos = diaconos.filter((d) => !d.activo);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Diáconos</h2>
        <div className="flex gap-2">
          <Button onClick={handleExportYaml} variant="outline" disabled={diaconos.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar YAML
          </Button>
          <Button onClick={() => setImportOpen(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar MD
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Diácono
          </Button>
        </div>
      </div>

      {diaconos.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No hay diáconos registrados. Importa un archivo o agrega uno nuevo.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setImportOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar MD
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Diácono
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Abre Sáb</TableHead>
                  <TableHead className="text-center">Abre Mié</TableHead>
                  <TableHead className="text-center">Grupo</TableHead>
                  <TableHead className="text-center">Excepciones</TableHead>
                  <TableHead className="text-center">Preferencias</TableHead>
                  <TableHead className="text-center">Max Sáb</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDiaconos.map((diacono) => (
                  <TableRow key={diacono.id}>
                    <TableCell className="font-medium">{diacono.nombre}</TableCell>
                    <TableCell className="text-center">
                      {diacono.abreSabado ? '✓' : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {diacono.abreMiercoles ? '✓' : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {diacono.grupo || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDates(diacono, 'excepciones')}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        {diacono.excepciones.length}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDates(diacono, 'preferencias')}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        {diacono.preferencias.length}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      {diacono.maxTurnosSab || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                        Activo
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(diacono)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(diacono.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {inactiveDiaconos.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-8">Diáconos Inactivos</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-center">Abre Sáb</TableHead>
                      <TableHead className="text-center">Abre Mié</TableHead>
                      <TableHead className="text-center">Grupo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveDiaconos.map((diacono) => (
                      <TableRow key={diacono.id} className="opacity-60">
                        <TableCell className="font-medium">{diacono.nombre}</TableCell>
                        <TableCell className="text-center">
                          {diacono.abreSabado ? '✓' : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {diacono.abreMiercoles ? '✓' : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {diacono.grupo || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(diacono)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(diacono.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}

      <DiaconoForm
        key={editingDiacono?.id || 'new'}
        open={formOpen}
        onOpenChange={setFormOpen}
        diacono={editingDiacono}
        onSave={handleSave}
      />

      <DateListEditor
        key={`${dateEditorDiacono?.id || 'none'}-${dateEditorType}`}
        open={dateEditorOpen}
        onOpenChange={setDateEditorOpen}
        title={
          dateEditorType === 'excepciones'
            ? `Excepciones - ${dateEditorDiacono?.nombre}`
            : `Preferencias - ${dateEditorDiacono?.nombre}`
        }
        description={
          dateEditorType === 'excepciones'
            ? 'Fechas en las que el diácono no puede servir'
            : 'Fechas en las que el diácono prefiere servir'
        }
        dates={dateEditorDiacono?.[dateEditorType] || []}
        onSave={handleSaveDates}
      />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
