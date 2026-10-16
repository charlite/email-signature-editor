import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { ColorPickerPanel } from '@/components/ui/color-picker-panel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatColorHex } from '@/lib/colorFormat';
import { cn } from '@/lib/utils';

function resolveSwatchColor(value: string, fallback?: string): string | null {
  const candidate = (typeof value === 'string' ? value : '').trim() || fallback?.trim() || '';
  if (!candidate) return null;
  try {
    return formatColorHex(candidate, fallback ?? '#000000');
  } catch {
    return candidate;
  }
}

export interface ColorInputProps
  extends Omit<React.ComponentProps<'button'>, 'type' | 'value' | 'onChange'> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Shown in the swatch when `value` is empty (e.g. inherited template default). */
  swatchFallback?: string;
  placeholder?: string;
}

export function ColorInput({
  className,
  value = '',
  onChange,
  swatchFallback,
  placeholder,
  disabled,
  id,
  ...triggerProps
}: ColorInputProps) {
  const stringValue = typeof value === 'string' ? value : String(value ?? '');
  const swatchColor = resolveSwatchColor(stringValue, swatchFallback);
  const displayText = stringValue.trim() || placeholder || '';

  const emitChange = (next: string) => {
    onChange?.({
      target: { value: next },
      currentTarget: { value: next },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full min-w-0 items-center gap-2.5 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-input/30',
            className
          )}
          {...triggerProps}
        >
          <span
            className={cn(
              'size-6 shrink-0 rounded-md border border-border shadow-xs',
              !swatchColor && 'bg-muted'
            )}
            style={swatchColor ? { backgroundColor: swatchColor } : undefined}
            aria-hidden
          />
          <span
            className={cn(
              'min-w-0 flex-1 truncate font-mono',
              !stringValue.trim() && 'text-muted-foreground'
            )}
          >
            {displayText}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,18rem)] p-3" align="start">
        <ColorPickerPanel
          value={stringValue}
          fallback={swatchFallback}
          onChange={emitChange}
        />
      </PopoverContent>
    </Popover>
  );
}
