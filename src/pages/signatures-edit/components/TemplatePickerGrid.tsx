import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { resolveTemplateFromSchema } from '@/lib/templates';
import { DEFAULT_SIGNATURE_VALUES } from '@/types/types';
import type { NewTemplate } from '@/types/types';
import { useAppPreviewTheme } from '@/hooks/useAppPreviewTheme';
import { useSyncSignaturePreviewIframeDoc } from '@/hooks/useSyncSignaturePreviewIframeDoc';

/** Renders signature HTML at 50% visual size (zoomed out) so cards stay compact. */
function TemplatePreviewFrame({ html }: { html: string }) {
  const previewTheme = useAppPreviewTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useSyncSignaturePreviewIframeDoc(iframeRef, html, previewTheme);

  return (
    <div className="relative h-[88px] w-full overflow-hidden border-b bg-transparent">
      <div className="pointer-events-none h-[176px] w-[200%] origin-top-left scale-50">
        <iframe
          ref={iframeRef}
          title=""
          className="block h-full w-full border-0 bg-transparent"
          style={{ colorScheme: previewTheme === 'dark' ? 'dark' : 'light' }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

interface TemplatePickerGridProps {
  templates: NewTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplatePickerGrid({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}: TemplatePickerGridProps) {
  const { t } = useTranslation();

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {templates.map((template) => {
        const html = resolveTemplateFromSchema(template, DEFAULT_SIGNATURE_VALUES);
        const isSelected = template.id === selectedTemplateId;
        return (
          <li key={template.id} className="min-w-0">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => onSelectTemplate(template.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTemplate(template.id);
                }
              }}
              className={`flex h-full cursor-pointer flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : ''
              }`}
            >
              <TemplatePreviewFrame html={html} />
              <CardContent className="p-2.5 sm:p-3">
                <p className="text-sm font-medium leading-tight">{template.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('signatures.templateTapHint')}
                </p>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
