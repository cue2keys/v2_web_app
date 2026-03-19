import type { FC } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardTitle } from './ui/card';

interface Props {
  jsonText: string;
  onChangeText: (s: string) => void;
  onExport: (options: { includeSettings: boolean; includeNicknames: boolean }) => void;
  onImport: () => void;
  exportOptions: { includeSettings: boolean; includeNicknames: boolean };
  onToggleExportSettings: (next: boolean) => void;
  onToggleExportNicknames: (next: boolean) => void;
  showSaveAll?: boolean;
  onSaveAll?: () => void;
  exporting?: boolean;
  savingAll?: boolean;
}

export const JsonConfigCard: FC<Props> = ({
  jsonText,
  onChangeText,
  onExport,
  onImport,
  exportOptions,
  onToggleExportSettings,
  onToggleExportNicknames,
  showSaveAll,
  onSaveAll,
  exporting,
  savingAll,
}) => {
  const canExport = exportOptions.includeSettings || exportOptions.includeNicknames;
  return (
    <section className="my-6">
      <Card>
        <CardTitle>JSON Export / Import</CardTitle>
        <CardContent>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-secondary-foreground">出力対象</span>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={exportOptions.includeSettings}
                  onCheckedChange={onToggleExportSettings}
                  ariaLabel="Include settings in export"
                />
                <span>設定</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={exportOptions.includeNicknames}
                  onCheckedChange={onToggleExportNicknames}
                  ariaLabel="Include nicknames in export"
                />
                <span>ニックネーム</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onExport(exportOptions)}
                disabled={!canExport || exporting}
                aria-label="Export settings to JSON"
              >
                {exporting ? 'Reading...' : 'Export JSON'}
              </Button>
              <Button
                onClick={onImport}
                disabled={exporting}
                aria-label="Import settings from JSON"
              >
                Import JSON
              </Button>
            </div>
          </div>
          {showSaveAll && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              <span className="text-secondary-foreground">
                インポートした値をデバイスに書き込みますか？
              </span>
              <Button
                onClick={onSaveAll}
                disabled={savingAll}
                aria-label="Save all imported settings to device"
              >
                {savingAll ? 'Saving...' : 'Save All'}
              </Button>
            </div>
          )}
          <textarea
            className="min-h-40 w-full rounded-md border border-border p-3 font-mono text-sm"
            placeholder="ここにJSONを表示/貼り付けします"
            value={jsonText}
            onInput={(e) => onChangeText((e.target as HTMLTextAreaElement).value)}
          />
        </CardContent>
      </Card>
    </section>
  );
};
