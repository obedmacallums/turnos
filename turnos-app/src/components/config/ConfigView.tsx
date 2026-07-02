import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useConfigStore, DEFAULT_CONFIG, type ExportConfig } from '../../store/configStore';

const CAMPOS_HORARIOS: Array<{ key: keyof ExportConfig; label: string }> = [
  { key: 'horaAperturaSabado', label: 'Hora de apertura - Sábado' },
  { key: 'horaAperturaMiercoles', label: 'Hora de apertura - Miércoles' },
  { key: 'horaCultoJoven', label: 'Hora - Culto Joven' },
];

const CAMPOS_TEXTOS: Array<{ key: keyof ExportConfig; label: string; nota?: string }> = [
  { key: 'tituloDocumento', label: 'Título del documento', nota: 'Se agrega "- Mes Año" automáticamente' },
  { key: 'colFecha', label: 'Columna: Fecha' },
  { key: 'colApertura', label: 'Columna: Apertura y cierre' },
  { key: 'colDiezmos', label: 'Columna: Diezmos y ofrendas' },
  { key: 'colCultoJoven', label: 'Columna: Culto Joven', nota: 'La hora se agrega automáticamente entre paréntesis' },
  { key: 'textoTareaSabado', label: 'Texto de tarea del sábado' },
];

export function ConfigView() {
  const config = useConfigStore((s) => s.config);
  const setConfig = useConfigStore((s) => s.setConfig);
  const resetConfig = useConfigStore((s) => s.resetConfig);

  const [form, setForm] = useState<ExportConfig>({ ...config });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof ExportConfig, value: string) => {
    setForm({ ...form, [key]: value });
    setSaved(false);
  };

  const handleSave = () => {
    setConfig(form);
    setSaved(true);
  };

  const handleReset = () => {
    resetConfig();
    setForm({ ...DEFAULT_CONFIG });
    setSaved(false);
  };

  const renderCampo = (campo: { key: keyof ExportConfig; label: string; nota?: string }) => (
    <div key={campo.key} className="space-y-2">
      <Label htmlFor={campo.key}>{campo.label}</Label>
      <Input
        id={campo.key}
        value={form[campo.key]}
        onChange={(e) => handleChange(campo.key, e.target.value)}
      />
      {campo.nota && <p className="text-xs text-muted-foreground">{campo.nota}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Configuración</h2>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">Guardado ✓</span>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar valores por defecto
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios</CardTitle>
          <CardDescription>
            Horas que aparecen en el PDF exportado. Deja un campo vacío para no mostrar la hora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{CAMPOS_HORARIOS.map(renderCampo)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Textos del PDF</CardTitle>
          <CardDescription>
            Título y encabezados de columna del calendario exportado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{CAMPOS_TEXTOS.map(renderCampo)}</CardContent>
      </Card>
    </div>
  );
}
