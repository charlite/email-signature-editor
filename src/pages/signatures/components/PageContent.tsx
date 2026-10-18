import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLinkedin } from 'react-icons/fa';
import { Copy, Import, Plus, Trash2 } from 'lucide-react';
import { LinkedInEnterpriseTooltip } from '@/components/LinkedInEnterpriseTooltip';
import { Button } from '@/components/ui/button';
import { LibraryCard } from '@/components/ui/LibraryCard';
import { SignatureExportButton } from '@/components/SignatureExportButton';
import { SignaturePreviewIframe } from '@/components/SignaturePreviewIframe';
import { resolveTemplateFromSchema } from '@/lib/templates';
import type { SavedSignature } from '@/lib/savedSignatures';
import { useUserContext } from '@/contexts/UserContext';
import { copyRichHtmlToClipboard } from '@/utils/utils';

interface PageContentProps {
  items: SavedSignature[];
  onCreateNew: () => void;
  onOpenSaved: (id: string) => void;
  onDeleteSaved: (id: string) => void;
}

export function PageContent({
  items,
  onCreateNew,
  onOpenSaved,
  onDeleteSaved,
}: PageContentProps) {
  const { t } = useTranslation();
  const { templates } = useUserContext();
  const previewIframeById = useRef(new Map<string, HTMLIFrameElement>());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t('signatures.libraryTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('signatures.librarySubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-1.5" onClick={onCreateNew}>
            <Plus className="size-3.5" />
            {t('signatures.newSignature')}
          </Button>
          <LinkedInEnterpriseTooltip>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled
            >
              <Import className="size-3.5" />
              <FaLinkedin className="size-3.5" />
              {t('signatures.importFromLinkedin')}
            </Button>
          </LinkedInEnterpriseTooltip>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t('signatures.noSaved')}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => {
            const template =
              templates.find((tmpl) => tmpl.id === item.templateId) ?? templates[0];
            if (!template) return null;
            const html = resolveTemplateFromSchema(template, item.values);
            const title =
              item.values.NAME?.trim() ||
              t('signatures.untitled', {
                date: new Date(item.createdAt).toLocaleDateString(),
              });

            return (
              <LibraryCard
                key={item.id}
                content={
                  <SignaturePreviewIframe
                    html={html}
                    title={title}
                    ref={(node) => {
                      if (node) previewIframeById.current.set(item.id, node);
                      else previewIframeById.current.delete(item.id);
                    }}
                  />
                }
                title={title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                footerActions={
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="gap-1.5"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await copyRichHtmlToClipboard(html);
                      }}
                    >
                      <Copy className="size-3.5" />
                      {t('signatures.copy')}
                    </Button>
                    <SignatureExportButton
                      html={html}
                      fileName={title}
                      getPreviewIframe={() =>
                        previewIframeById.current.get(item.id) ?? null
                      }
                      stopPropagation
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={t('signatures.delete')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSaved(item.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                }
                onClick={() => onOpenSaved(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenSaved(item.id);
                  }
                }}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
