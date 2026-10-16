import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppPreviewTheme } from '@/hooks/useAppPreviewTheme';
import { useSyncSignaturePreviewIframeDoc } from '@/hooks/useSyncSignaturePreviewIframeDoc';
import { measureSignatureIntrinsicSize } from '@/lib/signaturePreviewIframe';
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
  const previewTheme = useAppPreviewTheme();

  const autoResize = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return;
    try {
      const { height } = measureSignatureIntrinsicSize(doc, iframe);
      iframe.style.height = `${height}px`;
    } catch {
      // cross-origin safety
    }
  }, [iframeRef]);

  useSyncSignaturePreviewIframeDoc(iframeRef, resolvedHtml, previewTheme, autoResize);

  useEffect(() => {
    const timer = window.setTimeout(autoResize, 50);
    return () => window.clearTimeout(timer);
  }, [resolvedHtml, autoResize]);

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm',
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
      <div className="overflow-auto px-4 pt-4 sm:px-5 sm:pt-5">
        <iframe
          ref={iframeRef}
          title={t('templateEditor.previewTitle')}
          className="mx-auto block w-full max-w-2xl border-0 bg-transparent"
          onLoad={autoResize}
          style={{ colorScheme: previewTheme === 'dark' ? 'dark' : 'light' }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
