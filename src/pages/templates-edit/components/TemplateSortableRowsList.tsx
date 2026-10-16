import { useCallback, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldChip } from '@/pages/templates-edit/components/TemplateSortableFields';
import { TemplateRowBlock, type TemplateRowBlockProps } from '@/pages/templates-edit/components/TemplateRowBlock';
import type { TemplateRowField, TemplateRows } from '@/types/types';
import { cn } from '@/lib/utils';

type RowBlockPropsBase = Omit<
  TemplateRowBlockProps,
  | 'row'
  | 'rowId'
  | 'rowIndex'
  | 'rowCount'
  | 'canDragFields'
  | 'fieldIds'
  | 'rowFields'
  | 'dragListeners'
  | 'dragAttributes'
  | 'isPlaceholder'
  | 'isOverlay'
  | 'isFieldDragging'
>;

type SortableRowItemProps = RowBlockPropsBase & {
  id: string;
  row: TemplateRows[number];
  rowIndex: number;
  rowCount: number;
  canDragFields: boolean;
  isFieldDragging: boolean;
  fieldIds: string[];
  rowFields: TemplateRowField[];
};

function SortableTemplateRow({
  id,
  row,
  rowIndex,
  rowCount,
  canDragFields,
  isFieldDragging,
  fieldIds,
  rowFields,
  ...rowProps
}: SortableRowItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative', isDragging && 'z-0')}
    >
      <TemplateRowBlock
        row={row}
        rowId={id}
        rowIndex={rowIndex}
        rowCount={rowCount}
        canDragFields={canDragFields}
        isFieldDragging={isFieldDragging}
        fieldIds={fieldIds}
        rowFields={rowFields}
        dragListeners={listeners}
        dragAttributes={attributes}
        isPlaceholder={isDragging}
        {...rowProps}
      />
    </div>
  );
}

interface TemplateSortableRowsListProps {
  rowIds: string[];
  rows: TemplateRows;
  onReorderIds: (fromIndex: number, toIndex: number) => void;
  onRowDragStart?: () => void;
  onRowDragEnd?: () => void;
  onRowDragCancel?: () => void;
  getFieldIds: (rowIndex: number) => string[];
  getRowFields: (rowIndex: number) => TemplateRowField[];
  canDragFields: boolean;
  onFieldDragOver: (activeFieldId: string, overId: string) => void;
  onFieldDragStart: () => void;
  onFieldDragEnd: (drop: { activeFieldId: string; overId: string | null }) => void;
  onFieldDragCancel: () => void;
  findRowIdForFieldId: (fieldId: string) => string | undefined;
  rowBlockProps: RowBlockPropsBase;
}

