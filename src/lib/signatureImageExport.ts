import { toCanvas } from 'html-to-image';
import {
  type SignaturePreviewTheme,
  wrapSignatureHtmlForPreview,
} from '@/lib/signaturePreviewDocument';
import { inlineImagesForExport } from '@/lib/exportImageEmbed';
import {
  buildSignaturePreviewSrcDoc,
  SIGNATURE_PREVIEW_MAX_WIDTH,
  measureSignaturePreviewSize,
} from './signaturePreviewIframe';

export type SignatureImageFormat = 'png' | 'jpeg' | 'webp';

const IMAGE_LOAD_TIMEOUT_MS = 4_000;
const SIGNATURE_ROOT_ID = 'email-signature-root';
/** CSS pixels of inset around the signature in exported images. */
const EXPORT_IMAGE_PADDING_PX = 16;
const EXPORT_CAPTURE_PIXEL_RATIO = 2;

const EXPORT_HOST_STYLES =
  'position:fixed;left:0;top:0;z-index:-1;margin:0;padding:0;opacity:0;pointer-events:none;width:max-content;height:max-content;overflow:hidden;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;background:transparent;';

const EXPORT_IFRAME_STYLES =
  'position:fixed;left:0;top:0;z-index:-1;border:0;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';

function captureOptionsForTheme(
  theme: SignaturePreviewTheme,
  size?: { width: number; height: number }
) {
  return {
    cacheBust: false,
    backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
    pixelRatio: EXPORT_CAPTURE_PIXEL_RATIO,
    skipFonts: true,
    onImageErrorHandler: () => undefined,
    ...(size
      ? { width: size.width, height: size.height, canvasWidth: size.width, canvasHeight: size.height }
      : {}),
  };
}

function extractBodyHtmlFromPreviewDocument(markup: string): string {
  const match = markup.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match?.[1]?.trim() ?? markup;
}

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

async function prepareImagesForExport(root: ParentNode): Promise<void> {
  await inlineImagesForExport(root, waitForOneImage, IMAGE_LOAD_TIMEOUT_MS);
}

function waitForOneImage(image: HTMLImageElement, timeoutMs: number): Promise<void> {
  if (image.complete) return Promise.resolve();

  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, timeoutMs);
    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };
    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
  });
}

function waitForImages(root: ParentNode, timeoutMs = IMAGE_LOAD_TIMEOUT_MS): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(images.map((image) => waitForOneImage(image, timeoutMs))).then(
    () => undefined
  );
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
  const signatureRoot = root.querySelector(`#${SIGNATURE_ROOT_ID}`);
  if (signatureRoot instanceof HTMLElement) return signatureRoot;

  const table = root.querySelector('table');
  return (table as HTMLElement | null) ?? (root as HTMLElement);
}

function measureCaptureSize(node: HTMLElement): { width: number; height: number } {
  const rect = node.getBoundingClientRect();
  const width = Math.ceil(Math.max(node.scrollWidth, rect.width, 1));
  const height = Math.ceil(Math.max(node.scrollHeight, rect.height, 1));
  return { width, height };
}

async function createExportTargetFromPreviewIframe(
  iframe: HTMLIFrameElement
): Promise<{
  node: HTMLElement;
  size: { width: number; height: number };
  cleanup: () => void;
} | null> {
  const doc = iframe.contentDocument;
  if (!doc?.body) return null;

  const node = getCaptureNode(doc.body);
  if (!node.isConnected) return null;

  await prepareImagesForExport(doc);
  await waitForImages(doc);
  await waitForLayout();

  const size = measureCaptureSize(node);
  if (size.width <= 1 && size.height <= 1) return null;

  return { node, size, cleanup: () => undefined };
}

async function createExportHost(
  html: string,
  theme: SignaturePreviewTheme
): Promise<{
  node: HTMLElement;
  size: { width: number; height: number };
  cleanup: () => void;
}> {
  const host = document.createElement('div');
  host.style.cssText = EXPORT_HOST_STYLES;
  host.style.colorScheme = theme;
  host.innerHTML = extractBodyHtmlFromPreviewDocument(
    wrapSignatureHtmlForPreview(html, theme)
  );
  document.body.appendChild(host);

  await prepareImagesForExport(host);
  await waitForImages(host);
  await waitForLayout();

  const node = getCaptureNode(host);
  const size = measureCaptureSize(node);

  return {
    node,
    size,
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
  size: { width: number; height: number };
  cleanup: () => void;
}> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = EXPORT_IFRAME_STYLES;
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
  await prepareImagesForExport(doc);
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

  const captureNode = getCaptureNode(doc.body);
  const size = measureCaptureSize(captureNode);

  return {
    node: captureNode,
    size,
    cleanup: () => {
      document.body.removeChild(iframe);
    },
  };
}

function canvasWithExportPadding(
  content: HTMLCanvasElement,
  theme: SignaturePreviewTheme
): HTMLCanvasElement {
  const pad = EXPORT_IMAGE_PADDING_PX * EXPORT_CAPTURE_PIXEL_RATIO;
  const padded = document.createElement('canvas');
  padded.width = content.width + pad * 2;
  padded.height = content.height + pad * 2;

  const ctx = padded.getContext('2d');
  if (!ctx) return content;

  ctx.fillStyle = theme === 'dark' ? '#18181b' : '#ffffff';
  ctx.fillRect(0, 0, padded.width, padded.height);
  ctx.drawImage(content, pad, pad);

  return padded;
}

async function nodeToBlob(
  node: HTMLElement,
  format: SignatureImageFormat,
  theme: SignaturePreviewTheme,
  size?: { width: number; height: number }
): Promise<Blob> {
  const contentCanvas = await toCanvas(node, captureOptionsForTheme(theme, size));
  const canvas = canvasWithExportPadding(contentCanvas, theme);

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
  theme: SignaturePreviewTheme = 'light',
  previewIframe?: HTMLIFrameElement | null
): Promise<Blob> {
  const strategies: Array<() => Promise<{
    node: HTMLElement;
    size: { width: number; height: number };
    cleanup: () => void;
  } | null>> = [];

  if (previewIframe) {
    strategies.push(() => createExportTargetFromPreviewIframe(previewIframe));
  }
  strategies.push(() => createExportIframe(html, theme));
  strategies.push(() => createExportHost(html, theme));

  let lastError: unknown;
  for (const createTarget of strategies) {
    const target = await createTarget();
    if (!target) continue;

    try {
      return await nodeToBlob(target.node, format, theme, target.size);
    } catch (error) {
      lastError = error;
    } finally {
      target.cleanup();
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to export signature image');
}

export function triggerSignatureImageDownload(
  blob: Blob,
  fileName: string,
  format: SignatureImageFormat
): void {
  const downloadName = suggestedSignatureImageName(fileName, format);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = downloadName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function downloadSignatureImage(
  html: string,
  format: SignatureImageFormat,
  fileName: string,
  theme: SignaturePreviewTheme = 'light',
  previewIframe?: HTMLIFrameElement | null
): Promise<void> {
  const blob = await generateSignatureImageBlob(
    html,
    format,
    theme,
    previewIframe
  );
  triggerSignatureImageDownload(blob, fileName, format);
}
