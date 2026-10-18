import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { fieldsFromRows } from '@/lib/templateFields';
import { SignatureWizard } from '@/pages/signatures-edit/components/SignatureWizard';
import { useUserContext } from '@/contexts/UserContext';
import {
  copyPreviewForGmail,
  copyTextToClipboard,
} from '@/utils/utils';

export default function SignatureEditPage() {
  const { t } = useTranslation();
  const {
    applyTemplateWithDefaults,
    selectedTemplate,
    resolvedHtml,
    saveSignature,
    saveSuccess,
    selectedTemplateId,
    templates,
    setSimpleStep,
    simpleStep,
    updateValue,
    values,
  } = useUserContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copiedSection, setCopiedSection] = useState<'html' | 'preview' | null>(null);

  const markCopied = useCallback((section: 'html' | 'preview') => {
    setCopiedSection(section);
    window.setTimeout(() => setCopiedSection(null), 2000);
  }, []);

  const copyToClipboard = useCallback(async (text: string, section: 'html' | 'preview') => {
    await copyTextToClipboard(text);
    markCopied(section);
  }, [markCopied]);

  const copyPreviewAsRichHtml = useCallback(async () => {
    await copyPreviewForGmail(iframeRef.current, resolvedHtml);
    markCopied('preview');
  }, [markCopied, resolvedHtml]);

  const reviewStep = fieldsFromRows(selectedTemplate.rows).length + 1;
  const effectiveStep = Math.min(simpleStep, reviewStep);

  const handleSaveSignature = useCallback(() => {
    saveSignature();
    toast.success(t('signatures.toastSaved'));
  }, [saveSignature, t]);

  return (
    <SignatureWizard
      step={effectiveStep}
      onStepChange={setSimpleStep}
      values={values}
      onUpdate={updateValue}
      resolvedHtml={resolvedHtml}
      onCopyHtml={() => copyToClipboard(resolvedHtml, 'html')}
      onCopyPreview={copyPreviewAsRichHtml}
      copiedHtml={copiedSection === 'html'}
      copiedPreview={copiedSection === 'preview'}
      iframeRef={iframeRef}
      onIframeLoad={() => {}}
      onSave={handleSaveSignature}
      saveSuccess={saveSuccess}
      templates={templates}
      selectedTemplate={selectedTemplate}
      selectedTemplateId={selectedTemplateId}
      onTemplateApply={applyTemplateWithDefaults}
    />
  );
}
