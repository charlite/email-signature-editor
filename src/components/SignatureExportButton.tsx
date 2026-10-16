import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  downloadSignatureImage,
  getSupportedSignatureImageFormats,
  openSignatureImageExportTab,
  type SignatureImageFormat,
} from '@/lib/signatureImageExport';
import { useAppPreviewTheme } from '@/hooks/useAppPreviewTheme';
import { copyTextToClipboard } from '@/utils/utils';
import { cn } from '@/lib/utils';

interface SignatureExportButtonProps {
  html: string;
  fileName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  className?: string;
  stopPropagation?: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
}

export function SignatureExportButton({
  html,
  fileName,
  variant = 'outline',
  size = 'sm',
  className,
  stopPropagation = false,
}: SignatureExportButtonProps) {
  const { t } = useTranslation();
  const previewTheme = useAppPreviewTheme();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [exporting, setExporting] = useState(false);
  const imageFormats = getSupportedSignatureImageFormats();

  const isolateEvent = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (stopPropagation) event.stopPropagation();
  };

  const updateMenuPosition = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.right,
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [menuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  const imageFormatLabel = (format: SignatureImageFormat) => {
    if (format === 'png') return t('signatures.exportPng');
    if (format === 'jpeg') return t('signatures.exportJpeg');
    return t('signatures.exportWebp');
  };

  const runExport = async (action: () => Promise<void>) => {
    setMenuOpen(false);
    setExporting(true);
    try {
      await action();
    } catch (error) {
      console.error('Signature export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleHtmlExport = (event: React.MouseEvent<HTMLButtonElement>) => {
    isolateEvent(event);
    void runExport(() => copyTextToClipboard(html));
  };

  const handleImageExport = (
    format: SignatureImageFormat,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    isolateEvent(event);
    const exportWindow = openSignatureImageExportTab();

    void runExport(() =>
      downloadSignatureImage(html, format, fileName, exportWindow, previewTheme)
    );
  };

  const menu =
    menuOpen && menuPosition
      ? createPortal(
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              transform: 'translateX(-100%)',
            }}
            className="z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={handleHtmlExport}
            >
              {t('signatures.exportHtmlClipboard')}
            </button>
            {imageFormats.map((format) => (
              <button
                key={format}
                type="button"
                role="menuitem"
                className="flex w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={(event) => handleImageExport(format, event)}
              >
                {imageFormatLabel(format)}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onClick={isolateEvent}
      onMouseDown={isolateEvent}
    >
      <Button
        type="button"
        variant={variant}
        size={size}
        className="gap-1.5"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        disabled={exporting}
        onClick={(event) => {
          isolateEvent(event);
          setMenuOpen((open) => !open);
        }}
      >
        <Download className="size-3.5" />
        {exporting ? t('signatures.exporting') : t('signatures.export')}
        <ChevronDown className="size-3.5" />
      </Button>
      {menu}
    </div>
  );
}
