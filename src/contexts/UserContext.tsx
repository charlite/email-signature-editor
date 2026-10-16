import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  deleteSavedSignature,
  loadSavedSignatures,
  upsertSavedSignature,
  type SavedSignature,
} from '@/lib/savedSignatures';
import {
  deleteSavedTemplate,
  loadSavedTemplates,
  upsertSavedTemplate,
  type SavedTemplate,
} from '@/lib/savedTemplates';
import {
  getTemplateHtml,
  resolveTemplate,
  TEMPLATES,
} from '@/lib/templates';
import { cloneTemplateRows } from '@/lib/templateRows';
import {
  DEFAULT_NEW_TEMPLATE,
  DEFAULT_SIGNATURE_VALUES,
  type NewTemplate,
  type SignatureValues,
} from '@/types/types';

interface UserContextValue {
  templates: NewTemplate[];
  savedTemplates: SavedTemplate[];
  selectedTemplate: NewTemplate;
  selectedTemplateId: string;
  templateHtml: string;
  values: SignatureValues;
  resolvedHtml: string;
  savedLibrary: SavedSignature[];
  editingSavedId: string | null;
  saveSuccess: boolean;
  darkMode: boolean;
  layoutVertical: boolean;
  simpleStep: number;
  handleTemplateChange: (templateId: string) => void;
  applyTemplateWithDefaults: (templateId: string) => void;
  updateValue: (key: keyof SignatureValues, value: string) => void;
  setTemplateHtml: (value: string) => void;
  setSimpleStep: (step: number) => void;
  toggleTheme: () => void;
  toggleLayout: () => void;
  refreshSavedLibrary: () => void;
  beginCreateSession: () => void;
  openSavedSession: (id: string, initialStep: number) => boolean;
  saveSignature: () => void;
  deleteSavedItem: (id: string) => void;
  saveTemplate: (template: NewTemplate) => string;
  openTemplateEditor: (id: string) => boolean;
  duplicateTemplate: (id: string) => boolean;
  deleteTemplateItem: (id: string) => void;
  beginTemplateSession: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function getInitialTemplate() {
  return TEMPLATES[0];
}

export function UserProvider({ children }: { children: ReactNode }) {
  const initialTemplate = getInitialTemplate();
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() =>
    typeof window !== 'undefined' ? loadSavedTemplates() : []
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplate?.id ?? 'default'
  );
  const templates = useMemo<NewTemplate[]>(
    () => [...TEMPLATES, ...savedTemplates],
    [savedTemplates]
  );
  const selectedTemplate = useMemo(
    () =>
      templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? DEFAULT_NEW_TEMPLATE,
    [selectedTemplateId, templates]
  );
  const [templateHtml, setTemplateHtmlState] = useState(
    getTemplateHtml(initialTemplate)
  );
  const [values, setValues] = useState<SignatureValues>(DEFAULT_SIGNATURE_VALUES);
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [savedLibrary, setSavedLibrary] = useState<SavedSignature[]>(() =>
    typeof window !== 'undefined' ? loadSavedSignatures() : []
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [layoutVertical, setLayoutVertical] = useState(false);
  const [simpleStep, setSimpleStep] = useState(0);

  const resolvedHtml = useMemo(
    () => resolveTemplate(templateHtml, values),
    [templateHtml, values]
  );

  useEffect(() => {
    setTemplateHtmlState(getTemplateHtml(selectedTemplate));
  }, [selectedTemplate]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = window.setTimeout(() => setSaveSuccess(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  const refreshSavedLibrary = useCallback(() => {
    setSavedLibrary(loadSavedSignatures());
  }, []);

  const refreshSavedTemplates = useCallback(() => {
    setSavedTemplates(loadSavedTemplates());
  }, []);

  const handleTemplateChange = useCallback((templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplateId(template.id);
    setTemplateHtmlState(getTemplateHtml(template));
  }, [templates]);

  const applyTemplateWithDefaults = useCallback((templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplateId(template.id);
    setTemplateHtmlState(getTemplateHtml(template));
    setValues({ ...DEFAULT_SIGNATURE_VALUES });
  }, [templates]);

  const updateValue = useCallback((key: keyof SignatureValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const beginCreateSession = useCallback(() => {
    const template = templates.find((item) => item.id === selectedTemplateId) ?? templates[0];
    if (!template) return;
    setSelectedTemplateId(template.id);
    setTemplateHtmlState(getTemplateHtml(template));
    setValues({ ...DEFAULT_SIGNATURE_VALUES });
    setEditingSavedId(null);
    setSimpleStep(0);
  }, [selectedTemplateId, templates]);

  const openSavedSession = useCallback(
    (id: string, initialStep: number) => {
      const saved = loadSavedSignatures().find((item) => item.id === id);
      if (!saved) return false;
      const template = templates.find((item) => item.id === saved.templateId) ?? templates[0];
      if (!template) return false;
      setSelectedTemplateId(template.id);
      setTemplateHtmlState(getTemplateHtml(template));
      setValues({ ...DEFAULT_SIGNATURE_VALUES, ...saved.values });
      setEditingSavedId(saved.id);
      setSimpleStep(initialStep);
      return true;
    },
    [templates]
  );

  const saveSignature = useCallback(() => {
    const saved = upsertSavedSignature({
      id: editingSavedId ?? undefined,
      templateId: selectedTemplateId,
      values,
    });
    setEditingSavedId(saved.id);
    setSaveSuccess(true);
    refreshSavedLibrary();
  }, [editingSavedId, refreshSavedLibrary, selectedTemplateId, values]);

  const deleteSavedItem = useCallback(
    (id: string) => {
      deleteSavedSignature(id);
      refreshSavedLibrary();
      if (editingSavedId === id) {
        setEditingSavedId(null);
      }
    },
    [editingSavedId, refreshSavedLibrary]
  );

  const beginTemplateSession = useCallback(() => {
    setSelectedTemplateId(TEMPLATES[0]?.id ?? 'default');
  }, []);

  const saveTemplate = useCallback(
    (template: NewTemplate) => {
      const existingSaved = savedTemplates.find((item) => item.id === template.id);
      const safeId = existingSaved ? template.id : `custom-${Date.now()}`;
      const saved = upsertSavedTemplate({
        ...template,
        id: safeId,
      });
      refreshSavedTemplates();
      setSelectedTemplateId(saved.id);
      setTemplateHtmlState(getTemplateHtml(saved));
      return saved.id;
    },
    [refreshSavedTemplates, savedTemplates]
  );

  const openTemplateEditor = useCallback(
    (id: string) => {
      const template = templates.find((item) => item.id === id);
      if (!template) return false;
      setSelectedTemplateId(template.id);
      setTemplateHtmlState(getTemplateHtml(template));
      return true;
    },
    [templates]
  );

  const duplicateTemplate = useCallback(
    (id: string) => {
      const template = templates.find((item) => item.id === id);
      if (!template) return false;

      const baseName = template.name?.trim() || 'Untitled Template';
      const duplicate: NewTemplate = {
        ...template,
        id: `custom-${Date.now()}`,
        name: `${baseName} (Copy)`,
        html: getTemplateHtml(template),
        config: {
          image: { ...template.config.image },
          text: { ...template.config.text },
        },
        rows: cloneTemplateRows(template.rows),
      };

      const saved = upsertSavedTemplate(duplicate);
      refreshSavedTemplates();
      setSelectedTemplateId(saved.id);
      setTemplateHtmlState(getTemplateHtml(saved));
      return true;
    },
    [refreshSavedTemplates, templates]
  );

  const deleteTemplateItem = useCallback(
    (id: string) => {
      deleteSavedTemplate(id);
      refreshSavedTemplates();
      if (selectedTemplateId === id) {
        setSelectedTemplateId(TEMPLATES[0]?.id ?? 'default');
      }
    },
    [refreshSavedTemplates, selectedTemplateId]
  );

  const value = useMemo<UserContextValue>(
    () => ({
      selectedTemplateId,
      selectedTemplate,
      templates,
      savedTemplates,
      templateHtml,
      values,
      resolvedHtml,
      savedLibrary,
      editingSavedId,
      saveSuccess,
      darkMode,
      layoutVertical,
      simpleStep,
      handleTemplateChange,
      applyTemplateWithDefaults,
      updateValue,
      setTemplateHtml: setTemplateHtmlState,
      setSimpleStep,
      toggleTheme: () => setDarkMode((prev) => !prev),
      toggleLayout: () => setLayoutVertical((prev) => !prev),
      refreshSavedLibrary,
      beginCreateSession,
      openSavedSession,
      saveSignature,
      deleteSavedItem,
      saveTemplate,
      openTemplateEditor,
      duplicateTemplate,
      deleteTemplateItem,
      beginTemplateSession,
    }),
    [
      selectedTemplateId,
      selectedTemplate,
      templates,
      savedTemplates,
      templateHtml,
      values,
      resolvedHtml,
      savedLibrary,
      editingSavedId,
      saveSuccess,
      darkMode,
      layoutVertical,
      simpleStep,
      handleTemplateChange,
      applyTemplateWithDefaults,
      updateValue,
      refreshSavedLibrary,
      beginCreateSession,
      openSavedSession,
      saveSignature,
      deleteSavedItem,
      saveTemplate,
      openTemplateEditor,
      duplicateTemplate,
      deleteTemplateItem,
      beginTemplateSession,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
