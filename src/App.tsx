import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { AppHeader } from '@/components/AppHeader';
import { GitHubFooter } from '@/components/GitHubFooter';
import { SiteFooter } from '@/components/SiteFooter';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useUserContext } from '@/contexts/UserContext';

export default function App() {
  const { i18n } = useTranslation();
  const {
    darkMode,
    toggleTheme,
  } = useUserContext();

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        <AppHeader
          language={i18n.language || 'en'}
          onLanguageChange={(value) => i18n.changeLanguage(value)}
          darkMode={darkMode}
          onThemeToggle={toggleTheme}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Outlet />
          </div>
          <SiteFooter />
        </div>
        <GitHubFooter />
      </div>
      <Toaster position="top-right" />
    </TooltipProvider>
  );
}
