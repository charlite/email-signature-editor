import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  resolvedHtml: string;
  onCopy: () => void;
  copied: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  className?: string;
}

export function PreviewPanel({
  resolvedHtml,
  onCopy,
  copied,
  iframeRef,
  className,
}: PreviewPanelProps) {
  const { t } = useTranslation();

  const autoResize = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    try {
      const doc = iframe.contentDocument;
      const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
      iframe.style.height = `${Math.max(height, 120)}px`;
    } catch {
      // cross-origin safety
    }
  }, [iframeRef]);

  useEffect(() => {
    const timer = window.setTimeout(autoResize, 50);
    return () => window.clearTimeout(timer);
  }, [resolvedHtml, autoResize]);

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm',
        className
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Eye className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">
              {t('templateEditor.livePreview')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('templateEditor.livePreviewHint')}
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={onCopy}
          className="h-8 shrink-0 gap-1.5"
        >
          <Copy className="size-3.5" />
          {copied ? t('actions.copied') : t('signatures.copyForGmail')}
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 sm:p-6">
        <div
          className="preview-display mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border/50 shadow-inner"
        >
          <iframe
            ref={iframeRef}
            title={t('templateEditor.previewTitle')}
            className="block w-full border-0"
            onLoad={autoResize}
            srcDoc={
              '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;font-family:Arial,sans-serif;}</style></head><body>' +
              resolvedHtml +
              '</body></html>'
            }
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
