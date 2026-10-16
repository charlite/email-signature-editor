import { LinkedInEnterpriseTooltip } from '@/components/LinkedInEnterpriseTooltip';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const LANGUAGES = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
  { value: 'fr', label: 'FR' },
  { value: 'de', label: 'DE' },
  { value: 'it', label: 'IT' },
  { value: 'nl', label: 'NL' },
  { value: 'ca', label: 'CA' },
  { value: 'ru', label: 'RU' },
  { value: 'zh', label: 'ZH' },
] as const;

type SupportedLang = (typeof LANGUAGES)[number]['value'];
const SUPPORTED_VALUES = new Set<SupportedLang>(LANGUAGES.map((l) => l.value));

function normalizeLanguage(lang: string): SupportedLang {
  if (SUPPORTED_VALUES.has(lang as SupportedLang)) return lang as SupportedLang;
  const base = lang.split('-')[0] as SupportedLang;
  return SUPPORTED_VALUES.has(base) ? base : 'en';
}

interface AppHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  darkMode: boolean;
  onThemeToggle: () => void;
}

export function AppHeader({
  language,
  onLanguageChange,
  darkMode,
  onThemeToggle,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const navRoutes = [
    { path: "/", label: t('nav.home') },
    { path: "/templates", label: t('nav.templates') },
    { path: "/signatures", label: t('nav.signatures') },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center justify-center border-b border-border bg-background px-4">
      <nav className="flex items-center gap-1">
        {navRoutes.map(({ path, label }) => {
          const isActive =
            path === '/'
              ? location.pathname === path
              : location.pathname === path || location.pathname.startsWith(`${path}/`);
          return (
            <Button
              key={path}
              asChild
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-4 hover:bg-secondary hover:text-secondary-foreground"
            >
              <Link to={path}>{label}</Link>
            </Button>
          );
        })}

        <div className="mx-1 h-4 w-px bg-border" />

        <LinkedInEnterpriseTooltip>
          <Button
            type="button"
            disabled
            variant={location.pathname === '/login' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-4"
          >
            {t('nav.login')}
          </Button>
        </LinkedInEnterpriseTooltip>

        <div className="mx-1 h-4 w-px bg-border" />

        <Select value={normalizeLanguage(language)} onValueChange={onLanguageChange}>
          <SelectTrigger
            className="h-8 w-[72px] border-0 dark:bg-transparent bg-transparent text-foreground shadow-none hover:bg-secondary hover:text-secondary-foreground [&_svg]:opacity-100 hover:[&_svg]:text-secondary-foreground"
            aria-label={t('language')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              aria-label={darkMode ? t('actions.lightMode') : t('actions.darkMode')}
              className="size-8"
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {darkMode ? t('actions.lightMode') : t('actions.darkMode')}
          </TooltipContent>
        </Tooltip>
      </nav>
    </header>
  );
}
