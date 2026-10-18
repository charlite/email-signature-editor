import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { arrayMove } from '@dnd-kit/sortable';
import { ArrowLeft, Check, Plus, Save } from 'lucide-react';
import { PreviewPanel } from '@/pages/templates-edit/components/PreviewPanel';
import { TemplateFieldStylePanel } from '@/pages/templates-edit/components/TemplateFieldStylePanel';
import { TemplateSortableRowsList } from '@/pages/templates-edit/components/TemplateSortableRowsList';
import { Button } from '@/components/ui/button';
import { ColorInput } from '@/components/ui/color-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserContext } from '@/contexts/UserContext';
import { buildTemplateHtmlFromSchema } from '@/lib/templates/builder';
import {
  applyFieldTextPatch,
  createTemplateRowField,
  normalizeTemplateRows,
  normalizeTemplateTextConfig,
} from '@/lib/templateRows';
import {
  DEFAULT_NEW_TEMPLATE,
  DEFAULT_SIGNATURE_VALUES,
  type NewTemplate,
  type TemplateBuilderField,
  type TemplateRowField,
  type TemplateRows,
  type TemplateTextConfig,
} from '@/types/types';
import { createRowId } from '@/lib/createRowId';
import { applyFieldDragOver } from '@/lib/fieldDragOver';
import {
  isSavedCustomTemplateId,
  serializeTemplateEditorState,
} from '@/lib/templateEditorSnapshot';
import { copyPreviewForGmail } from '@/utils/utils';

const TEMPLATE_SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const IMAGE_SHAPES = ['rounded', 'circle', 'square'] as const;
const IMAGE_PLACEMENTS = ['left', 'right', 'top'] as const;
const TEXT_SHAPES = ['normal', 'bold', 'italic'] as const;

function createFieldIdsByRowId(
  rowIdsList: string[],
  rows: TemplateRows
): Record<string, string[]> {
  return Object.fromEntries(
    rowIdsList.map((rowId, rowIndex) => [
      rowId,
      rows[rowIndex].map(() => createRowId()),
    ])
  );
}

const INITIAL_TEMPLATE_ROW_IDS = DEFAULT_NEW_TEMPLATE.rows.map(() => createRowId());