export function TemplateSortableRowsList({
  rowIds,
  rows,
  onReorderIds,
  onRowDragStart,
  onRowDragEnd,
  onRowDragCancel,
  getFieldIds,
  getRowFields,
  canDragFields,
  onFieldDragOver,
  onFieldDragStart,
  onFieldDragEnd,
  onFieldDragCancel,
  findRowIdForFieldId,
  rowBlockProps,
}: TemplateSortableRowsListProps) {
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [overlayRowFields, setOverlayRowFields] = useState<TemplateRowField[] | null>(null);
  const [overlayFieldIds, setOverlayFieldIds] = useState<string[] | null>(null);

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [overlayField, setOverlayField] = useState<TemplateRowField | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isRowId = (id: string) => rowIds.includes(id);

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) {
      const fieldHits = pointerHits.filter(
        (collision) => !String(collision.id).startsWith('row-fields:')
      );
      if (fieldHits.length > 0) return fieldHits;
    }
    return closestCenter(args);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);

    if (isRowId(id)) {
      const index = rowIds.indexOf(id);
      setActiveRowId(id);
      setOverlayRowFields(index >= 0 ? getRowFields(index) : null);
      setOverlayFieldIds(index >= 0 ? getFieldIds(index) : null);
      onRowDragStart?.();
      return;
    }

    const rowId = findRowIdForFieldId(id);
    if (!rowId) return;

    const rowIndex = rowIds.indexOf(rowId);
    const fieldIds = rowIndex >= 0 ? getFieldIds(rowIndex) : [];
    const fieldIndex = fieldIds.indexOf(id);
    const field =
      rowIndex >= 0 && fieldIndex >= 0
        ? getRowFields(rowIndex)[fieldIndex]
        : undefined;

    setActiveFieldId(id);
    setOverlayField(field ?? null);
    onFieldDragStart();
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    if (isRowId(activeId)) {
      if (!isRowId(overId)) return;
      const oldIndex = rowIds.indexOf(activeId);
      const newIndex = rowIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      onReorderIds(oldIndex, newIndex);
      return;
    }

    if (overId.startsWith('row-fields:')) {
      const rowIndex = rowIds.indexOf(overId.slice('row-fields:'.length));
      if (rowIndex >= 0 && getFieldIds(rowIndex).length > 0) return;
    }

    onFieldDragOver(activeId, overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (activeRowId) {
      setActiveRowId(null);
      setOverlayRowFields(null);
      setOverlayFieldIds(null);
      onRowDragEnd?.();
      return;
    }

    if (activeFieldId) {
      const overId = event.over ? String(event.over.id) : null;
      setActiveFieldId(null);
      setOverlayField(null);
      onFieldDragEnd({ activeFieldId, overId });
    }
  };

  const handleDragCancel = () => {
    if (activeRowId) {
      setActiveRowId(null);
      setOverlayRowFields(null);
      setOverlayFieldIds(null);
      onRowDragCancel?.();
      return;
    }

    if (activeFieldId) {
      setActiveFieldId(null);
      setOverlayField(null);
      onFieldDragCancel();
    }
  };

  const activeRowIndex = activeRowId ? rowIds.indexOf(activeRowId) : -1;

  let activeFieldRowIndex = -1;
  let activeFieldIndex = -1;
  if (activeFieldId && !activeRowId) {
    for (let rowIndex = 0; rowIndex < rowIds.length; rowIndex++) {
      const index = getFieldIds(rowIndex).indexOf(activeFieldId);
      if (index >= 0) {
        activeFieldRowIndex = rowIndex;
        activeFieldIndex = index;
        break;
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {rowIds.map((id, rowIndex) => (
            <SortableTemplateRow
              key={id}
              id={id}
              row={rows[rowIndex]}
              rowIndex={rowIndex}
              rowCount={rows.length}
              canDragFields={canDragFields}
              fieldIds={getFieldIds(rowIndex)}
              rowFields={getRowFields(rowIndex)}
              isFieldDragging={activeFieldId !== null}
              {...rowBlockProps}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeRowId && activeRowIndex >= 0 && overlayRowFields && overlayFieldIds ? (
          <div className="w-[min(100vw-3rem,24rem)] cursor-grabbing sm:w-[min(100vw-3rem,26rem)]">
            <TemplateRowBlock
              row={rows[activeRowIndex]}
              rowId={activeRowId}
              rowIndex={activeRowIndex}
              rowCount={rows.length}
              canDragFields={false}
              fieldIds={overlayFieldIds}
              rowFields={overlayRowFields}
              {...rowBlockProps}
              isOverlay
            />
          </div>
        ) : null}
        {activeFieldId && overlayField && activeFieldIndex >= 0 ? (
          <div className="cursor-grabbing">
            <FieldChip
              field={overlayField}
              fieldIndex={activeFieldIndex}
              rowIndex={activeFieldRowIndex}
              isSelected={false}
              builderFieldLabel={rowBlockProps.builderFieldLabel}
              onSelectField={rowBlockProps.onSelectField}
              onRemoveField={rowBlockProps.onRemoveField}
              isOverlay
              canDrag={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
