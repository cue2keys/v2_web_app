import type { FC } from 'react';
import { Info } from 'lucide-react';
import { clampMagkey, MAGKEY_MAX } from '@/lib/utils';
import type { MagkeyPreset } from '@/hooks/useMagkeyModule';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface Props {
  bulkActuation: number;
  setBulkActuation: (v: number) => void;
  bulkRelease: number;
  setBulkRelease: (v: number) => void;
  bulkRapid: boolean;
  setBulkRapid: (v: boolean) => void;
  bulkBusy: boolean;
  bulkReleasePoint: number;
  releaseLabel: string;
  releaseHint: string;
  presetName: string;
  setPresetName: (v: string) => void;
  presets: MagkeyPreset[];
  onApplyAll: () => void | Promise<void>;
  onSavePreset: () => void;
  onApplyPreset: (preset: MagkeyPreset) => void | Promise<void>;
}

export const MagkeyBulkSettings: FC<Props> = ({
  bulkActuation,
  setBulkActuation,
  bulkRelease,
  setBulkRelease,
  bulkRapid,
  setBulkRapid,
  bulkBusy,
  bulkReleasePoint,
  releaseLabel,
  releaseHint,
  presetName,
  setPresetName,
  presets,
  onApplyAll,
  onSavePreset,
  onApplyPreset,
}) => {
  return (
    <div className="mb-4 rounded-md border border-border/60 bg-secondary/20 p-3">
      <div className="mb-3 text-sm font-semibold">一括設定</div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36 shrink-0 text-xs font-semibold text-secondary-foreground">
            Actuation
          </div>
          <Input
            type="number"
            min={0}
            max={4095}
            className="w-24 shrink-0"
            value={bulkActuation}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              setBulkActuation(clampMagkey(next));
            }}
            aria-label="Bulk actuation point"
            disabled={bulkBusy}
          />
          <Slider
            min={0}
            max={MAGKEY_MAX}
            step={1}
            className="min-w-[180px] flex-1"
            value={clampMagkey(bulkActuation)}
            onValueChange={(v) => setBulkActuation(clampMagkey(v))}
            ariaLabel="Bulk actuation slider"
            disabled={bulkBusy}
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex w-36 shrink-0 items-center gap-1 text-xs font-semibold text-secondary-foreground"
              aria-label={`${releaseLabel} hint`}
            >
              <span>{releaseLabel}</span>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-secondary-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Release hint"
                    >
                      <Info size={14} className="cursor-help" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{releaseHint}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              min={0}
              max={4095}
              className="w-24 shrink-0"
              value={bulkRelease}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                setBulkRelease(clampMagkey(next));
              }}
              aria-label="Bulk reset point"
              disabled={bulkBusy}
            />
            <Slider
              min={0}
              max={MAGKEY_MAX}
              step={1}
              className="min-w-[180px] flex-1"
              value={bulkReleasePoint}
              onValueChange={(v) => {
                const actual = clampMagkey(v);
                if (bulkRapid) {
                  setBulkRelease(clampMagkey(bulkActuation - actual));
                } else {
                  setBulkRelease(actual);
                }
              }}
              ariaLabel="Bulk release slider"
              disabled={bulkBusy}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36 shrink-0 text-xs font-semibold text-secondary-foreground">
            Rapid Trigger (RT)
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={bulkRapid}
              onCheckedChange={(v) => setBulkRapid(Boolean(v))}
              ariaLabel="Bulk rapid trigger"
              disabled={bulkBusy}
            />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Button type="button" onClick={() => void onApplyAll()} disabled={bulkBusy}>
          {bulkBusy ? 'Applying...' : '一括適用して書き込み'}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-secondary-foreground">プリセット名</div>
          <Input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            aria-label="Preset name"
            disabled={bulkBusy}
          />
        </div>
        <Button type="button" variant="outline" onClick={onSavePreset} disabled={bulkBusy}>
          保存
        </Button>
        {presets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                variant="secondary"
                onClick={() => void onApplyPreset(preset)}
                disabled={bulkBusy}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
