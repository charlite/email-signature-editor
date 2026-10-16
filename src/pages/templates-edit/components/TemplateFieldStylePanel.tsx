import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  isRowFieldTextCustomized,
  isRowFieldTextPropertyCustomized,
  TEMPLATE_TEXT_DEFAULT_OPTION,
} from '@/lib/templateRows';
import type { TemplateRowField, TemplateTextConfig } from '@/types/types';

const TEMPLATE_SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const TEXT_SHAPES = ['normal', 'bold', 'italic'] as const;

interface TemplateFieldStylePanelProps {
  field: TemplateRowField;
  rowNumber: number;
  fieldName: string;
  templateText: TemplateTextConfig;
  onBack: () => void;
  onReset: () => void;
  onUpdateText: (patch: Partial<TemplateTextConfig>) => void;
}

export function TemplateFieldStylePanel({
  field,
  rowNumber,
  fieldName,
  templateText,
  onBack,
  onReset,
  onUpdateText,
}: TemplateFieldStylePanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        {t('templateEditor.backToAttributes')}
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="template-field-style-heading"
            className="text-sm font-semibold tracking-tight"
          >
            {t('templateEditor.fieldStyleLocation', {
              row: rowNumber,
              field: fieldName,
            })}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('templateEditor.fieldStyleHint')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onReset}
          disabled={!isRowFieldTextCustomized(field)}
        >
          {t('templateEditor.resetToDefault')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="field-text-font" className="text-sm font-medium">
            {t('templateEditor.font')}
          </Label>
          <Input
            id="field-text-font"
            value={
              isRowFieldTextPropertyCustomized(field, 'font')
                ? field.text.font ?? ''
                : ''
            }
            onChange={(e) =>
              onUpdateText({
                font: e.target.value === '' ? templateText.font : e.target.value,
              })
            }
            placeholder={templateText.font}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-text-color" className="text-sm font-medium">
            {t('templateEditor.color')}
          </Label>
          <Input
            id="field-text-color"
            value={
              isRowFieldTextPropertyCustomized(field, 'color')
                ? field.text.color ?? ''
                : ''
            }
            onChange={(e) =>
              onUpdateText({
                color: e.target.value === '' ? templateText.color : e.target.value,
              })
            }
            placeholder={templateText.color}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-text-size" className="text-sm font-medium">
            {t('templateEditor.textSize')}
          </Label>
          <Select
            value={
              isRowFieldTextPropertyCustomized(field, 'size')
                ? field.text.size!
                : TEMPLATE_TEXT_DEFAULT_OPTION
            }
            onValueChange={(value) =>
              onUpdateText({
                size:
                  value === TEMPLATE_TEXT_DEFAULT_OPTION
                    ? templateText.size
                    : (value as TemplateTextConfig['size']),
              })
            }
          >
            <SelectTrigger id="field-text-size" className="h-10">
              <SelectValue placeholder={t('templateEditor.default')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TEMPLATE_TEXT_DEFAULT_OPTION}>
                {t('templateEditor.default')}
              </SelectItem>
              {TEMPLATE_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {t(`templateEditor.size.${size}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-text-shape" className="text-sm font-medium">
            {t('templateEditor.textStyle')}
          </Label>
          <Select
            value={
              isRowFieldTextPropertyCustomized(field, 'shape')
                ? field.text.shape!
                : TEMPLATE_TEXT_DEFAULT_OPTION
            }
            onValueChange={(value) =>
              onUpdateText({
                shape:
                  value === TEMPLATE_TEXT_DEFAULT_OPTION
                    ? templateText.shape
                    : (value as TemplateTextConfig['shape']),
              })
            }
          >
            <SelectTrigger id="field-text-shape" className="h-10">
              <SelectValue placeholder={t('templateEditor.default')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TEMPLATE_TEXT_DEFAULT_OPTION}>
                {t('templateEditor.default')}
              </SelectItem>
              {TEXT_SHAPES.map((shape) => (
                <SelectItem key={shape} value={shape}>
                  {t(`templateEditor.textShape.${shape}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
