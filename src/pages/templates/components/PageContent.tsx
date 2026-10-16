import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyPlus, LayoutTemplate, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LibraryCard } from '@/components/ui/LibraryCard';
import { SignaturePreviewIframe } from '@/components/SignaturePreviewIframe';
import { resolveTemplateFromSchema } from '@/lib/templates';
import type { SavedTemplate } from '@/lib/savedTemplates';
import type { NewTemplate } from '@/types/types';
import { DEFAULT_SIGNATURE_VALUES } from '@/types/types';
import { cn } from '@/lib/utils';

interface PageContentProps {
  defaultTemplates: NewTemplate[];
  savedTemplates: SavedTemplate[];
  onOpenTemplate: (id: string) => void;
  onDuplicateTemplate: (id: string) => void;
  onDeleteSaved: (id: string) => void;
}

function SectionShell({
  title,
  description,
  count,
  children,
  className,
}: {
  title: string;
  description?: string;
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border/80 bg-card/40 p-5 shadow-sm backdrop-blur-sm sm:p-6',
        className
      )}
    >
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {count !== undefined ? (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function PageContent({
  defaultTemplates,
  savedTemplates,
  onOpenTemplate,
  onDuplicateTemplate,
  onDeleteSaved,
}: PageContentProps) {
  const { t } = useTranslation();

  const renderTemplateCard = (
    item: NewTemplate | SavedTemplate,
    isBuiltin: boolean
  ) => {
    const html = resolveTemplateFromSchema(item, DEFAULT_SIGNATURE_VALUES);
    const title = item.name?.trim() || t('templates.untitled');

    return (
      <LibraryCard
        key={item.id}
        content={<SignaturePreviewIframe html={html} title={title} />}
        title={title}
        subtitle={
          isBuiltin
            ? undefined
            : new Date((item as SavedTemplate).createdAt).toLocaleString()
        }
        badge={
          isBuiltin ? (
            <span
              className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground"
            >
              {t('templates.builtinBadge')}
            </span>
          ) : null
        }
        footerActions={
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 bg-background/80"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateTemplate(item.id);
              }}
            >
              <CopyPlus className="size-3.5" />
              {t('templates.duplicate')}
            </Button>
            {!isBuiltin ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={t('templates.delete')}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSaved(item.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        }
        onClick={() => onOpenTemplate(item.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenTemplate(item.id);
          }
        }}
      />
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 py-2 sm:py-4">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <LayoutTemplate className="size-3.5" />
          {t('templates.heroTag')}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('templates.libraryTitle')}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t('templates.librarySubtitle')}
          </p>
        </div>
      </header>

      <SectionShell
        title={t('templates.defaultSection')}
        description={t('templates.defaultSectionHint')}
        count={defaultTemplates.length}
      >
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {defaultTemplates.map((item) => renderTemplateCard(item, true))}
        </ul>
        <p className="mt-4 text-center text-xs text-muted-foreground sm:text-left">
          {t('templates.cardHint')}
        </p>
      </SectionShell>

      <SectionShell
        title={t('templates.savedSection')}
        description={t('templates.savedSectionHint')}
        count={savedTemplates.length}
      >
        {savedTemplates.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Sparkles className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('templates.noSaved')}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t('templates.emptyStateDescription')}
              </p>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {savedTemplates.map((item) => renderTemplateCard(item, false))}
          </ul>
        )}
      </SectionShell>
    </div>
  );
}
