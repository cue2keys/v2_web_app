import { useEffect, useState } from 'react';
import { formatErrorMessage } from '@/lib/utils';
import {
  loadKeysSequentially,
  readConfigAndBaseline,
  readKeyAtIndex,
  writeKeyAtIndex,
} from './operations';
import { createInitialKeyStates, getKeyReleaseState, getRapidToggleForConfig } from './state';
import type { KeyConfigState, UseMagkeyModuleArgs } from './types';

interface UseMagkeyModuleKeysArgs
  extends Pick<
    UseMagkeyModuleArgs,
    'device' | 'onReadConfig' | 'onReadKeypress' | 'onWriteConfig'
  > {
  appendLog: (message: string) => void;
  deviceKey: string;
  isMagkeyModule: boolean;
}

export type UpdateKeyByIndex = (
  idx: number,
  updater: (key: KeyConfigState) => KeyConfigState,
) => void;

export function useMagkeyModuleKeys({
  device,
  onReadConfig,
  onReadKeypress,
  onWriteConfig,
  appendLog,
  deviceKey,
  isMagkeyModule,
}: UseMagkeyModuleKeysArgs) {
  const [keys, setKeys] = useState<KeyConfigState[]>([]);
  const [ignoreBaseline, setIgnoreBaseline] = useState(false);

  const logMagkeyReadError = (error: unknown) =>
    appendLog(`magkey read err: ${formatErrorMessage(error)}`);
  const logKeypressReadError = (error: unknown) =>
    appendLog(`keypress read err: ${formatErrorMessage(error)}`);

  const updateKeys = (mapper: (key: KeyConfigState, idx: number) => KeyConfigState) => {
    setKeys((prev) => prev.map((key, idx) => mapper(key, idx)));
  };

  const updateKeyByIndex: UpdateKeyByIndex = (idx, updater) => {
    updateKeys((key, keyIdx) => (keyIdx === idx ? updater(key) : key));
  };

  const updateKey = (idx: number, patch: Partial<KeyConfigState>) => {
    updateKeyByIndex(idx, (key) => ({ ...key, ...patch }));
  };

  useEffect(() => {
    if (!device || !isMagkeyModule) {
      setKeys([]);
      setIgnoreBaseline(false);
      return;
    }

    const initialKeys = createInitialKeyStates(device);
    setKeys(initialKeys);
    let cancelled = false;

    const loadAll = async () => {
      await loadKeysSequentially({
        keys: initialKeys,
        updateKeyByIndex,
        readKeyState: (row, col) =>
          readConfigAndBaseline({
            row,
            col,
            onReadConfig,
            onReadKeypress,
            logMagkeyReadError,
            logKeypressReadError,
          }),
        logMagkeyReadError,
        isCancelled: () => cancelled,
      });
    };

    void loadAll();
    return () => {
      cancelled = true;
    };
  }, [device, deviceKey, isMagkeyModule, onReadConfig, onReadKeypress]);

  const handleRead = async (idx: number) => {
    await readKeyAtIndex({
      idx,
      keys,
      updateKeyByIndex,
      readKeyState: (row, col) =>
        readConfigAndBaseline({
          row,
          col,
          onReadConfig,
          onReadKeypress,
          logMagkeyReadError,
          logKeypressReadError,
        }),
      logMagkeyReadError,
    });
  };

  const commitWrite = (idx: number) =>
    writeKeyAtIndex({
      idx,
      keys,
      updateKeyByIndex,
      onWriteConfig,
    });

  const handleChangeKeyRelease = (idx: number, next: number) => {
    if (!keys[idx]?.valid) return;
    updateKeyByIndex(idx, (currentKey) => ({
      ...currentKey,
      ...getKeyReleaseState(currentKey, next),
    }));
  };

  const handleChangeKeyRapid = (idx: number, next: boolean) => {
    if (!keys[idx]?.valid) return;
    updateKeyByIndex(idx, (currentKey) => {
      const nextState = getRapidToggleForConfig(
        currentKey.rapid,
        next,
        currentKey.release,
        currentKey.releaseBeforeRapid,
      );
      return {
        ...currentKey,
        releaseBeforeRapid: nextState.releaseBeforeRapid,
        release: nextState.release,
        rapid: nextState.rapid,
      };
    });
  };

  return {
    keys,
    setKeys,
    ignoreBaseline,
    setIgnoreBaseline,
    updateKey,
    updateKeyByIndex,
    handleChangeKeyRelease,
    handleChangeKeyRapid,
    handleRead,
    commitWrite,
  };
}
