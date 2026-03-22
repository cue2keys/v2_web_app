import { clampByte } from '@/lib/utils';
import { useKeypressStore } from '@/store/keypressStore';
import { RotateCw } from 'lucide-react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectItem } from './ui/select';

const displayOptions = [
  { value: 0, label: 'Info' },
  { value: 1, label: 'U1 Walking' },
  { value: 3, label: '入力デバイス表示' },
];

const ledOptions = [
  { value: 0, label: 'Off' },
  { value: 1, label: 'Layer' },
  { value: 2, label: 'Random On Type' },
  { value: 3, label: 'Scanning' },
];

interface Props {
  displayMode: number | null;
  ledMode: number | null;
  onRefresh: () => void | Promise<void>;
  onApply: (displayMode: number, ledMode: number) => void | Promise<void>;
  onShowKeypressTarget: (row: number, col: number) => void | Promise<void>;
  variant?: 'display' | 'led' | 'both';
}

export const DisplayLedPanel: FC<Props> = ({
  displayMode,
  ledMode,
  onRefresh,
  onApply,
  onShowKeypressTarget,
  variant = 'both',
}) => {
  const { keypressRow, keypressCol, setKeypressRow, setKeypressCol } = useKeypressStore(
    (state) => ({
      keypressRow: state.keypressRow,
      keypressCol: state.keypressCol,
      setKeypressRow: state.setKeypressRow,
      setKeypressCol: state.setKeypressCol,
    }),
  );
  const [nextDisplay, setNextDisplay] = useState<number>(displayOptions[0]!.value);
  const [nextLed, setNextLed] = useState<number>(ledOptions[0]!.value);
  const showDisplay = variant === 'both' || variant === 'display';
  const showLed = variant === 'both' || variant === 'led';

  useEffect(() => {
    if (displayMode !== null && displayOptions.some((option) => option.value === displayMode)) {
      setNextDisplay(displayMode);
    }
  }, [displayMode]);

  useEffect(() => {
    if (ledMode !== null) setNextLed(ledMode);
  }, [ledMode]);

  const displayLabel =
    displayMode === null
      ? '未取得'
      : displayMode === 2
        ? '指定キー表示'
        : (displayOptions.find((o) => o.value === displayMode)?.label ??
          `Unknown (${displayMode})`);
  const ledLabel =
    ledMode === null
      ? '未取得'
      : (ledOptions.find((o) => o.value === ledMode)?.label ?? `Unknown (${ledMode})`);
  const ready = (!showDisplay || displayMode !== null) && (!showLed || ledMode !== null);

  const title = variant === 'display' ? 'Display' : variant === 'led' ? 'LED' : 'Display / LED';
  const summary =
    showDisplay && showLed
      ? `現在の設定: Display = ${displayLabel} / LED = ${ledLabel}`
      : showDisplay
        ? `現在の設定: Display = ${displayLabel}`
        : `現在の設定: LED = ${ledLabel}`;

  return (
    <section className="my-6">
      <Card>
        <CardTitle>{title}</CardTitle>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm text-secondary-foreground">{summary}</div>

          <div
            className={`grid gap-3 ${showDisplay && showLed ? 'md:grid-cols-[1fr_1fr_auto]' : 'md:grid-cols-[1fr_auto]'}`}
          >
            {showDisplay && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-secondary-foreground">Display</div>
                <Select
                  value={String(nextDisplay)}
                  onValueChange={(v) => setNextDisplay(parseInt(v, 10))}
                  ariaLabel="Display mode"
                  disabled={!ready}
                >
                  {displayOptions.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

            {showLed && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-secondary-foreground">LED</div>
                <Select
                  value={String(nextLed)}
                  onValueChange={(v) => setNextLed(parseInt(v, 10))}
                  ariaLabel="LED base mode"
                  disabled={!ready}
                >
                  {ledOptions.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => void onRefresh()}
                aria-label="Refresh display / LED settings"
              >
                <RotateCw size={16} aria-hidden />
              </Button>
              <Button
                type="button"
                onClick={() => void onApply(nextDisplay, nextLed)}
                disabled={!ready}
                aria-label="Apply display / LED settings"
              >
                適用
              </Button>
            </div>
          </div>

          {showDisplay && (
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 text-xs font-semibold text-secondary-foreground">
                指定キー表示
              </div>
              <div className="grid gap-3 md:grid-cols-[auto_auto_auto] md:items-end">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-secondary-foreground">Row</div>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={keypressRow}
                    onChange={(e) => setKeypressRow(clampByte(parseInt(e.target.value || '0', 10)))}
                    aria-label="Display keypress row"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-secondary-foreground">Col</div>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={keypressCol}
                    onChange={(e) => setKeypressCol(clampByte(parseInt(e.target.value || '0', 10)))}
                    aria-label="Display keypress column"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void onShowKeypressTarget(keypressRow, keypressCol)}
                  disabled={displayMode === null}
                >
                  指定キー表示に切替
                </Button>
              </div>
              <div className="mt-2 text-sm text-secondary-foreground">
                指定した Row / Col を OLED
                の指定キー表示に切り替えます。再起動すると情報表示に戻ります。
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
