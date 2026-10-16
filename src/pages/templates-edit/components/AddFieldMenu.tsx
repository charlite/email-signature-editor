import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          'inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline',
          className
        )}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Plus className="size-3.5" aria-hidden />
        {t('templateEditor.addField')}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        {TEMPLATE_BUILDER_FIELDS.map((field) => (
          <DropdownMenuItem
            key={field}
            onSelect={() => onAddField(rowIndex, field)}
          >
            {builderFieldLabel(field)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
