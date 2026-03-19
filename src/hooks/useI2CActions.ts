import { Consts as ModuleV2Consts } from '@/generated/module/v2/consts';
import { HIDCommandValueID, SetI2CAddrCmdT, type DeviceItemT } from '@/generated/pendant/v2';
import { SetI2CAddrCmdErrorCode } from '@/generated/pendant/v2/set-i2-caddr-cmd-error-code';
import { convertPkttToUint8Array, readSetI2CAddrCmdResponseTFromUint8Array } from '@/lib/flatc';
import { send } from '@/lib/hid';
import { logger } from '@/lib/logger';
import { useDeviceStore } from '@/store/deviceStore';
import { APICommand } from '@/types/protocol';
import { useShallow } from 'zustand/react/shallow';

interface I2CActionsArgs {
  refreshDeviceList: () => Promise<DeviceItemT[]>;
  refreshModeSettings: () => Promise<Record<number, boolean> | null>;
}

export function useI2CActions({ refreshDeviceList, refreshModeSettings }: I2CActionsArgs) {
  const { deviceRef, selectedDev, setSelectedDev } = useDeviceStore(
    useShallow((state) => ({
      deviceRef: state.deviceRef,
      selectedDev: state.selectedDev,
      setSelectedDev: state.setSelectedDev,
    })),
  );

  const formatSetI2CAddrError = (code: SetI2CAddrCmdErrorCode) => {
    switch (code) {
      case SetI2CAddrCmdErrorCode.ADDRESS_UNCHANGED:
        return 'アドレスが変更されていません';
      case SetI2CAddrCmdErrorCode.INVALID_NEW_ADDRESS:
        return '無効なアドレスです';
      case SetI2CAddrCmdErrorCode.ALREADY_IN_USE:
        return 'アドレスが既に使用されています';
      case SetI2CAddrCmdErrorCode.WRITE_FAILED:
        return '書き込みに失敗しました';
      default:
        return 'アドレス更新に失敗しました';
    }
  };

  const updateI2CAddressByValue = async (ch: number, oldAddr: number, nextAddr: number) => {
    const dev = deviceRef.current;
    if (!dev) throw new Error('not connected');
    const payload = convertPkttToUint8Array(
      new SetI2CAddrCmdT(ch & 0xff, oldAddr & 0xff, nextAddr & 0xff),
    );
    const recv = await send(
      dev,
      APICommand.CUSTOM_MENU_SET_VALUE,
      HIDCommandValueID.update_i2c_address,
      payload,
    );

    const resp = readSetI2CAddrCmdResponseTFromUint8Array(new Uint8Array(recv.data));
    logger.log(`[updateI2CAddress] resp:`, resp.success, resp.errorCode);

    if (!resp.success || resp.errorCode !== SetI2CAddrCmdErrorCode.SUCCESS) {
      throw new Error(formatSetI2CAddrError(resp.errorCode));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const list = await refreshDeviceList();
    if (selectedDev) {
      const byUid = selectedDev.uid !== BigInt('0') && list.find((d) => d.uid === selectedDev.uid);
      const next =
        byUid ??
        list.find(
          (d) => d.ch === selectedDev.ch && d.addr === nextAddr && d.type === selectedDev.type,
        );
      if (next) setSelectedDev(next);
    }
  };

  const updateI2CAddress = async (device: DeviceItemT, nextAddr: number) =>
    updateI2CAddressByValue(device.ch, device.addr, nextAddr);

  const updateStaticI2CAddress = async (nextAddr: number) =>
    updateI2CAddressByValue(0, ModuleV2Consts.STATIC_I2C_ADDRESS, nextAddr);

  const rescanDevices = async () => {
    const dev = deviceRef.current;
    if (!dev) throw new Error('not connected');
    await send(
      dev,
      APICommand.CUSTOM_MENU_SET_VALUE,
      HIDCommandValueID.rescan_i2c_devices,
      new Uint8Array(),
    );
  };

  const onRescanDevices = async () => {
    await rescanDevices();
    await refreshDeviceList();
    try {
      await refreshModeSettings();
    } catch {}
  };

  return {
    updateI2CAddress,
    updateStaticI2CAddress,
    updateI2CAddressByValue,
    formatSetI2CAddrError,
    rescanDevices,
    onRescanDevices,
  };
}
