import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Copy, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fieldsFromRows, SIGNATURE_KEY_TO_LABEL } from '@/lib/templateFields';
import { SignatureExportButton } from '@/components/SignatureExportButton';
import { TemplatePickerGrid } from '@/pages/signatures-edit/components/TemplatePickerGrid';
import { useAppPreviewTheme } from '@/hooks/useAppPreviewTheme';
import { useSyncSignaturePreviewIframeDoc } from '@/hooks/useSyncSignaturePreviewIframeDoc';
import { cn } from '@/lib/utils';
import type { NewTemplate, SignatureValues } from '@/types/types';

const STEP_TEMPLATE = 0;

interface SignatureWizardProps {
  step: number;
  onStepChange: (step: number) => void;
  values: SignatureValues;
  onUpdate: (key: keyof SignatureValues, value: string) => void;
  resolvedHtml: string;
  onCopyHtml: () => void;
  onCopyPreview: () => void;
  copiedHtml: boolean;
  copiedPreview: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onIframeLoad: () => void;
  onSave: () => void;
  saveSuccess: boolean;
  templates: NewTemplate[];
  selectedTemplate: NewTemplate;
  selectedTemplateId: string;
  onTemplateApply: (templateId: string) => void;
}

export function SignatureWizard({
  step,
  onStepChange,
  values,
  onUpdate,
  resolvedHtml,
  onCopyHtml,
  onCopyPreview,
  copiedHtml,
  copiedPreview,
  iframeRef,
  onIframeLoad,
  onSave,
  saveSuccess,
  templates,
  selectedTemplate,
  selectedTemplateId,
  onTemplateApply,
}: SignatureWizardProps) {
  const { t } = useTranslation();
  const previewTheme = useAppPreviewTheme();
  useSyncSignaturePreviewIframeDoc(iframeRef, resolvedHtml, previewTheme, onIframeLoad);
  const dynamicKeys = fieldsFromRows(selectedTemplate.rows);
  const fieldConfig = dynamicKeys.map((key) => ({
    key,
    labelKey: SIGNATURE_KEY_TO_LABEL[key],
  }));
  const FIELD_STEPS = fieldConfig.length;
  const REVIEW_STEP = FIELD_STEPS + 1;
  const TOTAL_STEPS = FIELD_STEPS + 2;

  const isTemplateStep = step === STEP_TEMPLATE;
  const isReview = step === REVIEW_STEP;
  const fieldStepIndex = step - 1;
  const isFieldStep = step >= 1 && step <= FIELD_STEPS;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const handlePickTemplate = (templateId: string) => {
    onTemplateApply(templateId);
    onStepChange(1);
  };

  const advanceStep = () => {
    if (isTemplateStep) {
      onStepChange(1);
    } else {
      onStepChange(Math.min(REVIEW_STEP, step + 1));
    }
  };

  const handleFieldInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    advanceStep();
  };

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-1 flex-col justify-center gap-6 py-6',
        isTemplateStep ? 'max-w-7xl' : 'max-w-lg'
      )}
    >
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {t('signatures.step', { current: step + 1, total: TOTAL_STEPS })}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isTemplateStep ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">{t('signatures.chooseTemplate')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('signatures.chooseTemplateDescription')}
            </p>
          </div>
          <TemplatePickerGrid
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handlePickTemplate}
          />
        </div>
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="space-y-6 pt-6">
            {isFieldStep ? (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor={`wizard-${fieldConfig[fieldStepIndex].key}`}
                    className="text-base font-medium"
                  >
                    {t(`fields.${fieldConfig[fieldStepIndex].labelKey}`)}
                  </Label>
                  {fieldConfig[fieldStepIndex].key === 'DISCLAIMER' ? (
                    <Textarea
                      id={`wizard-${fieldConfig[fieldStepIndex].key}`}
                      value={values.DISCLAIMER}
                      onChange={(e) =>
                        onUpdate('DISCLAIMER', e.target.value)
                      }
                      rows={5}
                      className="min-h-[120px] text-base"
                      placeholder={t('fields.disclaimerPlaceholder')}
                      autoFocus
                    />
                  ) : (
                    <Input
                      id={`wizard-${fieldConfig[fieldStepIndex].key}`}
                      type={
                        fieldConfig[fieldStepIndex].key === 'EMAIL'
                          ? 'email'
                          : fieldConfig[fieldStepIndex].key === 'PHONE'
                            ? 'tel'
                            : fieldConfig[fieldStepIndex].key === 'IMAGE' ||
                                fieldConfig[fieldStepIndex].key === 'LINKEDIN_URL' ||
                                fieldConfig[fieldStepIndex].key === 'WEBSITE'
                              ? 'url'
                              : 'text'
                      }
                      value={values[fieldConfig[fieldStepIndex].key]}
                      onChange={(e) =>
                        onUpdate(fieldConfig[fieldStepIndex].key, e.target.value)
                      }
                      onKeyDown={handleFieldInputKeyDown}
                      className="h-11 text-base"
                      autoFocus
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {fieldConfig[fieldStepIndex].key === 'DISCLAIMER'
                    ? t('signatures.fieldHintDisclaimer')
                    : t('signatures.fieldHint')}
                </p>
              </>
            ) : isReview ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{t('signatures.reviewTitle')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('signatures.reviewDescription')}
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-border/50 bg-transparent">
                  <iframe
                    ref={iframeRef}
                    title="Signature preview"
                    className="block min-h-[200px] w-full border-0 bg-transparent"
                    onLoad={onIframeLoad}
                    style={{ colorScheme: previewTheme === 'dark' ? 'dark' : 'light' }}
                    sandbox="allow-same-origin"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onCopyPreview}
                    className="gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    {copiedPreview ? t('actions.copied') : t('signatures.copyForGmail')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCopyHtml}
                    className="gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    {copiedHtml ? t('actions.copied') : t('signatures.copyHtml')}
                  </Button>
                  <SignatureExportButton
                    html={resolvedHtml}
                    fileName={
                      values.NAME?.trim() ||
                      t('signatures.untitled', {
                        date: new Date().toLocaleDateString(),
                      })
                    }
                    getPreviewIframe={() => iframeRef.current}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onSave}
                    className="gap-1.5"
                  >
                    <Save className="size-3.5" />
                    {saveSuccess ? t('signatures.saved') : t('signatures.save')}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onStepChange(Math.max(STEP_TEMPLATE, step - 1))}
          disabled={step === STEP_TEMPLATE}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          {t('signatures.back')}
        </Button>
        {!isReview ? (
          <Button
            type="button"
            onClick={advanceStep}
            className="gap-1"
          >
            {isTemplateStep
              ? t('signatures.next')
              : step === FIELD_STEPS
                ? t('signatures.review')
                : t('signatures.next')}
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onStepChange(1)}
              className="gap-1"
            >
              {t('signatures.editAgain')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
