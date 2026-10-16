export const TEMPLATE_VARIABLES = [
  'NAME',
  'POSITION',
  'COMPANY',
  'LINKEDIN_URL',
  'PHONE',
  'EMAIL',
  'WEBSITE',
  'IMAGE',
  'DISCLAIMER',
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export interface SignatureValues {
  NAME: string;
  POSITION: string;
  COMPANY: string;
  LINKEDIN_URL: string;
  PHONE: string;
  EMAIL: string;
  WEBSITE: string;
  IMAGE: string;
  /** Optional legal / informational text below the signature (plain text, line breaks preserved). */
  DISCLAIMER: string;
}

export const DEFAULT_SIGNATURE_VALUES: SignatureValues = {
  NAME: 'Your Name',
  POSITION: 'Your Position',
  COMPANY: 'Your company',
  LINKEDIN_URL: 'https://www.linkedin.com/in/username',
  PHONE: '+34000000000',
  EMAIL: 'demo@email.com',
  WEBSITE: 'https://www.demo.com',
  IMAGE: 'https://www.citypng.com/public/uploads/preview/white-user-member-guest-icon-png-image-701751695037005zdurfaim0y.png',
  DISCLAIMER: '',
};

export const TEMPLATE_BUILDER_FIELDS = [
  'text',
  'name',
  'company',
  'role',
  'phone',
  'email',
  'link',
  'socials',
] as const;

export type TemplateBuilderField = (typeof TEMPLATE_BUILDER_FIELDS)[number];

export const HYPERLINK_FIELD_LABELS = [
  'phone',
  'email',
  'link',
  'socials',
] as const satisfies readonly TemplateBuilderField[];

export const DEFAULT_HYPERLINK_COLOR = '#0563C1';

export function isHyperlinkFieldLabel(
  label: TemplateBuilderField
): label is (typeof HYPERLINK_FIELD_LABELS)[number] {
  return (HYPERLINK_FIELD_LABELS as readonly TemplateBuilderField[]).includes(
    label
  );
}

export interface TemplateRowField {
  label: TemplateBuilderField;
  /** Per-field overrides; omitted properties inherit template `config.text`. */
  text: Partial<TemplateTextConfig>;
}

export type TemplateRows = TemplateRowField[][];

export type TemplateSize = 'xs' | 'sm' | 'md' | 'lg';

export interface TemplateImageConfig {
  url: string;
  placement: 'left' | 'right' | 'top';
  size: TemplateSize;
  shape: 'rounded' | 'circle' | 'square';
}

export interface TemplateTextConfig {
  font: string;
  /** Text color for light mode / prefers-color-scheme: light */
  color: string;
  /** Text color for dark mode / prefers-color-scheme: dark */
  colorDark: string;
  size: TemplateSize;
  shape: 'normal' | 'bold' | 'italic';
}

export const DEFAULT_TEMPLATE_TEXT_CONFIG: TemplateTextConfig = {
  font: 'Arial, sans-serif',
  color: '#222222',
  colorDark: '#ffffff',
  size: 'md',
  shape: 'normal',
};

export interface NewTemplate {
  id: string;
  name: string;
  html: string;
  config: {
    image: TemplateImageConfig;
    text: TemplateTextConfig;
  };
  rows: TemplateRows;
}

export const DEFAULT_NEW_TEMPLATE: Omit<NewTemplate, 'id' | 'name' | 'html'> = {
  config: {
    image: {
      url: '{{IMAGE}}',
      placement: 'left',
      size: 'md',
      shape: 'rounded',
    },
    text: {
      font: 'Arial, sans-serif',
      color: '#222222',
      colorDark: '#ffffff',
      size: 'md',
      shape: 'normal',
    },
  },
  rows: [
    [{ label: 'name', text: {} }, { label: 'role', text: {} }],
    [{ label: 'company', text: {} }],
    [{ label: 'phone', text: { color: DEFAULT_HYPERLINK_COLOR } }, { label: 'email', text: { color: DEFAULT_HYPERLINK_COLOR } }, { label: 'link', text: { color: DEFAULT_HYPERLINK_COLOR } }],
  ],
};