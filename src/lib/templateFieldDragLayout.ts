import { arrayMove } from '@dnd-kit/sortable';

export const ROW_FIELDS_PREFIX = 'row-fields:';
export const ROW_INSERT_PREFIX = 'row-insert:';

export function rowFieldsDroppableId(rowId: string): string {
  return `${ROW_FIELDS_PREFIX}${rowId}`;
}

export function rowInsertDroppableId(insertIndex: number): string {
  return `${ROW_INSERT_PREFIX}${insertIndex}`;
}

export function findRowIdForFieldIdInLayout(
  rowIds: string[],
  fieldIdsByRowId: Record<string, string[]>,
  fieldId: string
): string | undefined {
  return rowIds.find((rowId) => fieldIdsByRowId[rowId]?.includes(fieldId));
}

export function pruneEmptyRows(
  rowIds: string[],
  fieldIdsByRowId: Record<string, string[]>
): { rowIds: string[]; fieldIdsByRowId: Record<string, string[]> } {
  if (rowIds.length <= 1) {
    return {
      rowIds: [...rowIds],
      fieldIdsByRowId: { ...fieldIdsByRowId },
    };
  }

  const nextIds: string[] = [];
  const nextFields = { ...fieldIdsByRowId };

  for (const rowId of rowIds) {
    const fieldIds = nextFields[rowId] ?? [];
    if (fieldIds.length === 0) {
      delete nextFields[rowId];
      continue;
    }
    nextIds.push(rowId);
  }

  return { rowIds: nextIds, fieldIdsByRowId: nextFields };
}

/** Logical field placement while dragging; UI row list stays on anchorRowIds only. */
export type FieldDragLayout = {
  anchorRowIds: string[];
  fieldIdsByRowId: Record<string, string[]>;
  /** New row will be created at this index on drop (field not in any row until then). */
  pendingInsertIndex: number | null;
};

export function createFieldDragLayout(
  rowIds: string[],
  fieldIdsByRowId: Record<string, string[]>
): FieldDragLayout {
  return {
    anchorRowIds: [...rowIds],
    fieldIdsByRowId: Object.fromEntries(
      rowIds.map((rowId) => [rowId, [...(fieldIdsByRowId[rowId] ?? [])]])
    ),
    pendingInsertIndex: null,
  };
}

export function layoutRowIds(layout: FieldDragLayout): string[] {
  return [...layout.anchorRowIds];
}

function resolveOverRowId(
  overId: string,
  anchorRowIds: string[],
  fieldIdsByRowId: Record<string, string[]>
): string | undefined {
  if (overId.startsWith(ROW_INSERT_PREFIX)) return undefined;
  if (overId.startsWith(ROW_FIELDS_PREFIX)) {
    return overId.slice(ROW_FIELDS_PREFIX.length);
  }
  if (anchorRowIds.includes(overId)) return overId;
  return findRowIdForFieldIdInLayout(anchorRowIds, fieldIdsByRowId, overId);
}

function removeFieldFromAllAnchors(
  layout: FieldDragLayout,
  fieldId: string
): Record<string, string[]> {
  const next = { ...layout.fieldIdsByRowId };
  for (const rowId of layout.anchorRowIds) {
    next[rowId] = (next[rowId] ?? []).filter((id) => id !== fieldId);
  }
  return next;
}

export function applyFieldDragOver(
  layout: FieldDragLayout,
  activeFieldId: string,
  overId: string,
  _createId: () => string
): FieldDragLayout {
  const { anchorRowIds } = layout;

  if (overId.startsWith(ROW_INSERT_PREFIX)) {
    const insertIndex = Number(overId.slice(ROW_INSERT_PREFIX.length));
    if (Number.isNaN(insertIndex)) return layout;

    const clamped = Math.max(0, Math.min(insertIndex, anchorRowIds.length));
    const fieldIdsByRowId = removeFieldFromAllAnchors(layout, activeFieldId);

    return {
      ...layout,
      fieldIdsByRowId,
      pendingInsertIndex: clamped,
    };
  }

  const overRowId = resolveOverRowId(
    overId,
    anchorRowIds,
    layout.fieldIdsByRowId
  );
  if (!overRowId) return layout;

  const activeRowId = findRowIdForFieldIdInLayout(
    anchorRowIds,
    layout.fieldIdsByRowId,
    activeFieldId
  );

  let fieldIdsByRowId = { ...layout.fieldIdsByRowId };

  if (activeRowId === overRowId) {
    const ids = [...(fieldIdsByRowId[activeRowId] ?? [])];
    const oldIndex = ids.indexOf(activeFieldId);
    const newIndex = overId.startsWith(ROW_FIELDS_PREFIX)
      ? Math.max(0, ids.length - 1)
      : ids.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return layout;
    }
    fieldIdsByRowId[activeRowId] = arrayMove(ids, oldIndex, newIndex);
    return {
      ...layout,
      fieldIdsByRowId,
      pendingInsertIndex: null,
    };
  }

  fieldIdsByRowId = removeFieldFromAllAnchors(
    { ...layout, fieldIdsByRowId },
    activeFieldId
  );

  const toIds = [...(fieldIdsByRowId[overRowId] ?? [])];
  let targetIndex = toIds.length;
  if (
    !overId.startsWith(ROW_FIELDS_PREFIX) &&
    !anchorRowIds.includes(overId)
  ) {
    const overIndex = toIds.indexOf(overId);
    if (overIndex >= 0) targetIndex = overIndex;
  }
  toIds.splice(targetIndex, 0, activeFieldId);
  fieldIdsByRowId[overRowId] = toIds;

  return {
    ...layout,
    fieldIdsByRowId,
    pendingInsertIndex: null,
  };
}

export function fieldDragLayoutsEqual(a: FieldDragLayout, b: FieldDragLayout): boolean {
  if (a.pendingInsertIndex !== b.pendingInsertIndex) return false;
  if (a.anchorRowIds.length !== b.anchorRowIds.length) return false;
  if (!a.anchorRowIds.every((id, index) => id === b.anchorRowIds[index])) {
    return false;
  }

  for (const rowId of a.anchorRowIds) {
    const left = a.fieldIdsByRowId[rowId] ?? [];
    const right = b.fieldIdsByRowId[rowId] ?? [];
    if (left.length !== right.length) return false;
    if (!left.every((id, index) => id === right[index])) return false;
  }

  return true;
}

/** Build committed row ids/fields from drag layout (insert row materialized on drop). */
export function materializeFieldDragLayout(
  layout: FieldDragLayout,
  activeFieldId: string,
  createRowId: () => string
): { rowIds: string[]; fieldIdsByRowId: Record<string, string[]> } {
  let rowIds = [...layout.anchorRowIds];
  const fieldIdsByRowId = { ...layout.fieldIdsByRowId };

  if (layout.pendingInsertIndex !== null) {
    const newRowId = createRowId();
    const index = Math.max(0, Math.min(layout.pendingInsertIndex, rowIds.length));
    rowIds.splice(index, 0, newRowId);
    for (const rowId of layout.anchorRowIds) {
      fieldIdsByRowId[rowId] = (fieldIdsByRowId[rowId] ?? []).filter(
        (id) => id !== activeFieldId
      );
    }
    fieldIdsByRowId[newRowId] = [activeFieldId];
  }

  return pruneEmptyRows(rowIds, fieldIdsByRowId);
}
