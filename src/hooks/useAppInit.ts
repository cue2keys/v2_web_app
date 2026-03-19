import { useEffect } from 'react';
import { readDeviceNicknames } from '@/lib/deviceNicknames';
import { mapKbConfigToSchema } from '@/lib/schema';
import { formatErrorMessage } from '@/lib/utils';
import { useDeviceStore } from '@/store/deviceStore';
import { useParamStore } from '@/store/paramStore';
import type { SchemaItem, KbConfigItem } from '@/lib/schema';

interface AppInitArgs {
  kbConfigJson: KbConfigItem[];
  buildParamsFromSchema: (items: SchemaItem[]) => Record<number, unknown>;
  buildLoadedFromSchema: (items: SchemaItem[]) => Record<number, boolean>;
  clearConnection: (reason?: string) => void;
}

export function useAppInit({
  kbConfigJson,
  buildParamsFromSchema,
  buildLoadedFromSchema,
  clearConnection,
}: AppInitArgs) {
  const { appendLog, setDeviceNicknames, deviceRef } = useDeviceStore((state) => ({
    appendLog: state.appendLog,
    setDeviceNicknames: state.setDeviceNicknames,
    deviceRef: state.deviceRef,
  }));
  const { setSchema, setParams, setLoaded } = useParamStore((state) => ({
    setSchema: state.setSchema,
    setParams: state.setParams,
    setLoaded: state.setLoaded,
  }));

  // Load kb_config.json and build schema
  useEffect(() => {
    function load() {
      try {
        const sc = mapKbConfigToSchema(kbConfigJson);
        setSchema(sc);
        setParams(buildParamsFromSchema(sc) as Parameters<typeof setParams>[0]);
        setLoaded(buildLoadedFromSchema(sc));
      } catch (e) {
        appendLog('failed to load kb_config.json: ' + formatErrorMessage(e));
      }
    }
    load();
  }, [
    appendLog,
    buildLoadedFromSchema,
    buildParamsFromSchema,
    kbConfigJson,
    setLoaded,
    setParams,
    setSchema,
  ]);

  useEffect(() => {
    setDeviceNicknames(readDeviceNicknames());
  }, [setDeviceNicknames]);

  useEffect(() => {
    const hid = navigator?.hid;
    if (!hid?.addEventListener) return;
    const onDisconnect = (e: HIDConnectionEvent) => {
      if (!deviceRef.current) return;
      if (e.device === deviceRef.current) {
        clearConnection('device disconnected');
      }
    };
    hid.addEventListener('disconnect', onDisconnect);
    return () => {
      hid.removeEventListener('disconnect', onDisconnect);
    };
  }, [clearConnection, deviceRef]);
}
