import { useDraggable } from '@dnd-kit/core';
import { X } from 'lucide-react';

interface DraggableDeaconChipProps {
  nombre: string;
  fromFecha: string;
  role: 'abre' | 'adicional';
  onRemove?: () => void;
}

export function DraggableDeaconChip({ nombre, fromFecha, role, onRemove }: DraggableDeaconChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `shift-${fromFecha}-${nombre}`,
    data: { type: 'shift-deacon', nombre, fromFecha, role },
  });

  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium cursor-grab active:cursor-grabbing transition-opacity ${
        role === 'abre'
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      {nombre}
      {role === 'adicional' && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-black/20 p-0.5"
          aria-label={`Quitar ${nombre}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
