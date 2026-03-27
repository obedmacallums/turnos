import { useState } from 'react';
import { Input } from '../ui/input';
import { SidebarDeaconItem } from './SidebarDeaconItem';
import { RemoveDropZone } from './RemoveDropZone';
import type { Diacono } from '../../types';

interface DeaconSidebarProps {
  diaconos: Diacono[];
  conteo: Record<string, number>;
}

export function DeaconSidebar({ diaconos, conteo }: DeaconSidebarProps) {
  const [search, setSearch] = useState('');

  const active = diaconos.filter((d) => d.activo);
  const filtered = search
    ? active.filter((d) => d.nombre.toLowerCase().includes(search.toLowerCase()))
    : active;

  const sorted = [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Diaconos</h3>
      <Input
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
        {sorted.map((d) => (
          <SidebarDeaconItem
            key={d.id}
            nombre={d.nombre}
            assignedCount={conteo[d.nombre] || 0}
          />
        ))}
      </div>
      <RemoveDropZone />
    </div>
  );
}
