import { colord, extend, type Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';

extend([namesPlugin]);

export function parseColorString(value: string, fallback = '#000000'): Colord {
  const trimmed = value.trim();
  if (trimmed) {
    const parsed = colord(trimmed);
    if (parsed.isValid()) return parsed;
  }
  const fallbackColor = colord(fallback);
  return fallbackColor.isValid() ? fallbackColor : colord('#000000');
}

export function formatColorHex(value: string, fallback = '#000000'): string {
  return parseColorString(value, fallback).toHex();
}

export function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}
