import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppPreviewTheme } from '@/hooks/useAppPreviewTheme';
import { useSyncSignaturePreviewIframeDoc } from '@/hooks/useSyncSignaturePreviewIframeDoc';
import type { SignaturePreviewTheme } from '@/lib/signaturePreviewDocument';
import {
  SIGNATURE_PREVIEW_MAX_WIDTH,
  SIGNATURE_PREVIEW_MIN_WIDTH,
  SIGNATURE_PREVIEW_SLOT_HEIGHT,
  computeSignaturePreviewScale,
  measureSignatureIntrinsicSize,
} from '@/lib/signaturePreviewIframe';

/** Wide initial iframe for home previews until intrinsic size is measured (avoids clipping on first paint). */
const CONTENT_FIT_INITIAL_WIDTH = 960;
const CONTENT_FIT_INITIAL_HEIGHT = 280;

interface SignaturePreviewIframeProps {
  html: string;
  title: string;
  slotHeight?: number;
  /**
   * `content` — home marquee: full signature at natural size, no box clamp.
   * `container` — library cards: scale to fit the preview slot.
   */
  fit?: 'container' | 'content';
  className?: string;
  previewTheme?: SignaturePreviewTheme;
}

export const SignaturePreviewIframe = forwardRef<
  HTMLIFrameElement,
  SignaturePreviewIframeProps
>(function SignaturePreviewIframe(
  {
    html,
    title,
    slotHeight = SIGNATURE_PREVIEW_SLOT_HEIGHT,
    fit = 'container',
    className,
    previewTheme,
  },
  forwardedRef
) {
  const theme = useAppPreviewTheme(previewTheme);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const setIframeRef = useCallback(
    (node: HTMLIFrameElement | null) => {
      iframeRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );
  const [containerWidth, setContainerWidth] = useState(SIGNATURE_PREVIEW_MAX_WIDTH);
  const [previewLayout, setPreviewLayout] = useState({
    intrinsicWidth: SIGNATURE_PREVIEW_MIN_WIDTH,
    intrinsicHeight: 140,
    scale: 1,
    measured: false,
  });

  const resizePreview = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return;

    const intrinsic = measureSignatureIntrinsicSize(doc, iframe);

    if (fit === 'content') {
      setPreviewLayout({
        intrinsicWidth: intrinsic.width,
        intrinsicHeight: intrinsic.height,
        scale: 1,
        measured: true,
      });
      return;
    }

    const horizontalPadding = 32;
    const rawWidth = containerRef.current?.clientWidth ?? SIGNATURE_PREVIEW_MAX_WIDTH;
    const availableWidth = Math.max(
      Math.min(rawWidth, SIGNATURE_PREVIEW_MAX_WIDTH) - horizontalPadding,
      SIGNATURE_PREVIEW_MIN_WIDTH
    );

    const scale = computeSignaturePreviewScale(
      intrinsic.width,
      intrinsic.height,
      availableWidth,
      slotHeight
    );

    setPreviewLayout({
      intrinsicWidth: intrinsic.width,
      intrinsicHeight: intrinsic.height,
      scale,
      measured: true,
    });
  }, [fit, slotHeight]);

  useEffect(() => {
    if (fit !== 'container') return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      setContainerWidth(container.clientWidth);
    });
    observer.observe(container);
    setContainerWidth(container.clientWidth);

    return () => observer.disconnect();
  }, [fit]);

  useEffect(() => {
    if (fit === 'content') {
      setPreviewLayout((current) => ({ ...current, measured: false }));
    }
  }, [html, fit]);

  useSyncSignaturePreviewIframeDoc(iframeRef, html, theme, resizePreview);

  useEffect(() => {
    const timer = window.setTimeout(resizePreview, 50);
    return () => window.clearTimeout(timer);
  }, [
    html,
    fit === 'container' ? containerWidth : null,
    fit,
    resizePreview,
    slotHeight,
  ]);

  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const images = Array.from(doc.querySelectorAll('img'));
    images.forEach((image) => {
      image.addEventListener('load', resizePreview);
      image.addEventListener('error', resizePreview);
    });

    return () => {
      images.forEach((image) => {
        image.removeEventListener('load', resizePreview);
        image.removeEventListener('error', resizePreview);
      });
    };
  }, [html, theme, resizePreview]);

  const iframeColorScheme = theme === 'dark' ? 'dark' : 'light';

  if (fit === 'content') {
    return (
      <div
        className={cn('w-max shrink-0 overflow-visible bg-transparent', className)}
      >
        <iframe
          ref={setIframeRef}
          title={title}
          className="pointer-events-none block border-0 bg-transparent"
          onLoad={resizePreview}
          style={{
            colorScheme: iframeColorScheme,
            ...(previewLayout.measured
              ? {
                  width: previewLayout.intrinsicWidth,
                  height: previewLayout.intrinsicHeight,
                }
              : {
                  width: CONTENT_FIT_INITIAL_WIDTH,
                  height: CONTENT_FIT_INITIAL_HEIGHT,
                }),
          }}
          sandbox="allow-same-origin"
        />
      </div>
    );
  }

  const layoutWidth = Math.ceil(previewLayout.intrinsicWidth * previewLayout.scale);
  const layoutHeight = Math.ceil(previewLayout.intrinsicHeight * previewLayout.scale);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex w-full items-center justify-center overflow-hidden bg-transparent px-4',
        className
      )}
      style={{ height: slotHeight }}
    >
      <div
        className="relative shrink-0"
        style={{ width: layoutWidth, height: layoutHeight }}
      >
        <iframe
          ref={setIframeRef}
          title={title}
          className="pointer-events-none absolute left-0 top-0 block border-0 bg-transparent"
          onLoad={resizePreview}
          style={{
            colorScheme: iframeColorScheme,
            width: previewLayout.intrinsicWidth,
            height: previewLayout.intrinsicHeight,
            transform:
              previewLayout.scale === 1
                ? undefined
                : `scale(${previewLayout.scale})`,
            transformOrigin: 'top left',
          }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
});
