import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

interface SidebarDeaconItemProps {
  nombre: string;
  assignedCount: number;
}

export function SidebarDeaconItem({ nombre, assignedCount }: SidebarDeaconItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${nombre}`,
    data: { type: 'sidebar-deacon', nombre },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-grab active:cursor-grabbing transition-all hover:bg-accent ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1 truncate">{nombre}</span>
      {assignedCount > 0 && (
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary min-w-[20px]">
          {assignedCount}
        </span>
      )}
    </div>
  );
}
