import {
  HIDCommandValueID,
  KBC_ParamID,
  SetDisplayKeypressTargetCmdT,
} from '@/generated/pendant/v2';
import { convertPkttToUint8Array } from '@/lib/flatc';
import { getTrackballConnected } from '@/lib/getTrackballConnected';
import { send } from '@/lib/hid';
import type { SchemaItem } from '@/lib/schema';
import { useDeviceStore } from '@/store/deviceStore';
import { useParamStore, type ParamValue } from '@/store/paramStore';
import { APICommand } from '@/types/protocol';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface ModeSettingsActionsArgs {
  readParam: (p: SchemaItem) => Promise<ParamValue>;
  commitParam: (p: SchemaItem, val: ParamValue) => Promise<void>;
}

const DISPLAY_MODE_KEYPRESS = 2;

export function useModeSettingsActions({ readParam, commitParam }: ModeSettingsActionsArgs) {
  const { deviceRef, setTrackballConnected, setTrackballFlagCount, setDisplayMode, setLedMode } =
    useDeviceStore(
      useShallow((state) => ({
        deviceRef: state.deviceRef,
        setTrackballConnected: state.setTrackballConnected,
        setTrackballFlagCount: state.setTrackballFlagCount,
        setDisplayMode: state.setDisplayMode,
        setLedMode: state.setLedMode,
      })),
    );
  const { schema, setParam, setLoadedFor } = useParamStore(
    useShallow((state) => ({
      schema: state.schema,
      setParam: state.setParam,
      setLoadedFor: state.setLoadedFor,
    })),
  );

  const getSchemaItem = useCallback(
    (key: 'display_mode' | 'led_base_mode', expectedId: KBC_ParamID) => {
      const item = schema.find((candidate) => candidate.key === key);
      if (!item) {
        throw new Error(`${key} is missing from schema`);
      }
      const expected = Number(expectedId);
      if (item.id !== expected) {
        throw new Error(`${key} schema id mismatch: expected ${expected}, got ${item.id}`);
      }
      return item;
    },
    [schema],
  );

  const updateModeState = useCallback(
    (item: SchemaItem, value: number) => {
      setParam(item.id, value);
      setLoadedFor(item.id, true);
    },
    [setLoadedFor, setParam],
  );

  async function refreshModeSettings(): Promise<Record<number, boolean> | null> {
    const dev = deviceRef.current;
    if (!dev) {
      throw new Error('not connected');
    }

    let nextTrackballConnected: Record<number, boolean> | null = null;
    let nextTrackballFlagCount = 0;
    try {
      const trackballState = await getTrackballConnected(dev);
      if (trackballState) {
        nextTrackballConnected = trackballState.connected;
        nextTrackballFlagCount = trackballState.count;
      }
    } catch {
      nextTrackballConnected = null;
      nextTrackballFlagCount = 0;
    }

    setTrackballConnected(nextTrackballConnected);
    setTrackballFlagCount(nextTrackballFlagCount);

    const displayItem = getSchemaItem('display_mode', KBC_ParamID.KBC_display_mode);
    const ledItem = getSchemaItem('led_base_mode', KBC_ParamID.KBC_led_base_mode);
    const nextDisplay = Number(await readParam(displayItem));
    const nextLed = Number(await readParam(ledItem));
    updateModeState(displayItem, nextDisplay);
    updateModeState(ledItem, nextLed);
    setDisplayMode(nextDisplay);
    setLedMode(nextLed);
    return nextTrackballConnected;
  }

  const applyDisplayLedSettings = useCallback(
    async (nextDisplay: number, nextLed: number) => {
      const displayItem = getSchemaItem('display_mode', KBC_ParamID.KBC_display_mode);
      const ledItem = getSchemaItem('led_base_mode', KBC_ParamID.KBC_led_base_mode);
      await commitParam(displayItem, nextDisplay);
      await commitParam(ledItem, nextLed);
      updateModeState(displayItem, nextDisplay);
      updateModeState(ledItem, nextLed);
      setDisplayMode(nextDisplay);
      setLedMode(nextLed);
    },
    [commitParam, getSchemaItem, setDisplayMode, setLedMode, updateModeState],
  );

  const sendDisplayKeypressTarget = useCallback(
    async (row: number, col: number) => {
      const dev = deviceRef.current;
      if (!dev) {
        throw new Error('not connected');
      }
      const payload = convertPkttToUint8Array(
        new SetDisplayKeypressTargetCmdT(row & 0xff, col & 0xff),
      );
      await send(
        dev,
        APICommand.CUSTOM_MENU_SET_VALUE,
        HIDCommandValueID.set_display_keypress_target,
        payload,
      );
      setDisplayMode(DISPLAY_MODE_KEYPRESS);
    },
    [deviceRef, setDisplayMode],
  );

  return { refreshModeSettings, applyDisplayLedSettings, sendDisplayKeypressTarget };
}
