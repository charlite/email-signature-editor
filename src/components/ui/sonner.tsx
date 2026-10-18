import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useUserContext } from '@/contexts/UserContext';

export function Toaster({ ...props }: ToasterProps) {
  const { darkMode } = useUserContext();

  return (
    <Sonner
      theme={darkMode ? 'dark' : 'light'}
      className="toaster group"
      closeButton
      richColors
      {...props}
    />
  );
}
