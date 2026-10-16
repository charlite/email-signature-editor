export function fieldIdListsEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export function findRowIdForFieldInMap(
  fieldId: string,
  rowIdsList: string[],
  fieldIdsByRow: Record<string, string[]>
) {
  return rowIdsList.find((rowId) => fieldIdsByRow[rowId]?.includes(fieldId));
}

/** Reorder within one row during field drag; null if order is already correct. */
export function moveFieldIdWithinRow(
  ids: string[],
  activeFieldId: string,
  overId: string,
  move: (items: string[], from: number, to: number) => string[]
): string[] | null {
  const activeIndex = ids.indexOf(activeFieldId);
  if (activeIndex < 0) return null;

  const overIsRowContainer = overId.startsWith('row-fields:');
  if (overIsRowContainer) return null;

  const overIndex = ids.indexOf(overId);

  if (overIndex < 0) return null;
  if (activeIndex === overIndex) return null;

  const next = move(ids, activeIndex, overIndex);
  return fieldIdListsEqual(next, ids) ? null : next;
}

/** Move an item from `fromIndex` to `toIndex` in a copy of `items`. */
export function reorderList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

/** Remap a row index after rows were reordered with reorderList. */
export function remapRowIndexAfterReorder(
  rowIndex: number,
  fromIndex: number,
  toIndex: number
): number {
  if (rowIndex === fromIndex) return toIndex;
  if (fromIndex < toIndex) {
    if (rowIndex > fromIndex && rowIndex <= toIndex) return rowIndex - 1;
  } else if (fromIndex > toIndex) {
    if (rowIndex >= toIndex && rowIndex < fromIndex) return rowIndex + 1;
  }
  return rowIndex;
}
