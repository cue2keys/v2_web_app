import { useMemo } from 'react';
import { ModuleType } from '@/generated/pendant/v2/module-type';
import { getMagkeyReleasePoint, getMagkeyReleaseUi } from '@/lib/magkeyConfig';
import { useDeviceStore } from '@/store/deviceStore';
import { useSettingsActionFeedback } from './useSettingsActionFeedback';
import type {
  KeyConfigState,
  MagkeyConfig,
  MagkeyPreset,
  UseMagkeyModuleArgs,
} from './magkeyModule/types';
import { useMagkeyModuleBulk } from './magkeyModule/useMagkeyModuleBulk';
import { useMagkeyModuleKeys } from './magkeyModule/useMagkeyModuleKeys';

export type { KeyConfigState, MagkeyConfig, MagkeyPreset, UseMagkeyModuleArgs };

export function useMagkeyModule({
  device,
  onReadConfig,
  onReadKeypress,
  onWriteConfig,
}: UseMagkeyModuleArgs) {
  const appendLog = useDeviceStore((state) => state.appendLog);
  const { createWriteAction } = useSettingsActionFeedback();
  const isMagkeyModule = device?.type === ModuleType.V2_MagKeys4;
  const deviceKey = useMemo(() => {
    if (!device) return 'none';
    return device.uid !== BigInt('0')
      ? `uid:${device.uid.toString()}`
      : `ch:${device.ch}-addr:${device.addr}-type:${device.type}-shift:${device.shift}`;
  }, [device]);

  const {
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
  } = useMagkeyModuleKeys({
    device,
    onReadConfig,
    onReadKeypress,
    onWriteConfig,
    appendLog,
    deviceKey,
    isMagkeyModule,
  });

  const {
    bulkActuation,
    setBulkActuation,
    bulkRelease,
    setBulkRelease,
    bulkRapid,
    setBulkRapid,
    bulkBusy,
    presetName,
    setPresetName,
    presets,
    commitApplyAll,
    handleSavePreset,
  } = useMagkeyModuleBulk({
    onWriteConfig,
    keys,
    setKeys,
    updateKeyByIndex,
  });

  const handleWrite = useMemo(
    () =>
      createWriteAction(commitWrite, {
        logPrefix: 'magkey write err',
        successToast: (_, idx) => ({
          title: 'Saved',
          description: `Key ${idx + 1} updated`,
        }),
        errorToast: { title: 'Failed' },
      }),
    [commitWrite, createWriteAction],
  );

  const bulkWriteActionOptions = useMemo(
    () => ({
      logPrefix: 'magkey bulk write err',
      successToast: (summary: { attempted: number; succeeded: number; failed: number }) =>
        summary.failed === 0
          ? {
              title: 'Saved',
              description: `${summary.succeeded} magkey settings written`,
            }
          : undefined,
      errorToast: { title: 'Failed' },
      resultError: (summary: { attempted: number; succeeded: number; failed: number }) =>
        summary.failed > 0
          ? {
              title: 'Failed',
              description: `${summary.succeeded}/${summary.attempted} magkey settings written. Check log.`,
            }
          : undefined,
      afterResult: (summary: { failures: string[] }) => {
        summary.failures.forEach((message) => appendLog(`magkey write err: ${message}`));
      },
    }),
    [appendLog],
  );

  const handleApplyAll = useMemo(
    () => createWriteAction(() => commitApplyAll(), bulkWriteActionOptions),
    [bulkWriteActionOptions, commitApplyAll, createWriteAction],
  );

  const handleApplyPreset = useMemo(
    () =>
      createWriteAction((preset: MagkeyPreset) => commitApplyAll(preset), bulkWriteActionOptions),
    [bulkWriteActionOptions, commitApplyAll, createWriteAction],
  );

  const { label: releaseLabel, hint: releaseHint } = getMagkeyReleaseUi(bulkRapid);
  const bulkReleasePoint = getMagkeyReleasePoint({
    actuation: bulkActuation,
    release: bulkRelease,
    rapid: bulkRapid,
  });

  return {
    keys,
    ignoreBaseline,
    setIgnoreBaseline,
    bulkActuation,
    setBulkActuation,
    bulkRelease,
    setBulkRelease,
    bulkRapid,
    setBulkRapid,
    bulkBusy,
    presetName,
    setPresetName,
    presets,
    isMagkeyModule,
    deviceKey,
    releaseLabel,
    releaseHint,
    bulkReleasePoint,
    updateKey,
    handleChangeKeyRelease,
    handleChangeKeyRapid,
    handleRead,
    handleWrite,
    handleApplyAll,
    handleSavePreset,
    handleApplyPreset,
  };
}
