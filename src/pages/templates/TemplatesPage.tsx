import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { TEMPLATES } from '@/lib/templates';
import { PageContent } from '@/pages/templates/components/PageContent';
import { useUserContext } from '@/contexts/UserContext';

export default function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    deleteTemplateItem,
    duplicateTemplate,
    openTemplateEditor,
    savedTemplates,
  } = useUserContext();

  const handleOpenSaved = useCallback(
    (id: string) => {
      if (!openTemplateEditor(id)) return;
      navigate("/templates/edit");
    },
    [navigate, openTemplateEditor]
  );

  const handleDuplicateTemplate = useCallback(
    (id: string) => {
      if (!duplicateTemplate(id)) {
        toast.error(t('templates.toastDuplicateFailed'));
        return;
      }
      toast.success(t('templates.toastDuplicated'));
      navigate("/templates/edit");
    },
    [duplicateTemplate, navigate, t]
  );

  const handleDeleteTemplate = useCallback(
    (id: string) => {
      deleteTemplateItem(id);
      toast.success(t('templates.toastDeleted'));
    },
    [deleteTemplateItem, t]
  );

  return (
    <PageContent
      defaultTemplates={TEMPLATES}
      savedTemplates={savedTemplates}
      onOpenTemplate={handleOpenSaved}
      onDuplicateTemplate={handleDuplicateTemplate}
      onDeleteSaved={handleDeleteTemplate}
    />
  );
}
