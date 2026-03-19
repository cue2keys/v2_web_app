import type { SchemaItem } from '@/lib/schema';
import type { ParamValue } from '@/store/paramStore';
import { useConnectionActions } from './useConnectionActions';
import { useI2CActions } from './useI2CActions';
import { useMagkeyActions } from './useMagkeyActions';
import { useModeSettingsActions } from './useModeSettingsActions';

interface UseDeviceActionsArgs {
  buildLoadedFromSchema: (items: SchemaItem[]) => Record<number, boolean>;
  readAll: () => Promise<void>;
  readParam: (p: SchemaItem) => Promise<ParamValue>;
  commitParam: (p: SchemaItem, val: ParamValue) => Promise<void>;
}

export function useDeviceActions({
  buildLoadedFromSchema,
  readAll,
  readParam,
  commitParam,
}: UseDeviceActionsArgs) {
  const { refreshModeSettings, applyDisplayLedSettings, sendDisplayKeypressTarget } =
    useModeSettingsActions({
      readParam,
      commitParam,
    });

  const { clearConnection, onConnect, devInfoText, refreshDeviceList } = useConnectionActions({
    buildLoadedFromSchema,
    readAll,
    refreshModeSettings,
  });

  const { updateI2CAddress, updateStaticI2CAddress, onRescanDevices } = useI2CActions({
    refreshDeviceList,
    refreshModeSettings,
  });

  const {
    readKeypress,
    readKeypressFor,
    readMagkeyConfig,
    readMagkeyConfigFor,
    commitMagkeyConfigFor,
    writeMagkeyConfig,
  } = useMagkeyActions();

  return {
    clearConnection,
    devInfoText,
    onConnect,
    refreshDeviceList,
    refreshModeSettings,
    readKeypress,
    readKeypressFor,
    readMagkeyConfig,
    readMagkeyConfigFor,
    commitMagkeyConfigFor,
    writeMagkeyConfig,
    applyDisplayLedSettings,
    sendDisplayKeypressTarget,
    updateI2CAddress,
    updateStaticI2CAddress,
    onRescanDevices,
  };
}
