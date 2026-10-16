import {
  fieldIdListsEqual,
  findRowIdForFieldInMap,
  moveFieldIdWithinRow,
} from '@/lib/reorderList';

export function serializeFieldIdsByRow(
  rowIdsList: string[],
  map: Record<string, string[]>
): string {
  return rowIdsList.map((rowId) => (map[rowId] ?? []).join('\0')).join('\n');
}

export function applyFieldDragOver(
  prev: Record<string, string[]>,
  rowIdsList: string[],
  activeFieldId: string,
  overId: string,
  arrayMove: (items: string[], from: number, to: number) => string[]
): Record<string, string[]> | null {
  if (overId.startsWith('row-fields:')) {
    const rowId = overId.slice('row-fields:'.length);
    const ids = prev[rowId] ?? [];
    if (ids.length > 0) return null;
  }

  const activeRowId = findRowIdForFieldInMap(activeFieldId, rowIdsList, prev);
  if (!activeRowId) return null;

  const overRowId = overId.startsWith('row-fields:')
    ? overId.slice('row-fields:'.length)
    : findRowIdForFieldInMap(overId, rowIdsList, prev);

  if (!overRowId) return null;

  const sourceIds = prev[activeRowId] ?? [];
  const targetIds = prev[overRowId] ?? [];
  const activeInSource = sourceIds.indexOf(activeFieldId);
  const activeInTarget = targetIds.indexOf(activeFieldId);

  if (activeRowId === overRowId) {
    const nextRow = moveFieldIdWithinRow(
      targetIds,
      activeFieldId,
      overId,
      arrayMove
    );
    if (!nextRow) return null;
    if (fieldIdListsEqual(nextRow, targetIds)) return null;
    return { ...prev, [overRowId]: nextRow };
  }

  if (activeInTarget >= 0 && activeInSource < 0) {
    const nextRow = moveFieldIdWithinRow(
      targetIds,
      activeFieldId,
      overId,
      arrayMove
    );
    if (!nextRow) return null;
    if (fieldIdListsEqual(nextRow, targetIds)) return null;
    return { ...prev, [overRowId]: nextRow };
  }

  if (activeInSource < 0) return null;
  if (activeInTarget >= 0) return null;

  const overIsRowContainer = overId.startsWith('row-fields:');
  let insertIndex = overIsRowContainer ? 0 : targetIds.indexOf(overId);
  if (insertIndex < 0) insertIndex = targetIds.length;

  const nextFrom = sourceIds.filter((id) => id !== activeFieldId);
  const nextTo = [...targetIds];
  nextTo.splice(insertIndex, 0, activeFieldId);

  if (
    fieldIdListsEqual(nextFrom, sourceIds) &&
    fieldIdListsEqual(nextTo, targetIds)
  ) {
    return null;
  }

  const next = {
    ...prev,
    [activeRowId]: nextFrom,
    [overRowId]: nextTo,
  };

  if (
    serializeFieldIdsByRow(rowIdsList, next) ===
    serializeFieldIdsByRow(rowIdsList, prev)
  ) {
    return null;
  }

  return next;
}
