const EXPORT_IMAGE_PROXY_PATH = '/api/export-image';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchImageBlob(fetchUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(fetchUrl, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache',
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size === 0) return null;
    return blob;
  } catch {
    return null;
  }
}

async function fetchImageAsDataUrl(fetchUrl: string): Promise<string | null> {
  const blob = await fetchImageBlob(fetchUrl);
  if (!blob) return null;
  return blobToDataUrl(blob);
}

function exportImageProxyUrl(absoluteUrl: string): string {
  const params = new URLSearchParams({ url: absoluteUrl });
  return `${window.location.origin}${EXPORT_IMAGE_PROXY_PATH}?${params.toString()}`;
}

function wsrvImageProxyUrl(absoluteUrl: string): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=0&h=0&fit=inside&we`;
}

export async function resolveExportImageDataUrl(sourceUrl: string): Promise<string | null> {
  const trimmed = sourceUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed.startsWith('data:') ? trimmed : null;
  }

  let absolute = trimmed;
  try {
    absolute = new URL(trimmed, window.location.href).href;
  } catch {
    return null;
  }

  if (absolute.startsWith(window.location.origin)) {
    const sameOrigin = await fetchImageAsDataUrl(absolute);
    if (sameOrigin) return sameOrigin;
  }

  const direct = await fetchImageAsDataUrl(absolute);
  if (direct) return direct;

  const proxied = await fetchImageAsDataUrl(exportImageProxyUrl(absolute));
  if (proxied) return proxied;

  const wsrv = await fetchImageAsDataUrl(wsrvImageProxyUrl(absolute));
  if (wsrv) return wsrv;

  return null;
}

export async function inlineImagesForExport(
  root: ParentNode,
  waitForImage: (image: HTMLImageElement, timeoutMs: number) => Promise<void>,
  timeoutMs: number
): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      const rawSrc = image.getAttribute('src')?.trim();
      if (!rawSrc || rawSrc.startsWith('data:')) return;

      image.loading = 'eager';

      const dataUrl = await resolveExportImageDataUrl(rawSrc);
      if (!dataUrl) return;

      image.removeAttribute('srcset');
      image.src = dataUrl;
      await waitForImage(image, timeoutMs);
    })
  );
}
