import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TemplateRowField } from '@/types/types';

export const rowFieldsDroppableId = (rowId: string) => `row-fields:${rowId}`;

type FieldChipProps = {
  field: TemplateRowField;
  fieldIndex: number;
  rowIndex: number;
  isSelected: boolean;
  builderFieldLabel: (label: TemplateRowField['label']) => string;
  onSelectField: (rowIndex: number, fieldIndex: number) => void;
  onRemoveField: (rowIndex: number, fieldIndex: number) => void;
  isPlaceholder?: boolean;
  isOverlay?: boolean;
  dragListeners?: ReturnType<typeof useSortable>['listeners'];
  dragAttributes?: ReturnType<typeof useSortable>['attributes'];
  canDrag?: boolean;
};

export function FieldChip({
  field,
  fieldIndex,
  rowIndex,
  isSelected,
  builderFieldLabel,
  onSelectField,
  onRemoveField,
  isPlaceholder = false,
  isOverlay = false,
  dragListeners,
  dragAttributes,
  canDrag = true,
}: FieldChipProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border bg-muted/70 px-2 py-1 text-xs outline-none',
        isPlaceholder && 'border-dashed opacity-45',
        isSelected && !isPlaceholder && !isOverlay && 'border-primary bg-primary text-primary-foreground',
        isOverlay && 'border-border bg-card opacity-100 shadow-md',
        canDrag && !isOverlay && 'touch-none cursor-grab active:cursor-grabbing'
      )}
      {...(canDrag && !isOverlay ? dragListeners : {})}
      {...(canDrag && !isOverlay ? dragAttributes : {})}
    >
      <button
        type="button"
        onClick={() => onSelectField(rowIndex, fieldIndex)}
        className="font-medium"
        disabled={isOverlay}
      >
        {builderFieldLabel(field.label)}
      </button>
      {!isOverlay ? (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveField(rowIndex, fieldIndex);
          }}
          aria-label={t('templateEditor.removeField')}
          className="opacity-70 hover:opacity-100"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

type SortableFieldChipProps = Omit<
  FieldChipProps,
  'isPlaceholder' | 'isOverlay' | 'dragListeners' | 'dragAttributes' | 'canDrag'
> & {
  id: string;
  canDrag: boolean;
};

function SortableFieldChip({ id, canDrag, ...chipProps }: SortableFieldChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id,
      disabled: !canDrag,
      animateLayoutChanges: () => false,
    });

  const style: CSSProperties = isDragging
    ? { opacity: 0 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('inline-flex', isDragging && 'touch-none')}
    >
      <FieldChip
        {...chipProps}
        dragListeners={listeners}
        dragAttributes={attributes}
        isPlaceholder={false}
        canDrag={canDrag}
      />
    </div>
  );
}

export interface TemplateSortableFieldsProps {
  rowIndex: number;
  fieldIds: string[];
  fields: TemplateRowField[];
  canDragFields: boolean;
  selectedField: { rowIndex: number; fieldIndex: number } | null;
  onSelectField: (rowIndex: number, fieldIndex: number) => void;
  onRemoveField: (rowIndex: number, fieldIndex: number) => void;
  builderFieldLabel: (label: TemplateRowField['label']) => string;
  trailing?: ReactNode;
}

export function TemplateSortableFields({
  rowIndex,
  fieldIds,
  fields,
  canDragFields,
  selectedField,
  onSelectField,
  onRemoveField,
  builderFieldLabel,
  trailing,
}: TemplateSortableFieldsProps) {
  if (!canDragFields) {
    return (
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {fields.map((field, fieldIndex) => (
          <FieldChip
            key={fieldIds[fieldIndex] ?? `${rowIndex}-${fieldIndex}`}
            field={field}
            fieldIndex={fieldIndex}
            rowIndex={rowIndex}
            isSelected={
              selectedField?.rowIndex === rowIndex &&
              selectedField.fieldIndex === fieldIndex
            }
            builderFieldLabel={builderFieldLabel}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            canDrag={false}
          />
        ))}
        {trailing}
      </div>
    );
  }

  return (
    <SortableContext items={fieldIds} strategy={horizontalListSortingStrategy}>
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {fieldIds.map((id, fieldIndex) => (
          <SortableFieldChip
            key={id}
            id={id}
            field={fields[fieldIndex]}
            fieldIndex={fieldIndex}
            rowIndex={rowIndex}
            isSelected={
              selectedField?.rowIndex === rowIndex &&
              selectedField.fieldIndex === fieldIndex
            }
            builderFieldLabel={builderFieldLabel}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            canDrag={canDragFields}
          />
        ))}
        {trailing}
      </div>
    </SortableContext>
  );
}
