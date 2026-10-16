import { type RefObject, useLayoutEffect } from 'react';
import {
  type SignaturePreviewTheme,
  wrapSignatureHtmlForPreview,
} from '@/lib/signaturePreviewDocument';

/** Write preview HTML before paint so theme toggles stay in sync with the app surface. */
export function useSyncSignaturePreviewIframeDoc(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  html: string,
  theme: SignaturePreviewTheme,
  onUpdated?: () => void
) {
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const markup = wrapSignatureHtmlForPreview(html, theme);
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(markup);
    doc.close();
    onUpdated?.();
  }, [iframeRef, html, theme, onUpdated]);
}
