import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { DeviceListCard } from '@/components/DeviceListCard';
import { DeviceDetailsDrawer } from '@/components/DeviceDetailsDrawer';
import { MagkeyModulePanel } from '@/components/MagkeyModulePanel';
import type { DeviceItemT } from '@/generated/pendant/v2';
import { updateDeviceNickname } from '@/lib/deviceNicknames';
import { toHex } from '@/lib/format';
import { useSettingsActionFeedback } from '@/hooks/useSettingsActionFeedback';
import { useDeviceStore } from '@/store/deviceStore';
import { useShallow } from 'zustand/react/shallow';

interface Props {
  onRefresh: () => Promise<void>;
  onUpdateAddress: (device: DeviceItemT, nextAddr: number) => Promise<void>;
  onReadMagkeyConfigFor: (
    row: number,
    col: number,
  ) => Promise<{
    actuation: number;
    release: number;
    rapid: boolean;
  }>;
  onReadKeypressFor: (row: number, col: number) => Promise<number | null>;
  onWriteMagkeyConfigFor: (
    row: number,
    col: number,
    actuation: number,
    release: number,
    rapid: boolean,
  ) => Promise<{ actuation: number; release: number; rapid: boolean }>;
}

export const DeviceSection: FC<Props> = ({
  onRefresh,
  onUpdateAddress,
  onReadMagkeyConfigFor,
  onReadKeypressFor,
  onWriteMagkeyConfigFor,
}) => {
  const { createWriteAction } = useSettingsActionFeedback();
  const { devList, deviceNicknames, selectedDev, setSelectedDev, setDeviceNicknames } =
    useDeviceStore(
      useShallow((state) => ({
        devList: state.devList,
        deviceNicknames: state.deviceNicknames,
        selectedDev: state.selectedDev,
        setSelectedDev: state.setSelectedDev,
        setDeviceNicknames: state.setDeviceNicknames,
      })),
    );
  const [magkeyDevice, setMagkeyDevice] = useState<DeviceItemT | null>(null);
  const selectedNickname =
    selectedDev && selectedDev.uid !== BigInt('0')
      ? deviceNicknames[selectedDev.uid.toString()]
      : undefined;
  const updateNickname = (device: DeviceItemT, nickname: string) => {
    if (device.uid === BigInt('0')) return;
    setDeviceNicknames(updateDeviceNickname(deviceNicknames, device.uid, nickname));
  };
  const isSameDevice = useCallback(
    (a: DeviceItemT, b: DeviceItemT) =>
      a.uid !== BigInt('0')
        ? a.uid === b.uid
        : a.ch === b.ch && a.addr === b.addr && a.type === b.type && a.shift === b.shift,
    [],
  );

  const handleRefresh = createWriteAction(onRefresh, {
    logPrefix: 'rescan devices err',
    successToast: { title: 'Refreshed', description: 'Device list rescanned' },
    errorToast: { title: 'Failed' },
  });
  const handleUpdateAddress = createWriteAction(onUpdateAddress, {
    logPrefix: 'update address err',
    successToast: (_, __, nextAddr) => ({
      title: 'Saved',
      description: `I2C address updated to ${toHex(nextAddr)}`,
    }),
    errorToast: { title: 'Failed' },
    rethrow: true,
  });

  useEffect(() => {
    if (!magkeyDevice) return;
    const stillExists = devList.some((device) => isSameDevice(device, magkeyDevice));
    if (!stillExists) setMagkeyDevice(null);
  }, [devList, isSameDevice, magkeyDevice]);

  return (
    <>
      <DeviceListCard
        items={devList}
        nicknames={deviceNicknames}
        onRefresh={() => {
          void handleRefresh();
        }}
        onSelect={(device) => {
          setMagkeyDevice(null);
          setSelectedDev(device);
        }}
        onOpenMagkey={(device) => {
          setSelectedDev(null);
          setMagkeyDevice(device);
        }}
        onUpdateAddress={handleUpdateAddress}
        onUpdateNickname={updateNickname}
      />
      <DeviceDetailsDrawer
        device={selectedDev}
        onClose={() => setSelectedDev(null)}
        onUpdateAddress={handleUpdateAddress}
        onUpdateNickname={updateNickname}
        nickname={selectedNickname}
      />
      <MagkeyModulePanel
        device={magkeyDevice}
        onReadConfig={onReadMagkeyConfigFor}
        onReadKeypress={onReadKeypressFor}
        onWriteConfig={onWriteMagkeyConfigFor}
        onClose={() => setMagkeyDevice(null)}
      />
    </>
  );
};
