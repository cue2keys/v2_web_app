import type { DeviceItemT } from '@/generated/pendant/v2';
import { getMagkeyKeyPositions } from '@/lib/magkey';
import { toRapidToggleState } from '@/lib/magkeyConfig';
import { clampMagkey } from '@/lib/utils';
import type { KeyConfigState, MagkeyConfig } from './types';

export interface MagkeyReadResult {
  config: MagkeyConfig | null;
  baseline: number | null;
}

export function createInitialKeyStates(device: DeviceItemT): KeyConfigState[] {
  return getMagkeyKeyPositions(device).map((pos) => ({
    row: pos.row,
    col: pos.col,
    valid: pos.valid,
    actuation: 0,
    release: 0,
    rapid: false,
    loaded: false,
    busy: false,
    baseline: null,
    releaseBeforeRapid: null,
  }));
}

export function normalizeMagkeyConfig(config: MagkeyConfig): MagkeyConfig {
  return {
    actuation: clampMagkey(Number.isFinite(config.actuation) ? config.actuation : 0),
    release: clampMagkey(Number.isFinite(config.release) ? config.release : 0),
    rapid: Boolean(config.rapid),
  };
}

export function applyLoadedConfigToKeyState(
  key: KeyConfigState,
  config: MagkeyConfig,
): KeyConfigState {
  if (!key.valid) return key;
  const nextConfig = normalizeMagkeyConfig(config);
  if (nextConfig.rapid) {
    return { ...key, ...nextConfig, loaded: true };
  }
  return {
    ...key,
    ...nextConfig,
    loaded: true,
    releaseBeforeRapid: nextConfig.release,
  };
}

export function applyConfigToKeyState(key: KeyConfigState, config: MagkeyConfig): KeyConfigState {
  if (!key.valid) return key;
  const nextConfig = normalizeMagkeyConfig(config);
  if (nextConfig.rapid) {
    return { ...key, ...nextConfig };
  }
  return { ...key, ...nextConfig, releaseBeforeRapid: nextConfig.release };
}

export function applyReadResultToKeyState(
  key: KeyConfigState,
  result: MagkeyReadResult,
): KeyConfigState {
  let nextKey = result.config
    ? applyLoadedConfigToKeyState(key, result.config)
    : { ...key, loaded: false };
  if (result.baseline !== null) {
    nextKey = { ...nextKey, baseline: result.baseline };
  }
  return nextKey;
}

export function applyConfigToValidKeys(
  keys: KeyConfigState[],
  config: MagkeyConfig,
): KeyConfigState[] {
  const nextConfig = normalizeMagkeyConfig(config);
  return keys.map((key) => (key.valid ? applyConfigToKeyState(key, nextConfig) : key));
}

export function getBulkReleaseState(
  next: number,
  rapid: boolean,
  releaseBeforeRapid: number | null,
) {
  const clamped = clampMagkey(next);
  if (rapid) {
    return { release: clamped, releaseBeforeRapid };
  }
  return { release: clamped, releaseBeforeRapid: clamped };
}

export function getKeyReleaseState(key: KeyConfigState, next: number) {
  const clamped = clampMagkey(next);
  if (key.rapid) {
    return { release: clamped };
  }
  return { release: clamped, releaseBeforeRapid: clamped };
}

export function getRapidToggleForConfig(
  currentRapid: boolean,
  nextRapid: boolean,
  release: number,
  releaseBeforeRapid: number | null,
) {
  return toRapidToggleState({
    currentRapid,
    nextRapid,
    release,
    releaseBeforeRapid,
  });
}
