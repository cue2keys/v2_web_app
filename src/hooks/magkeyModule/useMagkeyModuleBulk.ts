import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { clampMagkey } from '@/lib/utils';
import { writeConfigToAllKeys, type BatchWriteSummary } from './operations';
import { loadMagkeyPresets, saveMagkeyPreset } from './presets';
import {
  applyConfigToValidKeys,
  getBulkReleaseState,
  getRapidToggleForConfig,
  normalizeMagkeyConfig,
} from './state';
import type { KeyConfigState, MagkeyConfig, MagkeyPreset, UseMagkeyModuleArgs } from './types';
import type { UpdateKeyByIndex } from './useMagkeyModuleKeys';

interface UseMagkeyModuleBulkArgs extends Pick<UseMagkeyModuleArgs, 'onWriteConfig'> {
  keys: KeyConfigState[];
  setKeys: Dispatch<SetStateAction<KeyConfigState[]>>;
  updateKeyByIndex: UpdateKeyByIndex;
}

export function useMagkeyModuleBulk({
  onWriteConfig,
  keys,
  setKeys,
  updateKeyByIndex,
}: UseMagkeyModuleBulkArgs) {
  const [bulkActuation, setBulkActuation] = useState(0);
  const [bulkRelease, setBulkRelease] = useState(0);
  const [bulkRapid, setBulkRapid] = useState(false);
  const [bulkReleaseBeforeRapid, setBulkReleaseBeforeRapid] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<MagkeyPreset[]>([]);

  useEffect(() => {
    setPresets(loadMagkeyPresets());
  }, []);

  const applyBulkConfig = (
    config: MagkeyConfig,
    options?: {
      syncBulkState?: boolean;
    },
  ) => {
    const nextConfig = normalizeMagkeyConfig(config);
    if (options?.syncBulkState) {
      setBulkActuation(nextConfig.actuation);
      setBulkRelease(nextConfig.release);
      setBulkRapid(nextConfig.rapid);
      if (!nextConfig.rapid) {
        setBulkReleaseBeforeRapid(nextConfig.release);
      }
    }
    setKeys((prev) => applyConfigToValidKeys(prev, nextConfig));
    return nextConfig;
  };

  const commitApplyAll = async (config?: MagkeyConfig): Promise<BatchWriteSummary> => {
    const hasConfig =
      config != null && typeof config.actuation === 'number' && typeof config.release === 'number';
    const nextConfig = applyBulkConfig(
      hasConfig
        ? config
        : {
            actuation: bulkActuation,
            release: bulkRelease,
            rapid: bulkRapid,
          },
      { syncBulkState: hasConfig },
    );

    setBulkBusy(true);
    try {
      return await writeConfigToAllKeys({
        keys,
        config: nextConfig,
        updateKeyByIndex,
        onWriteConfig,
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const nextPreset: MagkeyPreset = {
      name,
      actuation: clampMagkey(bulkActuation),
      release: clampMagkey(bulkRelease),
      rapid: bulkRapid,
    };
    setPresets((prev) => saveMagkeyPreset(nextPreset, prev));
    setPresetName('');
  };

  const handleChangeBulkRelease = (next: number) => {
    const nextState = getBulkReleaseState(next, bulkRapid, bulkReleaseBeforeRapid);
    setBulkRelease(nextState.release);
    setBulkReleaseBeforeRapid(nextState.releaseBeforeRapid);
  };

  const handleChangeBulkRapid = (next: boolean) => {
    const nextState = getRapidToggleForConfig(bulkRapid, next, bulkRelease, bulkReleaseBeforeRapid);
    setBulkRelease(nextState.release);
    setBulkReleaseBeforeRapid(nextState.releaseBeforeRapid);
    setBulkRapid(nextState.rapid);
  };

  return {
    bulkActuation,
    setBulkActuation,
    bulkRelease,
    setBulkRelease: handleChangeBulkRelease,
    bulkRapid,
    setBulkRapid: handleChangeBulkRapid,
    bulkBusy,
    presetName,
    setPresetName,
    presets,
    commitApplyAll,
    handleSavePreset,
  };
}
