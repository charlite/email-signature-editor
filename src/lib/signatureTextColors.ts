import {
  DEFAULT_HYPERLINK_COLOR,
  DEFAULT_TEMPLATE_TEXT_CONFIG,
  isHyperlinkFieldLabel,
  type TemplateRowField,
  type TemplateTextConfig,
} from '@/types/types';
import { normalizeTemplateTextConfig } from '@/lib/templateRows';

export const DEFAULT_TEXT_COLOR_LIGHT = DEFAULT_TEMPLATE_TEXT_CONFIG.color;
export const DEFAULT_TEXT_COLOR_DARK = DEFAULT_TEMPLATE_TEXT_CONFIG.colorDark;
export const DEFAULT_HYPERLINK_COLOR_DARK = '#7CB8FF';

export function resolveFieldTextColors(
  field: TemplateRowField,
  templateText: TemplateTextConfig
): { light: string; dark: string } {
  const resolved = normalizeTemplateTextConfig(field.text, templateText);

  if (field.text.colorDark !== undefined) {
    return { light: resolved.color, dark: field.text.colorDark };
  }

  if (
    isHyperlinkFieldLabel(field.label) &&
    resolved.color === DEFAULT_HYPERLINK_COLOR &&
    field.text.color === undefined
  ) {
    return { light: DEFAULT_HYPERLINK_COLOR, dark: DEFAULT_HYPERLINK_COLOR_DARK };
  }

  if (
    isHyperlinkFieldLabel(field.label) &&
    field.text.color === DEFAULT_HYPERLINK_COLOR
  ) {
    return { light: DEFAULT_HYPERLINK_COLOR, dark: DEFAULT_HYPERLINK_COLOR_DARK };
  }

  return { light: resolved.color, dark: resolved.colorDark };
}

export function fieldNeedsDedicatedDarkRule(
  field: TemplateRowField,
  templateText: TemplateTextConfig
): boolean {
  const { light, dark } = resolveFieldTextColors(field, templateText);
  return (
    light !== templateText.color ||
    dark !== templateText.colorDark ||
    field.text.color !== undefined ||
    field.text.colorDark !== undefined
  );
}
