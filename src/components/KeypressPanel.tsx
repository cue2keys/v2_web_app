import type { FC, ReactNode } from 'react';
import { Button } from './ui/button';
import { RotateCw } from 'lucide-react';
import { Card, CardContent, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { getMagkeyReleasePoint, getMagkeyReleaseUi } from '@/lib/magkeyConfig';
import { clampByte, clampMagkey } from '@/lib/utils';
import { MagkeyGraph } from './MagkeyGraph';
import { MagkeyControls } from './MagkeyControls';

interface Props {
  row: number;
  col: number;
  value: number | null;
  busy?: boolean;
  magkeyActuation: number;
  magkeyRelease: number;
  magkeyRapid: boolean;
  magkeyLoaded?: boolean;
  magkeyBusy?: boolean;
  magkeyReady?: boolean;
  magkeyBaseline?: number | null;
  title?: ReactNode;
  showKeypressControls?: boolean;
  showMagkeyControls?: boolean;
  showMagkeyGraph?: boolean;
  className?: string;
  onChangeRow: (next: number) => void;
  onChangeCol: (next: number) => void;
  onRead: () => void | Promise<void>;
  onReadMagkeyConfig: () => void | Promise<void>;
  onWriteMagkeyConfig: () => void | Promise<void>;
  onChangeMagkeyActuation: (next: number) => void;
  onChangeMagkeyRelease: (next: number) => void;
  onChangeMagkeyRapid: (next: boolean) => void;
}

export const KeypressPanel: FC<Props> = ({
  row,
  col,
  value,
  busy = false,
  magkeyActuation,
  magkeyRelease,
  magkeyRapid,
  magkeyLoaded = false,
  magkeyBusy = false,
  magkeyReady = false,
  magkeyBaseline = null,
  title = 'マグネキー / Keypress',
  showKeypressControls = true,
  showMagkeyControls = true,
  showMagkeyGraph = false,
  className = 'my-6',
  onChangeRow,
  onChangeCol,
  onRead,
  onReadMagkeyConfig,
  onWriteMagkeyConfig,
  onChangeMagkeyActuation,
  onChangeMagkeyRelease,
  onChangeMagkeyRapid,
}) => {
  const valueLabel =
    value === null ? '未取得' : `${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`;
  const { label: releaseLabel, hint: releaseHint } = getMagkeyReleaseUi(magkeyRapid);
  const magkeyMax = 0x0fff;
  const baselineValue =
    typeof magkeyBaseline === 'number' && Number.isFinite(magkeyBaseline)
      ? clampMagkey(magkeyBaseline)
      : null;
  const safeActuation = Number.isFinite(magkeyActuation) ? magkeyActuation : 0;
  const safeRelease = Number.isFinite(magkeyRelease) ? magkeyRelease : 0;
  const baselineOffset = baselineValue ?? 0;
  const releasePoint = getMagkeyReleasePoint({
    actuation: safeActuation,
    release: safeRelease,
    rapid: magkeyRapid,
  });
  const sliderMin = 0;
  const sliderMax = Math.max(0, magkeyMax - baselineOffset);
  const actuationSliderValue = Math.max(
    0,
    Math.min(sliderMax, clampMagkey(safeActuation) - baselineOffset),
  );
  const releaseSliderValue = Math.max(0, Math.min(sliderMax, releasePoint - baselineOffset));

  const magkeyIntroClass = showKeypressControls
    ? 'border-t border-border/60 pt-4 text-sm text-secondary-foreground'
    : 'text-sm text-secondary-foreground';

  return (
    <section className={className}>
      <Card>
        <CardTitle>{title}</CardTitle>
        <CardContent className="flex flex-col gap-4">
          {showKeypressControls && (
            <>
              <div className="text-sm text-secondary-foreground">
                Row/Col を指定して現在値を取得します（通常キー・ロータリーエンコーダーは
                0/1、マグネキー は 0〜4095）。
              </div>
              <div className="grid gap-3 md:grid-cols-[auto_auto_1fr_auto] md:items-end">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-secondary-foreground">Row</div>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={row}
                    onChange={(e) => {
                      const next = clampByte(parseInt(e.target.value || '0', 10));
                      onChangeRow(next);
                    }}
                    aria-label="Row"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-secondary-foreground">Col</div>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={col}
                    onChange={(e) => {
                      const next = clampByte(parseInt(e.target.value || '0', 10));
                      onChangeCol(next);
                    }}
                    aria-label="Column"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-secondary-foreground">Value</div>
                  <div className="text-sm">{valueLabel}</div>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => void onRead()}
                    disabled={busy}
                    aria-label="Read keypress"
                  >
                    <RotateCw size={16} aria-hidden />
                  </Button>
                </div>
              </div>
            </>
          )}
          {showMagkeyControls && (
            <>
              <div className={magkeyIntroClass}>
                マグネキー のアクチュエーション/リリース/ラピッドトリガー設定
              </div>
              {!magkeyReady && (
                <div className="text-sm text-destructive">
                  指定された行・列は マグネキー ではありません。設定は無効になります。
                </div>
              )}
              <MagkeyControls
                magkeyActuation={magkeyActuation}
                magkeyRapid={magkeyRapid}
                magkeyReady={magkeyReady}
                magkeyBusy={magkeyBusy}
                baselineValue={baselineValue}
                sliderMin={sliderMin}
                sliderMax={sliderMax}
                actuationSliderValue={actuationSliderValue}
                releaseSliderValue={releaseSliderValue}
                releaseLabel={releaseLabel}
                releaseHint={releaseHint}
                safeActuation={safeActuation}
                safeRelease={safeRelease}
                onChangeMagkeyActuation={onChangeMagkeyActuation}
                onChangeMagkeyRelease={onChangeMagkeyRelease}
                onChangeMagkeyRapid={onChangeMagkeyRapid}
                onReadMagkeyConfig={onReadMagkeyConfig}
                onWriteMagkeyConfig={onWriteMagkeyConfig}
              />
              {showMagkeyGraph && (
                <MagkeyGraph
                  actuation={magkeyActuation}
                  releasePoint={releasePoint}
                  baselineValue={baselineValue}
                  rapid={magkeyRapid}
                  releaseLabel={releaseLabel}
                  loaded={magkeyLoaded}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
