import { useCallback, useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { colord } from 'colord';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clampChannel, formatColorHex } from '@/lib/colorFormat';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#222222',
  '#6b7280',
  '#0563c1',
] as const;

type ColorMode = 'picker' | 'rgb' | 'hsl';

export interface ColorPickerPanelProps {
  value: string;
  fallback?: string;
  onChange: (hex: string) => void;
}

export function ColorPickerPanel({ value, fallback, onChange }: ColorPickerPanelProps) {
  const resolvedFallback = fallback?.trim() || '#000000';
  const [hex, setHex] = useState(() => formatColorHex(value, resolvedFallback));
  const [mode, setMode] = useState<ColorMode>('picker');

  useEffect(() => {
    setHex(formatColorHex(value, resolvedFallback));
  }, [value, resolvedFallback]);

  const applyHex = useCallback(
    (next: string) => {
      const normalized = formatColorHex(next, resolvedFallback);
      setHex(normalized);
      onChange(normalized);
    },
    [onChange, resolvedFallback]
  );

  const rgb = colord(hex).toRgb();
  const hsl = colord(hex).toHsl();

  const setRgbChannel = (channel: 'r' | 'g' | 'b', raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const next = { ...rgb, [channel]: clampChannel(parsed) };
    applyHex(colord(next).toHex());
  };

  const setHslChannel = (channel: 'h' | 's' | 'l', raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return;
    const next = { ...hsl, [channel]: parsed };
    const c = colord(next);
    if (c.isValid()) applyHex(c.toHex());
  };

  return (
    <div className="color-picker-panel space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={cn(
              'size-6 shrink-0 rounded-full border border-border shadow-xs transition-transform hover:scale-110',
              hex.toLowerCase() === preset.toLowerCase() && 'ring-2 ring-ring ring-offset-2 ring-offset-popover'
            )}
            style={{ backgroundColor: preset }}
            aria-label={preset}
            onClick={() => applyHex(preset)}
          />
        ))}
      </div>

      <div className="flex gap-1 rounded-md bg-muted/50 p-1">
        {(
          [
            ['picker', 'Picker'],
            ['rgb', 'RGB'],
            ['hsl', 'HSL'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              'flex-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors',
              mode === id
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'picker' ? (
        <HexColorPicker color={hex} onChange={applyHex} className="color-picker-surface !w-full" />
      ) : null}

      {mode === 'rgb' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(['r', 'g', 'b'] as const).map((channel) => (
              <div key={channel} className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">{channel}</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[channel]}
                  className="h-8 font-mono text-sm"
                  onChange={(e) => setRgbChannel(channel, e.target.value)}
                />
              </div>
            ))}
          </div>
          {(['r', 'g', 'b'] as const).map((channel) => (
            <input
              key={`${channel}-slider`}
              type="range"
              min={0}
              max={255}
              value={rgb[channel]}
              className="h-2 w-full cursor-pointer accent-primary"
              onChange={(e) => setRgbChannel(channel, e.target.value)}
            />
          ))}
        </div>
      ) : null}

      {mode === 'hsl' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">H</Label>
              <Input
                type="number"
                min={0}
                max={360}
                value={Math.round(hsl.h)}
                className="h-8 font-mono text-sm"
                onChange={(e) => setHslChannel('h', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">S</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={Math.round(hsl.s)}
                className="h-8 font-mono text-sm"
                onChange={(e) => setHslChannel('s', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">L</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={Math.round(hsl.l)}
                className="h-8 font-mono text-sm"
                onChange={(e) => setHslChannel('l', e.target.value)}
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(hsl.h)}
            className="h-2 w-full cursor-pointer accent-primary"
            onChange={(e) => setHslChannel('h', e.target.value)}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(hsl.s)}
            className="h-2 w-full cursor-pointer accent-primary"
            onChange={(e) => setHslChannel('s', e.target.value)}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(hsl.l)}
            className="h-2 w-full cursor-pointer accent-primary"
            onChange={(e) => setHslChannel('l', e.target.value)}
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Hex</Label>
        <Input
          value={hex}
          className="h-8 font-mono text-sm"
          onChange={(e) => applyHex(e.target.value)}
        />
      </div>
    </div>
  );
}
