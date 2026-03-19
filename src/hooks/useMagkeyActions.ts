import { HIDCommandValueID, SetMagkeyConfigCmdT, type PktT } from '@/generated/pendant/v2';
import { convertPkttToUint8Array } from '@/lib/flatc';
import { getKeypress } from '@/lib/getKeypress';
import { send } from '@/lib/hid';
import { clamp, formatErrorMessage } from '@/lib/utils';
import { useDeviceStore } from '@/store/deviceStore';
import { useKeypressStore } from '@/store/keypressStore';
import { useMagkeyStore } from '@/store/magkeyStore';
import { APICommand } from '@/types/protocol';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWriteActionFeedback } from './useWriteActionFeedback';

export const parseMagkeyConfigResponse = (resp: PktT) => {
  const len = resp.headers?.dataLength ?? 0;
  if (len < 5) {
    throw new Error('マグネキー設定が取得できませんでした');
  }
  const data = resp.data;
  const actuation = (data[0] ?? 0) | ((data[1] ?? 0) << 8);
  const release = (data[2] ?? 0) | ((data[3] ?? 0) << 8);
  const rapid = (data[4] ?? 0) !== 0;
  return { actuation, release, rapid };
};

export function useMagkeyActions() {
  const { deviceRef, appendLog } = useDeviceStore(
    useShallow((state) => ({
      deviceRef: state.deviceRef,
      appendLog: state.appendLog,
    })),
  );
  const { runWriteAction } = useWriteActionFeedback();

  const { keypressRow, keypressCol, setKeypressValue, setKeypressIsMagkey, setKeypressBusy } =
    useKeypressStore(
      useShallow((state) => ({
        keypressRow: state.keypressRow,
        keypressCol: state.keypressCol,
        setKeypressValue: state.setKeypressValue,
        setKeypressIsMagkey: state.setKeypressIsMagkey,
        setKeypressBusy: state.setKeypressBusy,
      })),
    );

  const {
    magkeyActuation,
    magkeyRelease,
    magkeyRapid,
    setMagkeyActuation,
    setMagkeyRelease,
    setMagkeyRapid,
    setMagkeyReleaseBeforeRapid,
    setMagkeyConfigLoaded,
    setMagkeyConfigBusy,
  } = useMagkeyStore(
    useShallow((state) => ({
      magkeyActuation: state.magkeyActuation,
      magkeyRelease: state.magkeyRelease,
      magkeyRapid: state.magkeyRapid,
      setMagkeyActuation: state.setMagkeyActuation,
      setMagkeyRelease: state.setMagkeyRelease,
      setMagkeyRapid: state.setMagkeyRapid,
      setMagkeyReleaseBeforeRapid: state.setMagkeyReleaseBeforeRapid,
      setMagkeyConfigLoaded: state.setMagkeyConfigLoaded,
      setMagkeyConfigBusy: state.setMagkeyConfigBusy,
    })),
  );

  const readKeypress = async () => {
    const dev = deviceRef.current;
    if (!dev) {
      appendLog('keypress err: not connected');
      return;
    }
    setKeypressBusy(true);
    try {
      const result = await getKeypress(dev, keypressRow, keypressCol);
      setKeypressValue(result?.value ?? null);
      setKeypressIsMagkey(result?.isMagkey ?? null);
    } catch (e) {
      appendLog(`keypress err: ${formatErrorMessage(e)}`);
    } finally {
      setKeypressBusy(false);
    }
  };

  const readKeypressFor = useCallback(
    async (row: number, col: number) => {
      const dev = deviceRef.current;
      if (!dev) throw new Error('not connected');
      const result = await getKeypress(dev, row, col);
      return result?.value ?? null;
    },
    [deviceRef],
  );

  const readMagkeyConfigFor = useCallback(
    async (row: number, col: number) => {
      const dev = deviceRef.current;
      if (!dev) throw new Error('not connected');
      const payload = new Uint8Array([row & 0xff, col & 0xff]);
      const resp = await send(
        dev,
        APICommand.CUSTOM_MENU_GET_VALUE,
        HIDCommandValueID.get_magkey_config,
        payload,
      );
      return parseMagkeyConfigResponse(resp);
    },
    [deviceRef],
  );

  const commitMagkeyConfigFor = useCallback(
    async (row: number, col: number, actuation: number, release: number, rapid: boolean) => {
      const nextActuation = clamp(Math.round(actuation), 0, 0x0fff);
      const nextRelease = clamp(Math.round(release), 0, 0x0fff);
      const dev = deviceRef.current;
      if (!dev) throw new Error('not connected');
      const payload = convertPkttToUint8Array(
        new SetMagkeyConfigCmdT(
          row & 0xff,
          col & 0xff,
          nextActuation & 0xffff,
          nextRelease & 0xffff,
          rapid,
        ),
      );
      await send(
        dev,
        APICommand.CUSTOM_MENU_SET_VALUE,
        HIDCommandValueID.set_magkey_config,
        payload,
      );
      return { actuation: nextActuation, release: nextRelease, rapid };
    },
    [deviceRef],
  );

  const readMagkeyConfig = async () => {
    if (!deviceRef.current) {
      appendLog('magkey err: not connected');
      return;
    }
    setMagkeyConfigBusy(true);
    try {
      const config = await readMagkeyConfigFor(keypressRow, keypressCol);
      setMagkeyActuation(config.actuation);
      setMagkeyRelease(config.release);
      setMagkeyRapid(config.rapid);
      if (!config.rapid) {
        setMagkeyReleaseBeforeRapid(config.release);
      }
      setMagkeyConfigLoaded(true);
    } catch (e) {
      appendLog(`magkey read err: ${formatErrorMessage(e)}`);
      setMagkeyConfigLoaded(false);
    } finally {
      setMagkeyConfigBusy(false);
    }
  };

  const commitWriteMagkeyConfig = async () => {
    if (!deviceRef.current) {
      throw new Error('not connected');
    }
    setMagkeyConfigBusy(true);
    try {
      const config = await commitMagkeyConfigFor(
        keypressRow,
        keypressCol,
        magkeyActuation,
        magkeyRelease,
        magkeyRapid,
      );
      setMagkeyActuation(config.actuation);
      setMagkeyRelease(config.release);
      if (!config.rapid) {
        setMagkeyReleaseBeforeRapid(config.release);
      }
      setMagkeyConfigLoaded(true);
      return config;
    } catch (e) {
      setMagkeyConfigLoaded(false);
      throw e;
    } finally {
      setMagkeyConfigBusy(false);
    }
  };

  const writeMagkeyConfig = () =>
    runWriteAction(commitWriteMagkeyConfig, {
      logPrefix: 'magkey write err',
      successToast: { title: 'Saved', description: 'Magkey settings updated' },
      errorToast: { title: 'Failed' },
    });

  return {
    readKeypress,
    readKeypressFor,
    readMagkeyConfig,
    readMagkeyConfigFor,
    commitMagkeyConfigFor,
    writeMagkeyConfig,
  };
}
