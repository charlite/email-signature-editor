import { useUserContext } from '@/contexts/UserContext';
import {
  appThemeToPreviewTheme,
  type SignaturePreviewTheme,
} from '@/lib/signaturePreviewDocument';

/** Preview theme from the web app’s light/dark setting (not OS prefers-color-scheme). */
export function useAppPreviewTheme(
  override?: SignaturePreviewTheme
): SignaturePreviewTheme {
  const { darkMode } = useUserContext();
  return override ?? appThemeToPreviewTheme(darkMode);
}
