import type { NewTemplate } from '@/types/types';

/** Stable JSON for comparing template editor state (ignores transient ids). */
export function serializeTemplateEditorState(
  template: NewTemplate,
  html: string
): string {
  return JSON.stringify({
    name: template.name,
    config: template.config,
    rows: template.rows,
    html,
  });
}

export function isSavedCustomTemplateId(
  templateId: string,
  savedTemplateIds: readonly string[]
): boolean {
  return savedTemplateIds.includes(templateId);
}
