import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddFieldMenu } from '@/pages/templates-edit/components/AddFieldMenu';
import {
  rowFieldsDroppableId,
  TemplateSortableFields,
} from '@/pages/templates-edit/components/TemplateSortableFields';
import { cn } from '@/lib/utils';
import type { TemplateBuilderField, TemplateRowField, TemplateRows } from '@/types/types';

export type TemplateRowBlockProps = {
  row: TemplateRows[number];
  rowId: string;
  rowIndex: number;
  rowCount: number;
  canDragFields: boolean;
  selectedField: { rowIndex: number; fieldIndex: number } | null;
  onSelectField: (rowIndex: number, fieldIndex: number) => void;
  onAddField: (rowIndex: number, field: TemplateBuilderField) => void;
  onRemoveRow: (rowIndex: number) => void;
  onRemoveField: (rowIndex: number, fieldIndex: number) => void;
  builderFieldLabel: (field: TemplateBuilderField) => string;
  fieldIds: string[];
  rowFields: TemplateRowField[];
  dragListeners?: DraggableSyntheticListeners;
  dragAttributes?: DraggableAttributes;
  isPlaceholder?: boolean;
  isOverlay?: boolean;
  isFieldDragging?: boolean;
};

export function TemplateRowBlock({
  row: _row,
  rowId,
  rowIndex,
  rowCount,
  canDragFields,
  selectedField,
  onSelectField,
  onAddField,
  onRemoveRow,
  onRemoveField,
  builderFieldLabel,
  fieldIds,
  rowFields,
  dragListeners,
  dragAttributes,
  isPlaceholder = false,
  isOverlay = false,
  isFieldDragging = false,
}: TemplateRowBlockProps) {
  const { t } = useTranslation();
  const canDragRow = rowCount > 1 && !isOverlay;

  const enableFieldsDropTarget = fieldIds.length === 0 && !isOverlay;

  const { setNodeRef: setFieldsDropRef } = useDroppable({
    id: rowFieldsDroppableId(rowId),
    disabled: !enableFieldsDropTarget,
  });

  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3',
        isPlaceholder &&
          'border-dashed border-primary/25 bg-muted/10 opacity-50 shadow-none transition-opacity duration-200',
        isOverlay &&
          'border-border bg-card opacity-100 shadow-lg ring-2 ring-primary/15'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className={cn(
              'flex size-8 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground',
              canDragRow &&
                'cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing',
              !canDragRow && 'cursor-default opacity-40'
            )}
            aria-label={t('templateEditor.dragRow')}
            {...(canDragRow ? dragListeners : {})}
            {...(canDragRow ? dragAttributes : {})}
          >
            <GripVertical className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {t('templateEditor.rowLabel', { number: rowIndex + 1 })}
          </span>
        </div>
        {!isOverlay ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemoveRow(rowIndex)}
            disabled={rowCount === 1}
            aria-label={t('templateEditor.deleteRow')}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      {isOverlay ? (
        <div className="flex flex-wrap gap-2">
          {rowFields.map((field, fieldIndex) => (
            <div
              key={fieldIds[fieldIndex] ?? `${rowIndex}-${fieldIndex}`}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/70 px-2 py-1 text-xs"
            >
              <span className="font-medium">{builderFieldLabel(field.label)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div ref={setFieldsDropRef}>
          <TemplateSortableFields
            rowIndex={rowIndex}
            fieldIds={fieldIds}
            fields={rowFields}
            canDragFields={canDragFields}
            selectedField={isFieldDragging ? null : selectedField}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            builderFieldLabel={builderFieldLabel}
            trailing={
              !isFieldDragging ? (
                <AddFieldMenu
                  rowIndex={rowIndex}
                  onAddField={onAddField}
                  builderFieldLabel={builderFieldLabel}
                />
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
}
