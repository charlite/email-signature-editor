import {
  DEFAULT_NEW_TEMPLATE,
  DEFAULT_HYPERLINK_COLOR,
  TEMPLATE_BUILDER_FIELDS,
  isHyperlinkFieldLabel,
  type TemplateBuilderField,
  type TemplateRowField,
  type TemplateRows,
  type TemplateSize,
  type TemplateTextConfig,
} from '@/types/types';

const TEXT_SIZE_ORDER: TemplateSize[] = ['xs', 'sm', 'md', 'lg'];

function bumpTextSize(size: TemplateSize, delta: number): TemplateSize {
  const index = TEXT_SIZE_ORDER.indexOf(size);
  const nextIndex = Math.max(0, Math.min(TEXT_SIZE_ORDER.length - 1, index + delta));
  return TEXT_SIZE_ORDER[nextIndex];
}

export function normalizeTextShape(shape: unknown): TemplateTextConfig['shape'] {
  if (shape === 'normal' || shape === 'bold' || shape === 'italic') {
    return shape;
  }
  if (shape === 'uppercase') {
    return 'bold';
  }
  return 'normal';
}

export function normalizeTemplateTextConfig(
  text: Partial<TemplateTextConfig> | undefined,
  defaultText: TemplateTextConfig
): TemplateTextConfig {
  return {
    font: text?.font ?? defaultText.font,
    color: text?.color ?? defaultText.color,
    colorDark: text?.colorDark ?? defaultText.colorDark,
    size: text?.size ?? defaultText.size,
    shape: normalizeTextShape(text?.shape ?? defaultText.shape),
  };
}

export function resolveFieldText(
  field: TemplateRowField,
  templateText: TemplateTextConfig
): TemplateTextConfig {
  return normalizeTemplateTextConfig(field.text, templateText);
}

function toTextOverrides(
  text: Partial<TemplateTextConfig> | undefined,
  templateText: TemplateTextConfig
): Partial<TemplateTextConfig> {
  const resolved = normalizeTemplateTextConfig(text, templateText);
  const overrides: Partial<TemplateTextConfig> = {};

  if (resolved.font !== templateText.font) overrides.font = resolved.font;
  if (resolved.color !== templateText.color) overrides.color = resolved.color;
  if (resolved.colorDark !== templateText.colorDark) {
    overrides.colorDark = resolved.colorDark;
  }
  if (resolved.size !== templateText.size) overrides.size = resolved.size;
  if (resolved.shape !== templateText.shape) overrides.shape = resolved.shape;

  return overrides;
}

export function applyFieldTextPatch(
  current: Partial<TemplateTextConfig>,
  patch: Partial<TemplateTextConfig>,
  templateText: TemplateTextConfig
): Partial<TemplateTextConfig> {
  const next: Partial<TemplateTextConfig> = { ...current };

  if ('font' in patch) {
    if (patch.font === undefined || patch.font === templateText.font) {
      delete next.font;
    } else {
      next.font = patch.font;
    }
  }

  if ('color' in patch) {
    if (patch.color === undefined || patch.color === templateText.color) {
      delete next.color;
    } else {
      next.color = patch.color;
    }
  }

  if ('colorDark' in patch) {
    if (
      patch.colorDark === undefined ||
      patch.colorDark === templateText.colorDark
    ) {
      delete next.colorDark;
    } else {
      next.colorDark = patch.colorDark;
    }
  }

  if ('size' in patch) {
    if (patch.size === undefined || patch.size === templateText.size) {
      delete next.size;
    } else {
      next.size = patch.size;
    }
  }

  if ('shape' in patch) {
    if (patch.shape === undefined || patch.shape === templateText.shape) {
      delete next.shape;
    } else {
      next.shape = patch.shape;
    }
  }

  return next;
}

