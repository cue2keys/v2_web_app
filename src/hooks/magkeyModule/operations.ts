import {
  applyLoadedConfigToKeyState,
  applyReadResultToKeyState,
  type MagkeyReadResult,
} from './state';
import { formatErrorMessage } from '@/lib/utils';
import type { KeyConfigState, MagkeyConfig } from './types';

interface ReadConfigAndBaselineArgs {
  row: number;
  col: number;
  onReadConfig: (row: number, col: number) => Promise<MagkeyConfig>;
  onReadKeypress: (row: number, col: number) => Promise<number | null>;
  logMagkeyReadError: (error: unknown) => void;
  logKeypressReadError: (error: unknown) => void;
}

type UpdateKeyByIndex = (idx: number, updater: (key: KeyConfigState) => KeyConfigState) => void;

interface LoadKeysArgs {
  keys: KeyConfigState[];
  updateKeyByIndex: UpdateKeyByIndex;
  readKeyState: (row: number, col: number) => Promise<MagkeyReadResult>;
  logMagkeyReadError: (error: unknown) => void;
  isCancelled: () => boolean;
}

interface ReadKeyArgs {
  idx: number;
  keys: KeyConfigState[];
  updateKeyByIndex: UpdateKeyByIndex;
  readKeyState: (row: number, col: number) => Promise<MagkeyReadResult>;
  logMagkeyReadError: (error: unknown) => void;
}

interface WriteKeyArgs {
  idx: number;
  keys: KeyConfigState[];
  config?: MagkeyConfig;
  updateKeyByIndex: UpdateKeyByIndex;
  onWriteConfig: (
    row: number,
    col: number,
    actuation: number,
    release: number,
    rapid: boolean,
  ) => Promise<MagkeyConfig>;
}

export interface BatchWriteSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  failures: string[];
}

interface WriteAllKeysArgs {
  keys: KeyConfigState[];
  config: MagkeyConfig;
  updateKeyByIndex: UpdateKeyByIndex;
  onWriteConfig: (
    row: number,
    col: number,
    actuation: number,
    release: number,
    rapid: boolean,
  ) => Promise<MagkeyConfig>;
}

export async function readConfigAndBaseline({
  row,
  col,
  onReadConfig,
  onReadKeypress,
  logMagkeyReadError,
  logKeypressReadError,
}: ReadConfigAndBaselineArgs): Promise<MagkeyReadResult> {
  const [configResult, baselineResult] = await Promise.allSettled([
    onReadConfig(row, col),
    onReadKeypress(row, col),
  ]);

  if (configResult.status === 'rejected') {
    logMagkeyReadError(configResult.reason);
  }
  if (baselineResult.status === 'rejected') {
    logKeypressReadError(baselineResult.reason);
  }

  return {
    config: configResult.status === 'fulfilled' ? configResult.value : null,
    baseline:
      baselineResult.status === 'fulfilled' && baselineResult.value !== null
        ? baselineResult.value
        : null,
  };
}

export async function loadKeysSequentially({
  keys,
  updateKeyByIndex,
  readKeyState,
  logMagkeyReadError,
  isCancelled,
}: LoadKeysArgs): Promise<void> {
  for (let idx = 0; idx < keys.length; idx += 1) {
    const key = keys[idx];
    if (!key?.valid) continue;
    if (isCancelled()) return;
    updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, busy: true }));
    try {
      const result = await readKeyState(key.row, key.col);
      if (isCancelled()) return;
      updateKeyByIndex(idx, (currentKey) => applyReadResultToKeyState(currentKey, result));
    } catch (error) {
      logMagkeyReadError(error);
      if (!isCancelled()) {
        updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, loaded: false }));
      }
    } finally {
      if (!isCancelled()) {
        updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, busy: false }));
      }
    }
  }
}

export async function readKeyAtIndex({
  idx,
  keys,
  updateKeyByIndex,
  readKeyState,
  logMagkeyReadError,
}: ReadKeyArgs): Promise<void> {
  const key = keys[idx];
  if (!key?.valid) return;
  updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, busy: true }));
  try {
    const result = await readKeyState(key.row, key.col);
    updateKeyByIndex(idx, (currentKey) => applyReadResultToKeyState(currentKey, result));
  } catch (error) {
    logMagkeyReadError(error);
    updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, loaded: false }));
  } finally {
    updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, busy: false }));
  }
}

export async function writeKeyAtIndex({
  idx,
  keys,
  config,
  updateKeyByIndex,
  onWriteConfig,
}: WriteKeyArgs): Promise<void> {
  const key = keys[idx];
  if (!key?.valid) return;
  const nextConfig = config ?? {
    actuation: key.actuation,
    release: key.release,
    rapid: key.rapid,
  };
  updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, busy: true }));
  try {
    const writtenConfig = await onWriteConfig(
      key.row,
      key.col,
      nextConfig.actuation,
      nextConfig.release,
      nextConfig.rapid,
    );
    updateKeyByIndex(idx, (currentKey) => applyLoadedConfigToKeyState(currentKey, writtenConfig));
  } catch (error) {
    updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, loaded: false }));
    throw error;
  } finally {
    updateKeyByIndex(idx, (currentKey) => ({ ...currentKey, busy: false }));
  }
}

export async function writeConfigToAllKeys({
  keys,
  config,
  updateKeyByIndex,
  onWriteConfig,
}: WriteAllKeysArgs): Promise<BatchWriteSummary> {
  const summary: BatchWriteSummary = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    failures: [],
  };

  for (let idx = 0; idx < keys.length; idx += 1) {
    if (!keys[idx]?.valid) continue;
    summary.attempted += 1;
    try {
      await writeKeyAtIndex({
        idx,
        keys,
        config,
        updateKeyByIndex,
        onWriteConfig,
      });
      summary.succeeded += 1;
    } catch (error) {
      summary.failed += 1;
      summary.failures.push(`key ${idx + 1}: ${formatErrorMessage(error)}`);
    }
  }

  return summary;
}
