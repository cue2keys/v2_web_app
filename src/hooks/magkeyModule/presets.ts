import { clampMagkey } from '@/lib/utils';
import type { MagkeyPreset } from './types';

const PRESET_STORAGE_KEY = 'magkey4_presets_v1';

function sanitizePreset(item: unknown): MagkeyPreset | null {
  if (!item || typeof item !== 'object') return null;
  const preset = item as Record<string, unknown>;
  if (typeof preset.name !== 'string') return null;
  return {
    name: preset.name,
    actuation: clampMagkey(Number(preset.actuation ?? 0)),
    release: clampMagkey(Number(preset.release ?? 0)),
    rapid: Boolean(preset.rapid),
  };
}

export function loadMagkeyPresets(): MagkeyPreset[] {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizePreset(item))
      .filter((preset): preset is MagkeyPreset => preset !== null);
  } catch {
    return [];
  }
}

export function saveMagkeyPreset(
  preset: MagkeyPreset,
  existingPresets: MagkeyPreset[],
): MagkeyPreset[] {
  const nextPresets = [preset, ...existingPresets.filter((item) => item.name !== preset.name)];
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
  } catch {
    // ignore storage errors
  }
  return nextPresets;
}
