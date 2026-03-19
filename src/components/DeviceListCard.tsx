import type { DeviceItemT } from '@/generated/pendant/v2';
import { classifyDevices } from '@/lib/deviceList';
import { pushToast } from '@/lib/toast';
import { buildViaKeyboardDefinition, getViaExportDevices } from '@/lib/via';
import type { DeviceNicknames } from '@/lib/deviceNicknames';
import { Download, RotateCw } from 'lucide-react';
import { type FC, useMemo } from 'react';
import { DeviceTable } from './DeviceTable';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';

interface Props {
  items: DeviceItemT[];
  nicknames: DeviceNicknames;
  onRefresh: () => void;
  onSelect: (d: DeviceItemT) => void;
  onOpenMagkey: (d: DeviceItemT) => void;
  onUpdateAddress: (d: DeviceItemT, nextAddr: number) => Promise<void> | void;
  onUpdateNickname: (d: DeviceItemT, nickname: string) => Promise<void> | void;
}

export const DeviceListCard: FC<Props> = ({
  items,
  nicknames,
  onRefresh,
  onSelect,
  onOpenMagkey,
  onUpdateAddress,
  onUpdateNickname,
}) => {
  const {
    recognizedItems,
    sortedFixedModuleItems,
    sortedOtherModuleItems,
    sortedUnrecognizedItems,
    recognitionLabelByKey,
  } = useMemo(() => classifyDevices(items), [items]);
  const viaExportDevices = useMemo(() => getViaExportDevices(items), [items]);

  const tableProps = {
    recognitionLabelByKey,
    nicknames,
    onSelect,
    onOpenMagkey,
    onUpdateAddress,
    onUpdateNickname,
  };
  const canExportVia = viaExportDevices.length > 0;

  const handleDownloadVia = () => {
    try {
      const payload = JSON.stringify(buildViaKeyboardDefinition(items), null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'cue2keys-via.json';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      pushToast({
        title: 'Downloaded',
        description: 'cue2keys-via.json saved',
        type: 'success',
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : 'via.json export failed';
      pushToast({
        title: 'Export failed',
        description,
        type: 'error',
      });
    }
  };

  return (
    <section className="my-6">
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            接続デバイス一覧
            <span className="kbd-muted">({items.length})</span>
          </div>
        </CardTitle>
        <CardContent>
          <div id="device-list-body">
            <div className="mb-2 flex items-center gap-2">
              <Button
                className="h-9 px-3"
                onClick={onRefresh}
                aria-label="Refresh device list"
                title="Refresh"
              >
                <span className="inline-flex items-center gap-2">
                  <RotateCw size={18} aria-hidden />
                  <span>再読み込み</span>
                </span>
              </Button>
            </div>

            {items.length > 0 ? (
              <div className="space-y-4">
                <DeviceTable rows={recognizedItems} {...tableProps} />
                {sortedOtherModuleItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-secondary-foreground">
                      その他のモジュール ({sortedOtherModuleItems.length})
                    </div>
                    <DeviceTable rows={sortedOtherModuleItems} {...tableProps} />
                  </div>
                ) : null}
                {sortedFixedModuleItems.length > 0 ? (
                  <details className="rounded-md border border-border/60 px-3 py-2">
                    <summary className="cursor-pointer text-xs text-secondary-foreground">
                      変更不可モジュール ({sortedFixedModuleItems.length})
                    </summary>
                    <div className="mt-2">
                      <DeviceTable rows={sortedFixedModuleItems} {...tableProps} />
                    </div>
                  </details>
                ) : null}
                {sortedUnrecognizedItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-secondary-foreground">
                      認識対象外 ({sortedUnrecognizedItems.length})
                    </div>
                    <DeviceTable rows={sortedUnrecognizedItems} {...tableProps} />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-secondary-foreground">
                デバイス情報がありません。Refreshで取得します。
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 mt-4 flex items-center gap-2">
        <Button
          className="h-9 px-3"
          variant="secondary"
          onClick={handleDownloadVia}
          disabled={!canExportVia}
          title={
            canExportVia
              ? 'Export VIA/REMAP keyboard definition'
              : 'VIA exportable devices not found'
          }
        >
          <span className="inline-flex items-center gap-2">
            <Download size={18} aria-hidden />
            <span>ぴったりのvia.jsonを出力する</span>
          </span>
        </Button>
      </div>
    </section>
  );
};
