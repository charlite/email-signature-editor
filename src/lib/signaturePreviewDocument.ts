export type SignaturePreviewTheme = 'light' | 'dark';

const DARK_COLOR_SCHEME_MEDIA_START =
  /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/gi;

/** Unwrap or remove `prefers-color-scheme: dark` blocks (brace-aware). */
function rewriteDarkColorSchemeMedia(css: string, theme: SignaturePreviewTheme): string {
  let result = '';
  let index = 0;
  const re = new RegExp(DARK_COLOR_SCHEME_MEDIA_START.source, 'gi');

  for (;;) {
    re.lastIndex = index;
    const match = re.exec(css);
    if (!match) {
      result += css.slice(index);
      break;
    }

    result += css.slice(index, match.index);
    const braceStart = match.index + match[0].length - 1;
    let depth = 0;
    let cursor = braceStart;
    while (cursor < css.length) {
      const char = css[cursor];
      if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          const inner = css.slice(braceStart + 1, cursor);
          if (theme === 'dark') {
            result += `${inner.trim()}\n`;
          }
          index = cursor + 1;
          break;
        }
      }
      cursor += 1;
    }
    if (cursor >= css.length) {
      result += css.slice(match.index);
      break;
    }
  }

  return result;
}

/**
 * In-app previews must follow the app theme, not OS `prefers-color-scheme`.
 * Mail clients still use the embedded @media rules in copied HTML.
 */
export function rewriteSignatureHtmlForAppPreview(
  signatureBodyHtml: string,
  theme: SignaturePreviewTheme
): string {
  if (!/prefers-color-scheme\s*:\s*dark/i.test(signatureBodyHtml)) {
    return signatureBodyHtml;
  }

  return signatureBodyHtml.replace(
    /<style([^>]*)>([\s\S]*?)<\/style>/gi,
    (_full, attrs: string, css: string) => {
      const nextCss = rewriteDarkColorSchemeMedia(css, theme);
      return `<style${attrs}>${nextCss}</style>`;
    }
  );
}

/**
 * Wrap signature HTML for in-app iframe preview.
 * Dark-mode rules are flattened or removed so colors match `theme`, not the OS.
 */
export function wrapSignatureHtmlForPreview(
  signatureBodyHtml: string,
  theme: SignaturePreviewTheme
): string {
  const bodyHtml = rewriteSignatureHtmlForAppPreview(signatureBodyHtml, theme);
  const scheme = `only ${theme}`;
  return `<!DOCTYPE html><html style="color-scheme:${scheme};"><head><meta charset="utf-8"><meta name="color-scheme" content="${scheme}"><style>
html{color-scheme:${scheme};}
html,body{margin:0;padding:12px 12px 0;background:transparent;width:max-content;min-width:0;overflow:visible;}
#email-signature-root{display:inline-block;max-width:none;}
#email-signature-root table{width:auto;max-width:none;}
#email-signature-root p{white-space:nowrap;margin:0 0 6px 0;}
</style></head><body>${bodyHtml}</body></html>`;
}

export function appThemeToPreviewTheme(darkMode: boolean): SignaturePreviewTheme {
  return darkMode ? 'dark' : 'light';
}