export default function TemplateEditPage() {
  const { t } = useTranslation();
  const {
    resolvedHtml,
    saveTemplate,
    savedTemplates,
    selectedTemplate,
    setTemplateHtml,
  } = useUserContext();

  const builderFieldLabel = useCallback(
    (field: TemplateBuilderField) => t(`templateEditor.builderFields.${field}`),
    [t]
  );

  const [builderTemplate, setBuilderTemplate] = useState<NewTemplate>(() => ({
    id: `builder-${Date.now()}`,
    name: t('templateEditor.untitled'),
    html: '',
    config: DEFAULT_NEW_TEMPLATE.config,
    rows: DEFAULT_NEW_TEMPLATE.rows,
  }));
  const [selectedField, setSelectedField] = useState<{
    rowIndex: number;
    fieldIndex: number;
  } | null>(null);

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [rowIds, setRowIds] = useState<string[]>(INITIAL_TEMPLATE_ROW_IDS);
  const [fieldIdsByRowId, setFieldIdsByRowId] = useState<Record<string, string[]>>(
    () => createFieldIdsByRowId(INITIAL_TEMPLATE_ROW_IDS, DEFAULT_NEW_TEMPLATE.rows)
  );
  const [dragRowById, setDragRowById] = useState<
    Map<string, TemplateRows[number]> | null
  >(null);
  const [previewRows, setPreviewRows] = useState<TemplateRows | null>(null);
  const [fieldDragState, setFieldDragState] = useState<{
    snapshot: Map<string, TemplateRowField>;
  } | null>(null);
  const rowIdsAtDragStartRef = useRef<string[]>([]);
  const selectedRowIdAtDragStartRef = useRef<string | null>(null);
  const fieldIdsByRowIdAtDragStartRef = useRef<Record<string, string[]>>({});
  const selectedFieldIdAtDragStartRef = useRef<string | null>(null);
  const fieldIdsByRowIdRef = useRef(fieldIdsByRowId);
  fieldIdsByRowIdRef.current = fieldIdsByRowId;

  const rowsForHtml = previewRows ?? builderTemplate.rows;

  const generatedHtml = useMemo(
    () => buildTemplateHtmlFromSchema({ ...builderTemplate, rows: rowsForHtml }),
    [builderTemplate, rowsForHtml]
  );

  const currentEditorSnapshot = useMemo(
    () => serializeTemplateEditorState(builderTemplate, generatedHtml),
    [builderTemplate, generatedHtml]
  );

  const savedTemplateIds = useMemo(
    () => savedTemplates.map((template) => template.id),
    [savedTemplates]
  );

  const isEditorDirty = currentEditorSnapshot !== savedSnapshot;
  const isPersistedTemplate = isSavedCustomTemplateId(
    builderTemplate.id,
    savedTemplateIds
  );
  const showSavedButton = !isEditorDirty && isPersistedTemplate;

  const displayRows = useMemo(() => {
    if (dragRowById) {
      return rowIds.map((id) => dragRowById.get(id)!);
    }
    return builderTemplate.rows;
  }, [rowIds, dragRowById, builderTemplate.rows]);

  const resolveBuilderRowIndex = useCallback(
    (displayIndex: number) => {
      const id = rowIds[displayIndex];
      const row = dragRowById?.get(id) ?? builderTemplate.rows[displayIndex];
      const builderIndex = builderTemplate.rows.findIndex((item) => item === row);
      return builderIndex >= 0 ? builderIndex : displayIndex;
    },
    [rowIds, dragRowById, builderTemplate.rows]
  );

  const getFieldIds = useCallback(
    (displayIndex: number) => fieldIdsByRowId[rowIds[displayIndex]] ?? [],
    [fieldIdsByRowId, rowIds]
  );

  const getRowFields = useCallback(
    (displayIndex: number) => {
      const rowId = rowIds[displayIndex];
      const ids = fieldIdsByRowId[rowId] ?? [];
      const builderIndex = resolveBuilderRowIndex(displayIndex);
      const builderFields = builderTemplate.rows[builderIndex];

      if (fieldDragState) {
        return ids.map((id) => fieldDragState.snapshot.get(id)!);
      }

      return ids.map((_, index) => builderFields[index]);
    },
    [
      rowIds,
      fieldIdsByRowId,
      fieldDragState,
      resolveBuilderRowIndex,
      builderTemplate.rows,
    ]
  );

  const findRowIdForFieldId = useCallback(
    (fieldId: string) =>
      rowIds.find((rowId) => fieldIdsByRowId[rowId]?.includes(fieldId)),
    [rowIds, fieldIdsByRowId]
  );

  const totalFieldCount = useMemo(
    () =>
      rowIds.reduce(
        (sum, rowId) => sum + (fieldIdsByRowId[rowId]?.length ?? 0),
        0
      ),
    [rowIds, fieldIdsByRowId]
  );

  const canDragFields = rowIds.length > 1 || totalFieldCount > 1;

  const selectedRowField =
    selectedField === null || fieldDragState !== null
      ? null
      : getRowFields(selectedField.rowIndex)[selectedField.fieldIndex] ?? null;

  const freezePreview = useCallback(() => {
    setPreviewRows((current) => current ?? builderTemplate.rows);
  }, [builderTemplate.rows]);

  const maybeClearPreview = useCallback(
    (options: { rowDragCleared?: boolean; fieldDragCleared?: boolean }) => {
      const rowStillActive =
        options.rowDragCleared === true ? false : dragRowById !== null;
      const fieldStillActive =
        options.fieldDragCleared === true ? false : fieldDragState !== null;
      if (!rowStillActive && !fieldStillActive) {
        setPreviewRows(null);
      }
    },
    [dragRowById, fieldDragState]
  );

  useEffect(() => {
    const normalizedRows = normalizeTemplateRows(
      selectedTemplate.rows,
      selectedTemplate.config.text
    );
    const nextTemplate: NewTemplate = {
      ...selectedTemplate,
      config: {
        ...selectedTemplate.config,
        image: {
          ...selectedTemplate.config.image,
          url: selectedTemplate.config.image.url === '{{IMAGE}}'
            ? DEFAULT_SIGNATURE_VALUES.IMAGE
            : selectedTemplate.config.image.url,
        },
        text: normalizeTemplateTextConfig(
          selectedTemplate.config.text,
          DEFAULT_NEW_TEMPLATE.config.text
        ),
      },
      rows: normalizedRows,
    };
    setBuilderTemplate(nextTemplate);
    setSavedSnapshot(
      serializeTemplateEditorState(
        nextTemplate,
        buildTemplateHtmlFromSchema(nextTemplate)
      )
    );
    setSelectedField(null);
    const nextRowIds = selectedTemplate.rows.map(() => createRowId());
    setRowIds(nextRowIds);
    setFieldIdsByRowId(createFieldIdsByRowId(nextRowIds, normalizedRows));
    setDragRowById(null);
    setPreviewRows(null);
    setFieldDragState(null);
  }, [selectedTemplate]);

  useEffect(() => {
    setTemplateHtml(generatedHtml);
  }, [generatedHtml, setTemplateHtml]);

  const onSaveTemplate = useCallback(() => {
    const savedId = saveTemplate({
      ...builderTemplate,
      html: generatedHtml,
    });
    setSavedSnapshot(
      serializeTemplateEditorState(
        { ...builderTemplate, id: savedId },
        generatedHtml
      )
    );
    toast.success(t('templateEditor.toastSaved'));
  }, [builderTemplate, generatedHtml, saveTemplate, t]);

  const copyPreviewAsRichHtml = useCallback(async () => {
    await copyPreviewForGmail(previewIframeRef.current, resolvedHtml);
    setCopiedPreview(true);
    window.setTimeout(() => setCopiedPreview(false), 2000);
  }, [resolvedHtml]);


  const addRow = useCallback(() => {
    const newRowId = createRowId();
    setBuilderTemplate((prev) => ({
      ...prev,
      rows: [...prev.rows, [createTemplateRowField('text')]],
    }));
    setRowIds((ids) => [...ids, newRowId]);
    setFieldIdsByRowId((prev) => ({
      ...prev,
      [newRowId]: [createRowId()],
    }));
    setSelectedField(null);
  }, []);

  const removeRow = useCallback(
    (displayIndex: number) => {
      if (builderTemplate.rows.length <= 1) {
        toast.error(t('templateEditor.cannotDeleteLastRow'));
        return;
      }

      const builderIndex = resolveBuilderRowIndex(displayIndex);
      const rowId = rowIds[displayIndex];

      setBuilderTemplate((prev) => {
        if (prev.rows.length <= 1) return prev;
        return {
          ...prev,
          rows: prev.rows.filter((_, index) => index !== builderIndex),
        };
      });
      setRowIds((ids) => ids.filter((_, index) => index !== displayIndex));
      setFieldIdsByRowId((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
      setSelectedField((current) => {
        if (!current) return null;
        if (current.rowIndex === displayIndex) return null;
        if (current.rowIndex > displayIndex) {
          return { ...current, rowIndex: current.rowIndex - 1 };
        }
        return current;
      });
      toast.success(t('templateEditor.toastRowDeleted'));
    },
    [builderTemplate.rows.length, resolveBuilderRowIndex, rowIds, t]
  );

  const handleReorderRowIds = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setRowIds((ids) => arrayMove(ids, fromIndex, toIndex));
  }, []);

  const handleRowDragStart = useCallback(() => {
    rowIdsAtDragStartRef.current = [...rowIds];
    selectedRowIdAtDragStartRef.current =
      selectedField !== null ? rowIds[selectedField.rowIndex] ?? null : null;
    freezePreview();
    setDragRowById(
      new Map(rowIds.map((id, index) => [id, builderTemplate.rows[index]]))
    );
  }, [rowIds, selectedField, builderTemplate.rows, freezePreview]);

  const commitRowOrder = useCallback(() => {
    if (!dragRowById) return;

    const nextRows = rowIds.map((id) => dragRowById.get(id)!);
    setBuilderTemplate((prev) => ({ ...prev, rows: nextRows }));

    const selectedRowId = selectedRowIdAtDragStartRef.current;
    if (selectedField && selectedRowId) {
      const nextRowIndex = rowIds.indexOf(selectedRowId);
      if (nextRowIndex >= 0) {
        setSelectedField({
          rowIndex: nextRowIndex,
          fieldIndex: selectedField.fieldIndex,
        });
      }
    }

    setDragRowById(null);
    rowIdsAtDragStartRef.current = [];
    selectedRowIdAtDragStartRef.current = null;
    maybeClearPreview({ rowDragCleared: true });
  }, [dragRowById, rowIds, selectedField, maybeClearPreview]);

  const cancelRowDrag = useCallback(() => {
    if (rowIdsAtDragStartRef.current.length > 0) {
      setRowIds(rowIdsAtDragStartRef.current);
    }
    setDragRowById(null);
    rowIdsAtDragStartRef.current = [];
    selectedRowIdAtDragStartRef.current = null;
    maybeClearPreview({ rowDragCleared: true });
  }, [maybeClearPreview]);

  const handleFieldDragStart = useCallback(() => {
    const snapshot = new Map<string, TemplateRowField>();
    rowIds.forEach((rowId, displayIndex) => {
      const builderIndex = resolveBuilderRowIndex(displayIndex);
      const ids = fieldIdsByRowId[rowId] ?? [];
      const fields = builderTemplate.rows[builderIndex];
      ids.forEach((id, index) => snapshot.set(id, fields[index]));
    });

    fieldIdsByRowIdAtDragStartRef.current = Object.fromEntries(
      rowIds.map((rowId) => [rowId, [...(fieldIdsByRowId[rowId] ?? [])]])
    );

    if (selectedField) {
      const rowId = rowIds[selectedField.rowIndex];
      const ids = fieldIdsByRowId[rowId] ?? [];
      selectedFieldIdAtDragStartRef.current =
        ids[selectedField.fieldIndex] ?? null;
    } else {
      selectedFieldIdAtDragStartRef.current = null;
    }

    fieldIdsByRowIdRef.current = Object.fromEntries(
      rowIds.map((rowId) => [rowId, [...(fieldIdsByRowId[rowId] ?? [])]])
    );
    setFieldDragState({ snapshot });
    freezePreview();
  }, [
    rowIds,
    fieldIdsByRowId,
    resolveBuilderRowIndex,
    builderTemplate.rows,
    selectedField,
    freezePreview,
  ]);

  const handleFieldDragOver = useCallback(
    (activeFieldId: string, overId: string) => {
      setFieldIdsByRowId((prev) => {
        const next = applyFieldDragOver(
          prev,
          rowIds,
          activeFieldId,
          overId,
          arrayMove
        );
        if (!next) return prev;
        fieldIdsByRowIdRef.current = next;
        return next;
      });
    },
    [rowIds]
  );

  const commitFieldDrag = useCallback((idsMap: Record<string, string[]>) => {
    if (!fieldDragState) return;

    const rowEntries = rowIds.map((rowId) => ({
      rowId,
      ids: [...(idsMap[rowId] ?? [])],
    }));

    let keptRows = rowEntries.filter((entry) => entry.ids.length > 0);

    if (keptRows.length === 0) {
      const rowId = rowIds[0] ?? createRowId();
      const newFieldId = createRowId();
      const placeholder = createTemplateRowField('text');
      fieldDragState.snapshot.set(newFieldId, placeholder);
      keptRows = [{ rowId, ids: [newFieldId] }];
    }

    const newRowIds = keptRows.map((entry) => entry.rowId);
    const newRows = keptRows.map((entry) =>
      entry.ids.map((id) => fieldDragState.snapshot.get(id)!)
    );

    setBuilderTemplate((prev) => ({ ...prev, rows: newRows }));
    setRowIds(newRowIds);
    setFieldIdsByRowId(
      Object.fromEntries(keptRows.map((entry) => [entry.rowId, entry.ids]))
    );

    if (dragRowById) {
      setDragRowById(() => {
        const next = new Map<string, TemplateRows[number]>();
        keptRows.forEach((entry, index) => {
          next.set(entry.rowId, newRows[index]);
        });
        return next;
      });
    }

    const selectedFieldId = selectedFieldIdAtDragStartRef.current;
    if (selectedFieldId) {
      let nextSelection: { rowIndex: number; fieldIndex: number } | null = null;
      for (let displayIndex = 0; displayIndex < keptRows.length; displayIndex++) {
        const fieldIndex = keptRows[displayIndex].ids.indexOf(selectedFieldId);
        if (fieldIndex >= 0) {
          nextSelection = { rowIndex: displayIndex, fieldIndex };
          break;
        }
      }
      setSelectedField(nextSelection);
    } else {
      setSelectedField((current) => {
        if (!current) return null;
        const oldRowId = rowIds[current.rowIndex];
        const newRowIndex = oldRowId ? newRowIds.indexOf(oldRowId) : -1;
        if (newRowIndex < 0) return null;
        const ids = keptRows[newRowIndex].ids;
        if (current.fieldIndex >= ids.length) return null;
        return { rowIndex: newRowIndex, fieldIndex: current.fieldIndex };
      });
    }

    setFieldDragState(null);
    fieldIdsByRowIdAtDragStartRef.current = {};
    selectedFieldIdAtDragStartRef.current = null;
    maybeClearPreview({ fieldDragCleared: true });
  }, [fieldDragState, rowIds, dragRowById, maybeClearPreview]);

  const finalizeAndCommitFieldDrag = useCallback(
    ({ activeFieldId, overId }: { activeFieldId: string; overId: string | null }) => {
      if (!fieldDragState) return;

      let idsMap = fieldIdsByRowIdRef.current;

      if (
        overId &&
        activeFieldId !== overId &&
        !(
          overId.startsWith('row-fields:') &&
          (idsMap[overId.slice('row-fields:'.length)] ?? []).length > 0
        )
      ) {
        const next = applyFieldDragOver(
          idsMap,
          rowIds,
          activeFieldId,
          overId,
          arrayMove
        );
        if (next) {
          idsMap = next;
          fieldIdsByRowIdRef.current = next;
          setFieldIdsByRowId(next);
        }
      }

      commitFieldDrag(idsMap);
    },
    [fieldDragState, rowIds, commitFieldDrag]
  );

  const cancelFieldDrag = useCallback(() => {
    const snapshot = fieldIdsByRowIdAtDragStartRef.current;
    if (Object.keys(snapshot).length > 0) {
      setFieldIdsByRowId((prev) => ({ ...prev, ...snapshot }));
    }
    setFieldDragState(null);
    fieldIdsByRowIdAtDragStartRef.current = {};
    selectedFieldIdAtDragStartRef.current = null;
    maybeClearPreview({ fieldDragCleared: true });
  }, [maybeClearPreview]);

  const syncFieldSnapshot = useCallback(
    (rowId: string, fields: TemplateRowField[]) => {
      if (!fieldDragState) return;
      setFieldDragState((state) => {
        if (!state) return null;
        const ids = fieldIdsByRowId[rowId] ?? [];
        const nextSnapshot = new Map(state.snapshot);
        ids.forEach((id, index) => {
          if (fields[index]) nextSnapshot.set(id, fields[index]);
        });
        return { ...state, snapshot: nextSnapshot };
      });
    },
    [fieldDragState, fieldIdsByRowId]
  );

  const addFieldToRow = useCallback(
    (displayIndex: number, field: TemplateBuilderField) => {
      const builderIndex = resolveBuilderRowIndex(displayIndex);
      const rowId = rowIds[displayIndex];
      const newFieldId = createRowId();

      setBuilderTemplate((prev) => {
        const nextRows = prev.rows.map((row, index) =>
          index === builderIndex ? [...row, createTemplateRowField(field)] : row
        );
        const fieldIndex = nextRows[builderIndex].length - 1;
        queueMicrotask(() => setSelectedField({ rowIndex: displayIndex, fieldIndex }));
        syncFieldSnapshot(rowId, nextRows[builderIndex]);
        return { ...prev, rows: nextRows };
      });

      setFieldIdsByRowId((prev) => ({
        ...prev,
        [rowId]: [...(prev[rowId] ?? []), newFieldId],
      }));
    },
    [resolveBuilderRowIndex, rowIds, syncFieldSnapshot]
  );

  const removeFieldFromRow = useCallback(
    (displayIndex: number, fieldIndex: number) => {
      const rowId = rowIds[displayIndex];
      const fieldIds = fieldIdsByRowId[rowId] ?? [];

      if (fieldIds.length === 1) {
        if (rowIds.length > 1) {
          removeRow(displayIndex);
          return;
        }

        const builderIndex = resolveBuilderRowIndex(displayIndex);
        setBuilderTemplate((prev) => {
          const nextRows = prev.rows.map((row, index) =>
            index === builderIndex ? [createTemplateRowField('text')] : row
          );
          syncFieldSnapshot(rowId, nextRows[builderIndex]);
          return { ...prev, rows: nextRows };
        });

        const newFieldId = createRowId();
        setFieldIdsByRowId((prev) => ({
          ...prev,
          [rowId]: [newFieldId],
        }));
        setSelectedField(null);
        return;
      }

      const builderIndex = resolveBuilderRowIndex(displayIndex);

      setBuilderTemplate((prev) => {
        const nextRows = prev.rows.map((row, index) => {
          if (index !== builderIndex) return row;
          return row.filter((_, i) => i !== fieldIndex);
        });
        syncFieldSnapshot(rowId, nextRows[builderIndex]);
        return { ...prev, rows: nextRows };
      });

      setFieldIdsByRowId((prev) => ({
        ...prev,
        [rowId]: fieldIds.filter((_, index) => index !== fieldIndex),
      }));

      setSelectedField((current) => {
        if (!current) return null;
        if (current.rowIndex !== displayIndex) return current;
        if (current.fieldIndex === fieldIndex) return null;
        if (current.fieldIndex > fieldIndex) {
          return { rowIndex: displayIndex, fieldIndex: current.fieldIndex - 1 };
        }
        return current;
      });
    },
    [resolveBuilderRowIndex, rowIds, fieldIdsByRowId, syncFieldSnapshot, removeRow]
  );

  const updateSelectedFieldText = useCallback(
    (patch: Partial<TemplateTextConfig>) => {
      if (!selectedField) return;
      const builderRowIndex = resolveBuilderRowIndex(selectedField.rowIndex);
      const rowId = rowIds[selectedField.rowIndex];

      setBuilderTemplate((prev) => {
        const nextRows = prev.rows.map((row, rowIndex) =>
          rowIndex !== builderRowIndex
            ? row
            : row.map((field, fieldIndex) =>
                fieldIndex !== selectedField.fieldIndex
                  ? field
                  : {
                      ...field,
                      text: applyFieldTextPatch(
                        field.text,
                        patch,
                        prev.config.text
                      ),
                    }
              )
        );
        syncFieldSnapshot(rowId, nextRows[builderRowIndex]);
        return { ...prev, rows: nextRows };
      });
    },
    [selectedField, resolveBuilderRowIndex, rowIds, syncFieldSnapshot]
  );

  const resetSelectedFieldText = useCallback(() => {
    if (!selectedField) return;
    const builderRowIndex = resolveBuilderRowIndex(selectedField.rowIndex);
    const rowId = rowIds[selectedField.rowIndex];

    setBuilderTemplate((prev) => {
      const nextRows = prev.rows.map((row, rowIndex) =>
        rowIndex !== builderRowIndex
          ? row
          : row.map((field, fieldIndex) =>
              fieldIndex !== selectedField.fieldIndex
                ? field
                : { ...field, text: {} }
            )
      );
      syncFieldSnapshot(rowId, nextRows[builderRowIndex]);
      return { ...prev, rows: nextRows };
    });
  }, [selectedField, resolveBuilderRowIndex, rowIds, syncFieldSnapshot]);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          >
            <Link to="/templates">
              <ArrowLeft className="size-4" />
              {t('templateEditor.backToTemplates')}
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t('templateEditor.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('templateEditor.subtitle')}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:min-w-[14rem] sm:max-w-md">
            <Label
              htmlFor="template-name"
              className="shrink-0 text-sm font-medium text-muted-foreground"
            >
              {t('templateEditor.templateName')}
            </Label>
            <Input
              id="template-name"
              value={builderTemplate.name}
              onChange={(e) =>
                setBuilderTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t('templateEditor.untitled')}
              className="h-9 min-w-0 flex-1 rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          {showSavedButton ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled
              className="h-9 shrink-0 gap-1.5"
            >
              <Check className="size-3.5" />
              {t('templateEditor.saved')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onSaveTemplate}
              className="h-9 shrink-0 gap-1.5"
            >
              <Save className="size-3.5" />
              {t('templateEditor.save')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <section
          className="order-2 w-full min-w-0 lg:order-1 lg:max-h-[calc(100vh-7rem)] lg:w-[min(100%,28rem)] lg:shrink-0 lg:overflow-y-auto lg:pr-1"
          aria-labelledby="template-rows-heading"
        >
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="template-rows-heading"
                  className="text-sm font-semibold tracking-tight"
                >
                  {t('templateEditor.sections.rows')}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t('templateEditor.rowsHint')}
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={addRow}>
                <Plus className="size-3.5" />
                {t('templateEditor.addRow')}
              </Button>
            </div>

            <div className="space-y-3">
              <TemplateSortableRowsList
                rowIds={rowIds}
                rows={displayRows}
                onReorderIds={handleReorderRowIds}
                onRowDragStart={handleRowDragStart}
                onRowDragEnd={commitRowOrder}
                onRowDragCancel={cancelRowDrag}
                getFieldIds={getFieldIds}
                getRowFields={getRowFields}
                canDragFields={canDragFields}
                onFieldDragOver={handleFieldDragOver}
                onFieldDragStart={handleFieldDragStart}
                onFieldDragEnd={finalizeAndCommitFieldDrag}
                onFieldDragCancel={cancelFieldDrag}
                findRowIdForFieldId={findRowIdForFieldId}
                rowBlockProps={{
                  selectedField,
                  onSelectField: (rowIndex, fieldIndex) =>
                    setSelectedField((current) =>
                      current?.rowIndex === rowIndex &&
                      current.fieldIndex === fieldIndex
                        ? null
                        : { rowIndex, fieldIndex }
                    ),
                  onAddField: addFieldToRow,
                  onRemoveRow: removeRow,
                  onRemoveField: removeFieldFromRow,
                  builderFieldLabel,
                }}
              />
            </div>
          </div>
        </section>

        <div
          className="order-1 flex min-w-0 flex-1 flex-col gap-4 lg:order-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          <PreviewPanel
            resolvedHtml={resolvedHtml}
            onCopy={copyPreviewAsRichHtml}
            copied={copiedPreview}
            iframeRef={previewIframeRef}
            className="shrink-0"
          />

          <section
            className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5"
            aria-labelledby={
              selectedRowField && selectedField
                ? 'template-field-style-heading'
                : 'template-attributes-heading'
            }
          >
            {selectedRowField && selectedField ? (
              <TemplateFieldStylePanel
                field={selectedRowField}
                rowNumber={selectedField.rowIndex + 1}
                fieldName={builderFieldLabel(selectedRowField.label)}
                templateText={builderTemplate.config.text}
                onBack={() => setSelectedField(null)}
                onReset={resetSelectedFieldText}
                onUpdateText={updateSelectedFieldText}
              />
            ) : (
              <>
            <div className="mb-5">
              <h2
                id="template-attributes-heading"
                className="text-sm font-semibold tracking-tight"
              >
                {t('templateEditor.sections.attributes')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('templateEditor.attributesHint')}
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-6">
                  <div className="space-y-2 sm:col-span-3">
                    <Label htmlFor="image-url" className="text-sm font-medium">
                      {t('templateEditor.image')}
                    </Label>
                    <Input
                      id="image-url"
                      value={builderTemplate.config.image.url}
                      onChange={(e) =>
                        setBuilderTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            image: { ...prev.config.image, url: e.target.value },
                          },
                        }))
                      }
                      placeholder={t('templateEditor.imageUrlPlaceholder')}
                    />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="image-placement" className="text-sm font-medium">
                      {t('templateEditor.imagePlacementShort')}
                    </Label>
                    <Select
                      value={builderTemplate.config.image.placement}
                      onValueChange={(value) =>
                        setBuilderTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            image: {
                              ...prev.config.image,
                              placement: value as NewTemplate['config']['image']['placement'],
                            },
                          },
                        }))
                      }
                    >
                      <SelectTrigger id="image-placement" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_PLACEMENTS.map((placement) => (
                          <SelectItem key={placement} value={placement}>
                            {t(`templateEditor.placement.${placement}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="image-shape" className="text-sm font-medium">
                      {t('templateEditor.imageShapeShort')}
                    </Label>
                    <Select
                      value={builderTemplate.config.image.shape}
                      onValueChange={(value) =>
                        setBuilderTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            image: {
                              ...prev.config.image,
                              shape: value as NewTemplate['config']['image']['shape'],
                            },
                          },
                        }))
                      }
                    >
                      <SelectTrigger id="image-shape" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_SHAPES.map((shape) => (
                          <SelectItem key={shape} value={shape}>
                            {t(`templateEditor.shape.${shape}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="image-size" className="text-sm font-medium">
                      {t('templateEditor.imageSizeShort')}
                    </Label>
                    <Select
                      value={builderTemplate.config.image.size}
                      onValueChange={(value) =>
                        setBuilderTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            image: {
                              ...prev.config.image,
                              size: value as NewTemplate['config']['image']['size'],
                            },
                          },
                        }))
                      }
                    >
                      <SelectTrigger id="image-size" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {t(`templateEditor.size.${size}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="text-font" className="text-sm font-medium">
                      {t('templateEditor.textFont')}
                    </Label>
                    <Input
                      id="text-font"
                      value={builderTemplate.config.text.font}
                      onChange={(e) =>
                        setBuilderTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            text: { ...prev.config.text, font: e.target.value },
                          },
                        }))
                      }
                      placeholder={t('templateEditor.textFontPlaceholder')}
                    />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="text-shape" className="text-sm font-medium">
                      {t('templateEditor.textStyle')}
                    </Label>
                    <Select
                      value={builderTemplate.config.text.shape}
                      onValueChange={(value) =>
                        setBuilderTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            text: {
                              ...prev.config.text,
                              shape: value as NewTemplate['config']['text']['shape'],
                            },
                          },
                        }))
                      }
                    >
                      <SelectTrigger id="text-shape" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEXT_SHAPES.map((shape) => (
                          <SelectItem key={shape} value={shape}>
                            {t(`templateEditor.textShape.${shape}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="text-size" className="text-sm font-medium">
                      {t('templateEditor.textSize')}
                    </Label>
                    <Select
                      value={builderTemplate.config.text.size}
                      onValueChange={(value) =>
                        setBuilderTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            text: {
                              ...prev.config.text,
                              size: value as NewTemplate['config']['text']['size'],
                            },
                          },
                        }))
                      }
                    >
                      <SelectTrigger id="text-size" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {t(`templateEditor.size.${size}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color-light" className="text-sm font-medium">
                    {t('templateEditor.textColorLight')}
                  </Label>
                  <ColorInput
                    id="text-color-light"
                    value={builderTemplate.config.text.color}
                    onChange={(e) =>
                      setBuilderTemplate((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          text: { ...prev.config.text, color: e.target.value },
                        },
                      }))
                    }
                    placeholder={t('templateEditor.textColorLightPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color-dark" className="text-sm font-medium">
                    {t('templateEditor.textColorDark')}
                  </Label>
                  <ColorInput
                    id="text-color-dark"
                    value={builderTemplate.config.text.colorDark}
                    onChange={(e) =>
                      setBuilderTemplate((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          text: {
                            ...prev.config.text,
                            colorDark: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={t('templateEditor.textColorDarkPlaceholder')}
                  />
                </div>
              </div>
            </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
