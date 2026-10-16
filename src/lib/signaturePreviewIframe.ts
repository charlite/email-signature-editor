import {
  type SignaturePreviewTheme,
  wrapSignatureHtmlForPreview,
} from '@/lib/signaturePreviewDocument';

export const SIGNATURE_PREVIEW_MIN_WIDTH = 200;
export const SIGNATURE_PREVIEW_MAX_WIDTH = 560;
export const SIGNATURE_PREVIEW_MIN_HEIGHT = 72;
export const SIGNATURE_PREVIEW_MAX_HEIGHT = 240;
export const SIGNATURE_PREVIEW_SLOT_HEIGHT = SIGNATURE_PREVIEW_MAX_HEIGHT;

/** Layout width while measuring so inline rows stay on one line (content size only, not iframe width). */
const SIGNATURE_MEASURE_LAYOUT_WIDTH = 1600;
const SIGNATURE_PREVIEW_BODY_PADDING = 24;
/** Extra pixels so iframe viewport never clips subpixel / link underlines. */
const SIGNATURE_PREVIEW_SIZE_SLACK = 12;

const SIGNATURE_ROOT_ID = 'email-signature-root';

/** @deprecated Use wrapSignatureHtmlForPreview — kept for imports that concatenate html. */
export function buildSignaturePreviewSrcDoc(
  signatureBodyHtml: string,
  theme: SignaturePreviewTheme = 'light'
): string {
  return wrapSignatureHtmlForPreview(signatureBodyHtml, theme);
}

export const SIGNATURE_PREVIEW_DOC_PREFIX = '';
export const SIGNATURE_PREVIEW_DOC_SUFFIX = '';

export interface MeasureSignaturePreviewSizeOptions {
  /** When false, height is not capped at SIGNATURE_PREVIEW_MAX_HEIGHT. */
  clampHeight?: boolean;
  /** When false, width is not capped at maxWidth. */
  clampWidth?: boolean;
}

/** Content size from the signature table/rows — never the iframe viewport scroll size. */
export function measureSignatureIntrinsicSize(
  doc: Document,
  iframe: HTMLIFrameElement
): { width: number; height: number } {
  const previousWidth = iframe.style.width;
  const previousHeight = iframe.style.height;

  iframe.style.width = `${SIGNATURE_MEASURE_LAYOUT_WIDTH}px`;
  iframe.style.height = 'auto';

  void iframe.offsetHeight;

  const table = doc.querySelector('table');
  const root = doc.getElementById(SIGNATURE_ROOT_ID);

  if (!table) {
    const fallback = root?.getBoundingClientRect() ?? doc.body.getBoundingClientRect();
    iframe.style.width = previousWidth;
    iframe.style.height = previousHeight;
    return {
      width: Math.max(SIGNATURE_PREVIEW_MIN_WIDTH, Math.ceil(fallback.width)),
      height: Math.max(SIGNATURE_PREVIEW_MIN_HEIGHT, Math.ceil(fallback.height)),
    };
  }

  let width = Math.ceil(
    Math.max(
      table.scrollWidth,
      table.getBoundingClientRect().width,
      root?.scrollWidth ?? 0,
      doc.body.scrollWidth
    )
  );

  root?.querySelectorAll('p').forEach((paragraph) => {
    width = Math.max(
      width,
      Math.ceil(Math.max(paragraph.scrollWidth, paragraph.getBoundingClientRect().width))
    );
  });

  const height = Math.ceil(
    Math.max(
      table.scrollHeight,
      table.getBoundingClientRect().height,
      root?.scrollHeight ?? 0,
      doc.body.scrollHeight
    )
  );

  iframe.style.width = previousWidth;
  iframe.style.height = previousHeight;

  return {
    width: Math.max(
      SIGNATURE_PREVIEW_MIN_WIDTH,
      width + SIGNATURE_PREVIEW_BODY_PADDING + SIGNATURE_PREVIEW_SIZE_SLACK
    ),
    height: Math.max(
      SIGNATURE_PREVIEW_MIN_HEIGHT,
      height + SIGNATURE_PREVIEW_BODY_PADDING + SIGNATURE_PREVIEW_SIZE_SLACK
    ),
  };
}

export function measureSignaturePreviewSize(
  iframe: HTMLIFrameElement | null,
  maxWidth = SIGNATURE_PREVIEW_MAX_WIDTH,
  options: MeasureSignaturePreviewSizeOptions = {}
) {
  const { clampHeight = true, clampWidth = true } = options;
  const doc = iframe?.contentDocument;
  if (!doc?.body || !iframe) {
    return { width: SIGNATURE_PREVIEW_MIN_WIDTH, height: 140 };
  }

  const intrinsic = measureSignatureIntrinsicSize(doc, iframe);

  return {
    width: clampWidth
      ? Math.min(maxWidth, intrinsic.width)
      : intrinsic.width,
    height: clampHeight
      ? Math.min(SIGNATURE_PREVIEW_MAX_HEIGHT, intrinsic.height)
      : intrinsic.height,
  };
}

/** Scale factor to fit intrinsic signature dimensions inside a slot without reflow. */
export function computeSignaturePreviewScale(
  intrinsicWidth: number,
  intrinsicHeight: number,
  availableWidth: number,
  availableHeight: number
): number {
  if (intrinsicWidth <= 0 || intrinsicHeight <= 0) return 1;
  return Math.min(1, availableWidth / intrinsicWidth, availableHeight / intrinsicHeight);
}
