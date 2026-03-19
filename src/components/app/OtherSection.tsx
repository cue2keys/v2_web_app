import type { FC } from 'react';
import { Consts as ModuleV2Consts } from '@/generated/module/v2/consts';
import { useFirmwareRelease } from '@/hooks/useFirmwareRelease';
import { toHex } from '@/lib/format';
import { compareFirmwareVersions } from '@/lib/firmwareRelease';
import type { SchemaItem } from '@/lib/schema';
import type { ParamValue } from '@/store/paramStore';
import { StaticAddressUpdateCard } from '../StaticAddressUpdateCard';
import { ControlSection, type ControlSectionCommonProps } from './ControlSection';
import { JsonSection } from './JsonSection';
import { ParamSection } from './ParamSection';
import { Button } from '../ui/button';
import { Card, CardContent, CardTitle } from '../ui/card';
import { useDeviceStore } from '@/store/deviceStore';

interface Props {
  onParamChange: (p: SchemaItem, v: ParamValue) => void;
  onReadParam: (p: SchemaItem) => Promise<void>;
  onWriteParam: (p: SchemaItem) => Promise<void>;
  onReadAll: () => Promise<void>;
  onWriteAll: () => Promise<void>;
  onResetDefaults: () => void;
  onExport: (options?: { includeSettings?: boolean; includeNicknames?: boolean }) => Promise<void>;
  onImport: () => boolean;
  onUpdateStaticAddress: (nextAddr: number) => Promise<void>;
  controlSectionCommonProps: ControlSectionCommonProps;
}

export const OtherSection: FC<Props> = ({
  onParamChange,
  onReadParam,
  onWriteParam,
  onReadAll,
  onWriteAll,
  onResetDefaults,
  onExport,
  onImport,
  onUpdateStaticAddress,
  controlSectionCommonProps,
}) => {
  const {
    fwInfo,
    deviceRef,
    latestFirmwareVersion,
    latestReleaseUrl,
    updateAvailable,
    firmwareCheckState,
  } = useDeviceStore((state) => ({
    fwInfo: state.fwInfo,
    deviceRef: state.deviceRef,
    latestFirmwareVersion: state.latestFirmwareVersion,
    latestReleaseUrl: state.latestReleaseUrl,
    updateAvailable: state.updateAvailable,
    firmwareCheckState: state.firmwareCheckState,
  }));
  const deviceInfo = deviceRef.current;
  useFirmwareRelease({
    currentFirmware: fwInfo,
    enabled: Boolean(deviceInfo && fwInfo),
  });

  const formatUsbId = (value?: number | null) => {
    if (value == null) return '-';
    return `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
  };
  const staticAddrLabel = `ch0 / STATIC (${toHex(ModuleV2Consts.STATIC_I2C_ADDRESS)})`;
  const staticUpdateNote =
    'ペンダントに接続したv2モジュールのアドレスを更新します。検出されない時の初期化用にご利用下さい';
  const firmwareComparison =
    fwInfo && latestFirmwareVersion ? compareFirmwareVersions(fwInfo, latestFirmwareVersion) : null;
  const firmwareStatusText = (() => {
    if (firmwareCheckState === 'checking') return '最新版を確認中';
    if (firmwareCheckState === 'error') return '最新版を取得できません';
    if (updateAvailable) return '更新できます';
    if (!latestFirmwareVersion) return '-';
    if (firmwareComparison === null) return '比較できません';
    if (firmwareComparison > 0) return 'GitHub より新しい FW です';
    return '最新です';
  })();
  const handleOpenRelease = () => {
    if (!latestReleaseUrl) return;
    window.open(latestReleaseUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <section className="my-6">
        <Card>
          <CardTitle>ファームウェア</CardTitle>
          <CardContent>
            {deviceInfo ? (
              <div className="space-y-4">
                <div className="grid gap-x-4 gap-y-1 text-sm text-secondary-foreground sm:grid-cols-[auto_1fr]">
                  <span>Device</span>
                  <span className="text-foreground">{deviceInfo.productName ?? 'HID'}</span>
                  <span>Firmware</span>
                  <span>{fwInfo || '-'}</span>
                  <span>Latest</span>
                  <span>{latestFirmwareVersion || '-'}</span>
                  <span>Status</span>
                  <span>{firmwareStatusText}</span>
                  <span>VID</span>
                  <span>{formatUsbId(deviceInfo.vendorId)}</span>
                  <span>PID</span>
                  <span>{formatUsbId(deviceInfo.productId)}</span>
                </div>
                {updateAvailable && latestReleaseUrl && (
                  <div className="rounded-2xl border border-border bg-secondary/35 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-secondary-foreground">
                        GitHub release に新しい firmware があります。
                      </div>
                      <Button onClick={handleOpenRelease} aria-label="Open latest firmware release">
                        更新する
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-secondary-foreground">not connected</div>
            )}
          </CardContent>
        </Card>
      </section>
      <ParamSection
        onParamChange={onParamChange}
        onReadParam={onReadParam}
        onWriteParam={onWriteParam}
        includeKeys={['rescan_i2c_on_read_error']}
      />
      <section className="my-6">
        <Card>
          <CardTitle>All Settings</CardTitle>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onReadAll} aria-label="Read all settings">
                Read All
              </Button>
              <Button onClick={onWriteAll} aria-label="Save all settings">
                Save
              </Button>
              <span className="mx-1 h-4 w-px bg-border/70" aria-hidden="true" />
              <Button onClick={onResetDefaults} aria-label="Reset settings to default">
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <StaticAddressUpdateCard
        note={staticUpdateNote}
        label={staticAddrLabel}
        value={ModuleV2Consts.STATIC_I2C_ADDRESS}
        onSubmit={onUpdateStaticAddress}
      />
      <ControlSection {...controlSectionCommonProps} mode="other" />
      <JsonSection onExport={onExport} onImport={onImport} onSaveAll={onWriteAll} />
    </>
  );
};
