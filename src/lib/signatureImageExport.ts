import { toCanvas } from 'html-to-image';
import type { SignaturePreviewTheme } from '@/lib/signaturePreviewDocument';
import {
  buildSignaturePreviewSrcDoc,
  SIGNATURE_PREVIEW_MAX_WIDTH,
  measureSignaturePreviewSize,
} from './signaturePreviewIframe';

export type SignatureImageFormat = 'png' | 'jpeg' | 'webp';

const CAPTURE_OPTIONS = {
  cacheBust: true,
  backgroundColor: '#ffffff',
  pixelRatio: 2,
  skipFonts: true,
} as const;

const EXPORT_HOST_STYLES =
  'position:fixed;left:-10000px;top:0;margin:0;padding:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;background:#ffffff;';

let webpExportSupported: boolean | null = null;

export function isWebpExportSupported(): boolean {
  if (webpExportSupported !== null) return webpExportSupported;
  const canvas = document.createElement('canvas');
  webpExportSupported = canvas
    .toDataURL('image/webp')
    .startsWith('data:image/webp');
  return webpExportSupported;
}

export function getSupportedSignatureImageFormats(): SignatureImageFormat[] {
  const formats: SignatureImageFormat[] = ['png', 'jpeg'];
  if (isWebpExportSupported()) formats.push('webp');
  return formats;
}

function mimeForFormat(format: SignatureImageFormat): string {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  return 'image/png';
}

function extensionForFormat(format: SignatureImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

export function sanitizeSignatureFileName(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'signature';
}

export function suggestedSignatureImageName(
  fileName: string,
  format: SignatureImageFormat
): string {
  return `${sanitizeSignatureFileName(fileName)}.${extensionForFormat(format)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        })
    )
  ).then(() => undefined);
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  if (iframe.contentDocument?.readyState === 'complete') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    iframe.addEventListener('load', () => resolve(), { once: true });
  });
}

function getCaptureNode(root: ParentNode): HTMLElement {
  const table = root.querySelector('table');
  return (table as HTMLElement | null) ?? (root as HTMLElement);
}

async function createExportHost(
  html: string,
  theme: SignaturePreviewTheme
): Promise<{
  node: HTMLElement;
  cleanup: () => void;
}> {
  const host = document.createElement('div');
  host.style.cssText = EXPORT_HOST_STYLES;
  host.style.colorScheme = theme;
  host.innerHTML = html;
  document.body.appendChild(host);

  await waitForImages(host);
  await waitForLayout();

  return {
    node: getCaptureNode(host),
    cleanup: () => {
      document.body.removeChild(host);
    },
  };
}

async function createExportIframe(
  html: string,
  theme: SignaturePreviewTheme
): Promise<{
  node: HTMLElement;
  cleanup: () => void;
}> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;border:0;visibility:hidden';
  iframe.setAttribute('sandbox', 'allow-same-origin');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create export iframe');
  }

  doc.open();
  doc.write(buildSignaturePreviewSrcDoc(html, theme));
  doc.close();

  await waitForIframeLoad(iframe);
  await waitForImages(doc);
  await waitForLayout();

  const { width, height } = measureSignaturePreviewSize(
    iframe,
    SIGNATURE_PREVIEW_MAX_WIDTH,
    { clampHeight: false, clampWidth: false }
  );
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  await waitForLayout();

  return {
    node: getCaptureNode(doc.body),
    cleanup: () => {
      document.body.removeChild(iframe);
    },
  };
}

async function captureForExport(
  html: string,
  theme: SignaturePreviewTheme
): Promise<{
  node: HTMLElement;
  cleanup: () => void;
}> {
  try {
    return await createExportHost(html, theme);
  } catch {
    return createExportIframe(html, theme);
  }
}

async function nodeToBlob(
  node: HTMLElement,
  format: SignatureImageFormat
): Promise<Blob> {
  const canvas = await toCanvas(node, CAPTURE_OPTIONS);

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('Export produced an empty image');
  }

  const mime = mimeForFormat(format);
  const quality = format === 'jpeg' || format === 'webp' ? 0.92 : undefined;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, quality);
  });

  if (!blob || blob.size === 0) {
    throw new Error(`Failed to export ${format.toUpperCase()}`);
  }

  return blob;
}

export async function generateSignatureImageBlob(
  html: string,
  format: SignatureImageFormat,
  theme: SignaturePreviewTheme = 'light'
): Promise<Blob> {
  const target = await captureForExport(html, theme);
  try {
    return await nodeToBlob(target.node, format);
  } finally {
    target.cleanup();
  }
}

/** Open synchronously inside a click handler to avoid popup blockers. */
export function openSignatureImageExportTab(): Window | null {
  return window.open('about:blank', '_blank');
}

function renderImageInExportTab(
  exportWindow: Window,
  blob: Blob,
  fileName: string,
  format: SignatureImageFormat
) {
  const url = URL.createObjectURL(blob);
  const downloadName = suggestedSignatureImageName(fileName, format);
  const safeTitle = escapeHtml(downloadName);
  const safeDownloadName = escapeHtml(downloadName);

  exportWindow.document.open();
  exportWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f4f4f5; color: #18181b; }
    main { max-width: 42rem; margin: 0 auto; padding: 1.5rem; }
    img { display: block; max-width: 100%; height: auto; background: #fff; border: 1px solid #e4e4e7; border-radius: 0.5rem; }
    p { margin: 1rem 0 0; font-size: 0.875rem; line-height: 1.5; color: #71717a; }
    a { color: #2563eb; text-decoration: underline; }
  </style>
</head>
<body>
  <main>
    <img src="${url}" alt="Signature export" />
    <p>Right-click the image and choose <strong>Save image as…</strong>, or <a href="${url}" download="${safeDownloadName}">download the file</a>.</p>
  </main>
</body>
</html>`);
  exportWindow.document.close();

  exportWindow.addEventListener(
    'beforeunload',
    () => {
      URL.revokeObjectURL(url);
    },
    { once: true }
  );
}

export async function downloadSignatureImage(
  html: string,
  format: SignatureImageFormat,
  fileName: string,
  exportWindow?: Window | null,
  theme: SignaturePreviewTheme = 'light'
): Promise<void> {
  if (!exportWindow || exportWindow.closed) {
    throw new Error(
      'Could not open export tab. Allow pop-ups for this site and try again.'
    );
  }

  exportWindow.document.open();
  exportWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Exporting…</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f4f4f5; color: #71717a; }
    main { display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 1.5rem; }
  </style>
</head>
<body>
  <main>Generating image…</main>
</body>
</html>`);
  exportWindow.document.close();

  const blob = await generateSignatureImageBlob(html, format, theme);

  if (exportWindow.closed) {
    throw new Error('Export tab was closed before the image finished generating.');
  }

  renderImageInExportTab(exportWindow, blob, fileName, format);
}
