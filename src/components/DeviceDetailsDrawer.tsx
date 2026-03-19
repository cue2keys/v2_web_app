import type { DeviceItemT } from '@/generated/pendant/v2';
import { ModuleType } from '@/generated/pendant/v2/module-type';
import { X } from 'lucide-react';
import type { FC } from 'react';
import {
  is_v2_fixed_addr,
  is_v2_reserved_addr,
  v2_display_addr_from_actual,
} from '../commonData/utils';
import { deviceTypeName, formatUid, toHex } from '../lib/format';
import { pushToast } from '../lib/toast';
import { AddressEditor } from './AddressEditor';
import { NicknameEditor } from './NicknameEditor';
import { Button } from './ui/button';

interface Props {
  device: DeviceItemT | null;
  onClose: () => void;
  onUpdateAddress: (d: DeviceItemT, nextAddr: number) => Promise<void> | void;
  onUpdateNickname: (d: DeviceItemT, nickname: string) => Promise<void> | void;
  nickname?: string;
}

export const DeviceDetailsDrawer: FC<Props> = ({
  device,
  onClose,
  onUpdateAddress,
  onUpdateNickname,
  nickname,
}) => {
  if (!device) return null;
  const displayAddr = v2_display_addr_from_actual(device.addr);
  const isReservedAddr = is_v2_reserved_addr(device.addr);
  const isFixedAddr = is_v2_fixed_addr(device.addr);
  const addressLabel = isReservedAddr
    ? `- (${toHex(device.addr)})`
    : isFixedAddr
      ? `HW (${toHex(device.addr)})`
      : displayAddr === 0
        ? '0 (未設定)'
        : displayAddr != null
          ? `${displayAddr} (${toHex(device.addr)})`
          : `${device.addr} (${toHex(device.addr)})`;
  return (
    <div className="fixed inset-0 z-20" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col gap-3 border-l border-border bg-background p-4 shadow-xl sm:w-[420px]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Device Details</h2>
          <Button
            className="h-8 w-8 bg-transparent p-0 hover:bg-transparent"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close details"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">Channel</span>
            <span>{device.ch}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">Address</span>
            <AddressEditor
              value={device.addr}
              displayLabel={addressLabel}
              onSubmit={(nextAddr) => onUpdateAddress(device, nextAddr)}
              disabled={
                ![ModuleType.V2_Keys4, ModuleType.V2_RE, ModuleType.V2_MagKeys4].includes(
                  device.type,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">Type</span>
            <span>
              {deviceTypeName(device.type)} <span className="kbd-muted">(#{device.type})</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">UID</span>
            <span>{device.uid !== BigInt('0') ? formatUid(device.uid) : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">Nickname</span>
            {device.uid !== BigInt('0') ? (
              <NicknameEditor
                value={nickname}
                onSubmit={(next) => onUpdateNickname(device, next)}
              />
            ) : (
              <span className="text-secondary-foreground">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">Keymap Shift</span>
            <span>{device.shift}</span>
          </div>
        </div>
        <div className="mt-2">
          <Button
            className="h-8 px-3"
            onClick={() => {
              const obj = {
                ch: device.ch,
                addr: device.addr,
                type: device.type,
                shift: device.shift,
              };
              navigator.clipboard
                ?.writeText(JSON.stringify(obj, null, 2))
                .then(() =>
                  pushToast({
                    title: 'Copied',
                    description: 'Device JSON copied',
                    type: 'success',
                  }),
                )
                .catch(() => {
                  /* no-op */
                });
            }}
          >
            Copy JSON
          </Button>
        </div>
        <div className="mt-auto text-xs text-secondary-foreground">
          Tip: SHIFTはキー配列内の開始オフセットです。
        </div>
      </aside>
    </div>
  );
};