function createDefaultTemplateRowField(
  label: TemplateBuilderField,
  boldLabels: ReadonlySet<TemplateBuilderField>,
  defaultColorLabels: ReadonlySet<TemplateBuilderField>,
  baseTextSize: TemplateSize,
  largerSizeLabels: ReadonlySet<TemplateBuilderField>,
  smallerSizeLabels: ReadonlySet<TemplateBuilderField>
): TemplateRowField {
  const text: Partial<TemplateTextConfig> = {};

  if (isHyperlinkFieldLabel(label) && !defaultColorLabels.has(label)) {
    text.color = DEFAULT_HYPERLINK_COLOR;
  }
  if (boldLabels.has(label)) {
    text.shape = 'bold';
  }
  if (largerSizeLabels.has(label)) {
    text.size = bumpTextSize(baseTextSize, 1);
  } else if (smallerSizeLabels.has(label)) {
    text.size = bumpTextSize(baseTextSize, -1);
  }

  return { label, text };
}

export function createTemplateRowField(label: TemplateBuilderField): TemplateRowField {
  return createDefaultTemplateRowField(
    label,
    new Set(),
    new Set(),
    'md',
    new Set(),
    new Set()
  );
}

export function cloneTemplateRows(rows: TemplateRows): TemplateRows {
  return rows.map((row) =>
    row.map((field) => ({
      label: field.label,
      text: { ...field.text },
    }))
  );
}

export function buildTemplateRows(
  spec: TemplateBuilderField[][],
  options?: {
    boldLabels?: TemplateBuilderField[];
    defaultColorLabels?: TemplateBuilderField[];
    baseTextSize?: TemplateSize;
    largerSizeLabels?: TemplateBuilderField[];
    smallerSizeLabels?: TemplateBuilderField[];
  }
): TemplateRows {
  const boldLabels = new Set(options?.boldLabels ?? []);
  const defaultColorLabels = new Set(options?.defaultColorLabels ?? []);
  const baseTextSize = options?.baseTextSize ?? 'md';
  const largerSizeLabels = new Set(options?.largerSizeLabels ?? []);
  const smallerSizeLabels = new Set(options?.smallerSizeLabels ?? []);

  return spec.map((row) =>
    row.map((label) =>
      createDefaultTemplateRowField(
        label,
        boldLabels,
        defaultColorLabels,
        baseTextSize,
        largerSizeLabels,
        smallerSizeLabels
      )
    )
  );
}

function isTemplateBuilderField(value: unknown): value is TemplateBuilderField {
  return (
    typeof value === 'string' &&
    TEMPLATE_BUILDER_FIELDS.includes(value as TemplateBuilderField)
  );
}

export function normalizeTemplateRowField(
  item: unknown,
  defaultText: TemplateTextConfig
): TemplateRowField {
  if (isTemplateBuilderField(item)) {
    return createTemplateRowField(item);
  }

  if (typeof item === 'object' && item !== null && 'label' in item) {
    const record = item as {
      label?: unknown;
      text?: Partial<TemplateTextConfig>;
    };
    const label = isTemplateBuilderField(record.label) ? record.label : 'text';

    return {
      label,
      text: toTextOverrides(record.text, defaultText),
    };
  }

  return createTemplateRowField('text');
}

export function normalizeTemplateRows(
  rows: unknown,
  defaultText: TemplateTextConfig = DEFAULT_NEW_TEMPLATE.config.text
): TemplateRows {
  if (!Array.isArray(rows)) {
    return cloneTemplateRows(DEFAULT_NEW_TEMPLATE.rows);
  }

  const normalized = rows
    .map((row) => {
      if (!Array.isArray(row)) return [];
      return row.map((item) => normalizeTemplateRowField(item, defaultText));
    })
    .filter((row) => row.length > 0);

  return normalized.length > 0
    ? normalized
    : cloneTemplateRows(DEFAULT_NEW_TEMPLATE.rows);
}

export function isRowFieldTextCustomized(field: TemplateRowField): boolean {
  return Object.keys(field.text).length > 0;
}

export function isRowFieldTextPropertyCustomized(
  field: TemplateRowField,
  key: keyof TemplateTextConfig
): boolean {
  return field.text[key] !== undefined;
}

export const TEMPLATE_TEXT_DEFAULT_OPTION = '__template_default__';
