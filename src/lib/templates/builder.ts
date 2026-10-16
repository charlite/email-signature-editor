import type {
  NewTemplate,
  TemplateImageConfig,
  TemplateRowField,
  TemplateRows,
  TemplateTextConfig,
} from '@/types/types';
import { resolveFieldText } from '@/lib/templateRows';
import {
  fieldNeedsDedicatedDarkRule,
  resolveFieldTextColors,
} from '@/lib/signatureTextColors';

const FIELD_TO_VARIABLE: Record<TemplateRowField['label'], string> = {
  text: '{{DISCLAIMER}}',
  name: '{{NAME}}',
  company: '{{COMPANY}}',
  role: '{{POSITION}}',
  phone: '{{PHONE}}',
  email: '{{EMAIL}}',
  link: '{{WEBSITE}}',
  socials: '{{LINKEDIN_URL}}',
};

const IMAGE_SIZE: Record<TemplateImageConfig['size'], number> = {
  xs: 40,
  sm: 56,
  md: 80,
  lg: 112,
};

const TEXT_SIZE: Record<TemplateTextConfig['size'], number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
};

const SIGNATURE_ROOT_ID = 'email-signature-root';

function imageRadius(shape: TemplateImageConfig['shape']): string {
  if (shape === 'circle') return '50%';
  if (shape === 'square') return '0';
  return '8px';
}

function textFontWeight(shape: TemplateTextConfig['shape']): string {
  return shape === 'bold' ? 'bold' : 'normal';
}

function textFontStyle(shape: TemplateTextConfig['shape']): string {
  return shape === 'italic' ? 'italic' : 'normal';
}

function templateTextStyleLight(text: TemplateTextConfig, fontSize: number): string {
  return `color:${text.color};font-family:${text.font};font-size:${fontSize}px;font-weight:${textFontWeight(text.shape)};font-style:${textFontStyle(text.shape)};`;
}

function fieldTextStyleLight(text: TemplateTextConfig): string {
  return templateTextStyleLight(text, TEXT_SIZE[text.size]);
}

function renderField(
  field: TemplateRowField,
  templateText: TemplateTextConfig,
  fieldClass: string | null
): string {
  const token = FIELD_TO_VARIABLE[field.label];
  const { light } = resolveFieldTextColors(field, templateText);
  const style = fieldTextStyleLight({ ...resolveFieldText(field, templateText), color: light });
  const classAttr = fieldClass ? ` class="${fieldClass}"` : '';

  if (field.label === 'phone') {
    return `<a href="tel:${token}"${classAttr} style="text-decoration:none;${style}">${token}</a>`;
  }
  if (field.label === 'email') {
    return `<a href="mailto:${token}"${classAttr} style="text-decoration:none;${style}">${token}</a>`;
  }
  if (field.label === 'link') {
    return `<a href="${token}"${classAttr} style="text-decoration:none;${style}">${token}</a>`;
  }
  if (field.label === 'socials') {
    return `<a href="${token}" target="_blank"${classAttr} style="text-decoration:none;${style}">LinkedIn</a>`;
  }
  return `<span${classAttr} style="${style}">${token}</span>`;
}

/** For pasted HTML in mail clients: follows each client’s light/dark UI via prefers-color-scheme. */
function buildDarkModeStyles(
  rows: TemplateRows,
  templateText: TemplateTextConfig
): string {
  const rules: string[] = [
    `@media (prefers-color-scheme: dark) {
  #${SIGNATURE_ROOT_ID},
  #${SIGNATURE_ROOT_ID} p,
  #${SIGNATURE_ROOT_ID} span,
  #${SIGNATURE_ROOT_ID} td {
    color: ${templateText.colorDark} !important;
  }
  #${SIGNATURE_ROOT_ID} a {
    color: ${templateText.colorDark} !important;
  }
}`,
  ];

  let fieldIndex = 0;
  for (const row of rows) {
    for (const field of row) {
      const className = `sig-f-${fieldIndex}`;
      if (fieldNeedsDedicatedDarkRule(field, templateText)) {
        const { dark } = resolveFieldTextColors(field, templateText);
        rules.push(
          `@media (prefers-color-scheme: dark) {
  #${SIGNATURE_ROOT_ID} .${className},
  #${SIGNATURE_ROOT_ID} .${className} a {
    color: ${dark} !important;
  }
}`
        );
      }
      fieldIndex += 1;
    }
  }

  return rules.join('\n');
}

function renderRows(rows: TemplateRows, templateText: TemplateTextConfig): string {
  let fieldIndex = 0;

  return rows
    .filter((row) => row.length > 0)
    .map((row) => {
      const fieldsHtml = row
        .map((field) => {
          const needsClass = fieldNeedsDedicatedDarkRule(field, templateText);
          const className = needsClass ? `sig-f-${fieldIndex}` : null;
          const html = renderField(field, templateText, className);
          fieldIndex += 1;
          return html;
        })
        .join('<span style="opacity:.6;"> · </span>');
      return `<p style="margin:0 0 6px 0;">${fieldsHtml}</p>`;
    })
    .join('\n');
}

export function buildTemplateHtmlFromSchema(template: NewTemplate): string {
  const imageSize = IMAGE_SIZE[template.config.image.size];
  const fontSize = TEXT_SIZE[template.config.text.size];
  const rowsHtml = renderRows(template.rows, template.config.text);
  const darkStyles = buildDarkModeStyles(template.rows, template.config.text);

  const imageBlock = `<img src="${template.config.image.url}" width="${imageSize}" height="${imageSize}" style="display:block;border-radius:${imageRadius(template.config.image.shape)};object-fit:cover;" alt="" />`;
  const imageCell = `<td style="vertical-align:top;padding-right:16px;">\n  ${imageBlock}\n</td>`;
  const textCell = `<td style="vertical-align:top;${templateTextStyleLight(template.config.text, fontSize)}">\n${rowsHtml}\n</td>`;

  const rowContent =
    template.config.image.placement === 'right'
      ? `${textCell}\n${imageCell}`
      : template.config.image.placement === 'top'
        ? `<td>\n  <div style="margin-bottom:12px;">\n    ${imageBlock}\n  </div>\n  <div style="${templateTextStyleLight(template.config.text, fontSize)}">\n${rowsHtml}\n  </div>\n</td>`
        : `${imageCell}\n${textCell}`;

  const tableHtml = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${template.config.text.font};">\n<tr>\n${rowContent}\n</tr>\n</table>`;

  return `<style type="text/css">${darkStyles}</style><div id="${SIGNATURE_ROOT_ID}">${tableHtml}</div>`;
}

export function normalizeBuilderVariablesToLegacy(html: string): string {
  return html
    .replace(/{{\s*name\s*}}/gi, '{{NAME}}')
    .replace(/{{\s*company\s*}}/gi, '{{COMPANY}}')
    .replace(/{{\s*role\s*}}/gi, '{{POSITION}}')
    .replace(/{{\s*phone\s*}}/gi, '{{PHONE}}')
    .replace(/{{\s*email\s*}}/gi, '{{EMAIL}}')
    .replace(/{{\s*link\s*}}/gi, '{{WEBSITE}}')
    .replace(/{{\s*socials\s*}}/gi, '{{LINKEDIN_URL}}')
    .replace(/{{\s*text\s*}}/gi, '{{DISCLAIMER}}')
    .replace(/{{\s*image\s*}}/gi, '{{IMAGE}}');
}
