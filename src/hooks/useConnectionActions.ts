import { HIDCommandValueID, type PktT } from '@/generated/pendant/v2';
import { connect, removeInputDrain, send } from '@/lib/hid';
import { logger } from '@/lib/logger';
import { recvDeviceInfo } from '@/lib/recvDeviceInfo';
import type { SchemaItem } from '@/lib/schema';
import { formatErrorMessage } from '@/lib/utils';
import { useDeviceStore } from '@/store/deviceStore';
import { useParamStore } from '@/store/paramStore';
import { resetAllStores } from '@/store/resetStores';
import { APICommand } from '@/types/protocol';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface ConnectionActionsArgs {
  buildLoadedFromSchema: (items: SchemaItem[]) => Record<number, boolean>;
  readAll: () => Promise<void>;
  refreshModeSettings: () => Promise<Record<number, boolean> | null>;
}

export function useConnectionActions({
  buildLoadedFromSchema,
  readAll,
  refreshModeSettings,
}: ConnectionActionsArgs) {
  const { deviceRef, appendLog, setConnected, setDemoMode, setFwInfo, setDevList } = useDeviceStore(
    useShallow((state) => ({
      deviceRef: state.deviceRef,
      appendLog: state.appendLog,
      setConnected: state.setConnected,
      setDemoMode: state.setDemoMode,
      setFwInfo: state.setFwInfo,
      setDevList: state.setDevList,
    })),
  );

  const { schema, setLoaded } = useParamStore(
    useShallow((state) => ({
      schema: state.schema,
      setLoaded: state.setLoaded,
    })),
  );

  const clearConnection = useCallback(
    (reason?: string) => {
      const dev = deviceRef.current;
      if (dev) {
        try {
          removeInputDrain(dev);
          void dev.close();
        } catch {}
      }
      deviceRef.current = null;
      resetAllStores();
      if (reason) appendLog(reason);
    },
    [appendLog, deviceRef],
  );

  function parseGetInfo(u8: PktT): string {
    try {
      const dataLength = u8.headers?.dataLength ?? u8.data.length;
      const data = u8.data.slice(0, dataLength);
      logger.log(data);
      const zeroIndex = data.findIndex((b) => b === 0);
      const ascii = Array.from(zeroIndex >= 0 ? data.slice(0, zeroIndex) : data)
        .map((b) => String.fromCharCode(b & 0x7f))
        .join('')
        .trim();
      return ascii || '';
    } catch {
      return '';
    }
  }

  function devInfoText(): string {
    const device = deviceRef.current;
    if (!device) return '(not connected)';
    return `${device.productName ?? 'HID'}`;
  }

  async function getDeviceInfo(dev: HIDDevice): Promise<string> {
    logger.log('getting device info...');
    try {
      const resp = await send(
        dev,
        APICommand.CUSTOM_MENU_GET_VALUE,
        HIDCommandValueID.get_fw_version,
        new Uint8Array(),
      );
      logger.debug('GET_INFO response:', resp);
      const info = parseGetInfo(resp);
      return info;
    } catch (e) {
      throw new Error('GET_INFO failed: ' + formatErrorMessage(e));
    }
  }

  async function refreshDeviceList() {
    logger.log('Refreshing device list...');
    if (!deviceRef.current) {
      logger.error('no device connected');
      throw new Error('not connected');
    }
    try {
      const list = await recvDeviceInfo(
        deviceRef.current,
        APICommand.CUSTOM_MENU_GET_VALUE,
        HIDCommandValueID.get_device_list,
      );
      setDevList(list);
      logger.debug(`device list: ${list.length} devices`);
      return list;
    } catch (e) {
      throw new Error('device list failed: ' + formatErrorMessage(e));
    }
  }

  async function onConnect() {
    const dev = await connect();
    if (!dev) {
      logger.warn('no device selected');
      return;
    }
    deviceRef.current = dev;
    setConnected(false);

    try {
      const info = await getDeviceInfo(dev);
      setFwInfo(info);
      await refreshDeviceList();
      try {
        await refreshModeSettings();
      } catch (e) {
        appendLog(`mode settings err: ${formatErrorMessage(e)}`);
      }
      setLoaded(buildLoadedFromSchema(schema));
      await readAll();
      setDemoMode(false);
      setConnected(true);
    } catch (e) {
      clearConnection(`connect err: ${formatErrorMessage(e)}`);
    }
  }

  return {
    clearConnection,
    onConnect,
    devInfoText,
    getDeviceInfo,
    parseGetInfo,
    refreshDeviceList,
  };
}
