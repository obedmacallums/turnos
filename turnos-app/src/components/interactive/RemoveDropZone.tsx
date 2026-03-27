import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

export function RemoveDropZone() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'remove-zone',
    data: { type: 'remove-zone' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm transition-colors ${
        isOver
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-muted-foreground/30 text-muted-foreground'
      }`}
    >
      <Trash2 className="h-4 w-4" />
      <span>Soltar para eliminar</span>
    </div>
  );
}
