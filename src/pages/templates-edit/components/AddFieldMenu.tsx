import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TEMPLATE_BUILDER_FIELDS,
  type TemplateBuilderField,
} from '@/types/types';

interface AddFieldMenuProps {
  rowIndex: number;
  onAddField: (rowIndex: number, field: TemplateBuilderField) => void;
  builderFieldLabel: (field: TemplateBuilderField) => string;
  className?: string;
}

export function AddFieldMenu({
  rowIndex,
  onAddField,
  builderFieldLabel,
  className,
}: AddFieldMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative inline-flex shrink-0', className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Plus className="size-3.5" aria-hidden />
        {t('templateEditor.addField')}
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-[11rem] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {TEMPLATE_BUILDER_FIELDS.map((field) => (
            <li key={field} role="presentation">
              <button
                type="button"
                role="option"
                className="flex w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                onClick={() => {
                  onAddField(rowIndex, field);
                  setOpen(false);
                }}
              >
                {builderFieldLabel(field)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
