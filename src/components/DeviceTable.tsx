import type { DeviceItemT } from '@/generated/pendant/v2';
import { ModuleType } from '@/generated/pendant/v2/module-type';
import {
  canEditI2CAddress,
  deviceIdentityKey,
  isKeyModuleType,
  isRotaryEncoderType,
} from '@/lib/deviceList';
import type { DeviceNicknames } from '@/lib/deviceNicknames';
import { ChevronDown, Cylinder, Keyboard, Magnet, Pencil, Presentation } from 'lucide-react';
import { type FC, useMemo, useState } from 'react';
import { v2_display_addr_label } from '../commonData/utils';
import { deviceTypeName } from '../lib/format';
import { AddressEditor } from './AddressEditor';
import { NicknameEditor } from './NicknameEditor';
import { Button } from './ui/button';

type SortKey = 'ch' | 'priority' | 'recognition' | 'type' | 'nickname';

const SORT_COLUMNS: { key: SortKey; label: string; width?: string }[] = [
  { key: 'ch', label: 'ch', width: 'w-[2ch]' },
  { key: 'priority', label: '優先度' },
  { key: 'recognition', label: '認識順' },
  { key: 'type', label: 'タイプ' },
  { key: 'nickname', label: 'ニックネーム' },
];

const typeIconFor = (type: ModuleType) => {
  if (type === ModuleType.V2_MagKeys4) return Magnet;
  if (isRotaryEncoderType(type)) return Cylinder;
  if (isKeyModuleType(type)) return Keyboard;
  if (type === ModuleType.DISPLAY) return Presentation;
  return null;
};

export interface DeviceTableProps {
  rows: DeviceItemT[];
  recognitionLabelByKey: Map<string, string>;
  nicknames: DeviceNicknames;
  onSelect: (d: DeviceItemT) => void;
  onOpenMagkey: (d: DeviceItemT) => void;
  onUpdateAddress: (d: DeviceItemT, nextAddr: number) => Promise<void> | void;
  onUpdateNickname: (d: DeviceItemT, nickname: string) => Promise<void> | void;
}

export const DeviceTable: FC<DeviceTableProps> = ({
  rows,
  recognitionLabelByKey,
  nicknames,
  onSelect,
  onOpenMagkey,
  onUpdateAddress,
  onUpdateNickname,
}) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (!sortAsc) {
        setSortKey(null);
        setSortAsc(true);
      } else {
        setSortAsc(false);
      }
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const getSortValue = (d: DeviceItemT): string | number => {
      switch (sortKey) {
        case 'ch':
          return d.ch;
        case 'priority':
          return d.addr;
        case 'recognition':
          return recognitionLabelByKey.get(deviceIdentityKey(d)) ?? '';
        case 'type':
          return d.type;
        case 'nickname':
          return nicknames[d.uid.toString()] ?? '';
      }
    };
    return [...rows].sort((a, b) => {
      const va = getSortValue(a);
      const vb = getSortValue(b);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortKey, sortAsc, recognitionLabelByKey, nicknames]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-secondary-foreground">
          <tr>
            {SORT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={[
                  col.width,
                  'cursor-pointer select-none py-1 pr-3 text-left font-medium hover:text-foreground',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-0.5 text-xs">{sortAsc ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
            <th className="py-1 pr-3 text-left font-medium"> </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((d) => {
            const rowKey = deviceIdentityKey(d);
            const addrLabel = v2_display_addr_label(d.addr);
            const recognitionLabel = recognitionLabelByKey.get(rowKey) ?? '—';
            const TypeIcon = typeIconFor(d.type);
            return (
              <tr key={rowKey} className="border-t border-border/50">
                <td className="w-[2ch] py-1 pr-3">{d.ch}</td>
                <td className="py-1 pr-3">
                  <AddressEditor
                    value={d.addr}
                    displayLabel={addrLabel}
                    onSubmit={(nextAddr) => onUpdateAddress(d, nextAddr)}
                    buttonLabel={<Pencil className="h-3 w-3" aria-hidden />}
                    buttonVariant="ghost"
                    buttonSize="icon"
                    buttonClassName="h-4 w-4 bg-transparent p-0 hover:bg-transparent [&_svg]:size-3"
                    disabled={!canEditI2CAddress(d.type)}
                  />
                </td>
                <td className="py-1 pr-3">{recognitionLabel}</td>
                <td className="py-1 pr-3">
                  <span className="inline-flex items-center gap-2">
                    {TypeIcon ? (
                      <TypeIcon className="h-4 w-4 text-secondary-foreground" aria-hidden />
                    ) : null}
                    <span>{deviceTypeName(d.type)}</span>
                    {d.type === ModuleType.V2_MagKeys4 && (
                      <Button
                        className="h-6 px-2"
                        variant="secondary"
                        onClick={() => onOpenMagkey(d)}
                        aria-label="Open マグネキー settings"
                      >
                        調整
                      </Button>
                    )}
                  </span>
                </td>
                <td className="py-1 pr-3">
                  {d.uid !== BigInt('0') ? (
                    <NicknameEditor
                      value={nicknames[d.uid.toString()]}
                      onSubmit={(next) => onUpdateNickname(d, next)}
                    />
                  ) : (
                    <span className="text-secondary-foreground">—</span>
                  )}
                </td>
                <td className="py-1 pr-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="h-7 px-2 text-secondary-foreground/50 hover:text-secondary-foreground"
                      variant="ghost"
                      onClick={() => onSelect(d)}
                      aria-label="Show device details"
                    >
                      <span className="inline-flex items-center gap-0">
                        <span>More</span>
                        <ChevronDown className="h-3 w-3" aria-hidden />
                      </span>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
