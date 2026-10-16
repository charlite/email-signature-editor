import { useDroppable } from '@dnd-kit/core';
import { rowInsertDroppableId } from '@/lib/templateFieldDragLayout';
import { cn } from '@/lib/utils';

type RowInsertDropZoneProps = {
  insertIndex: number;
  enabled: boolean;
  className?: string;
};

export function RowInsertDropZone({
  insertIndex,
  enabled,
  className,
}: RowInsertDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: rowInsertDroppableId(insertIndex),
    disabled: !enabled,
  });

  if (!enabled) return null;

  return (
    <div
      className={cn('pointer-events-none', className)}
      aria-hidden
    >
      <div
        ref={setNodeRef}
        className={cn(
          'pointer-events-auto flex w-full min-h-6 items-center justify-center rounded-md px-1 transition-[min-height,background-color,border-color] duration-150',
          isOver &&
            'min-h-11 border border-dashed border-primary/40 bg-primary/10 shadow-sm'
        )}
      >
        <div
          className={cn(
            'h-0.5 w-full max-w-[calc(100%-0.5rem)] rounded-full bg-primary/25 transition-opacity',
            isOver ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
    </div>
  );
}
