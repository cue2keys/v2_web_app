import type { FC } from 'react';
import { Button } from './ui/button';
import { Info, RotateCw } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { clampMagkey } from '@/lib/utils';

interface Props {
  magkeyActuation: number;
  magkeyRapid: boolean;
  magkeyReady?: boolean;
  magkeyBusy?: boolean;
  baselineValue: number | null;
  sliderMin: number;
  sliderMax: number;
  actuationSliderValue: number;
  releaseSliderValue: number;
  releaseLabel: string;
  releaseHint: string;
  safeActuation: number;
  safeRelease: number;
  onChangeMagkeyActuation: (next: number) => void;
  onChangeMagkeyRelease: (next: number) => void;
  onChangeMagkeyRapid: (next: boolean) => void;
  onReadMagkeyConfig: () => void | Promise<void>;
  onShowDisplayKeypressTarget?: () => void | Promise<void>;
  onWriteMagkeyConfig: () => void | Promise<void>;
  showDisplayTargetAction?: boolean;
  displayTargetActionDisabled?: boolean;
}

export const MagkeyControls: FC<Props> = ({
  magkeyActuation,
  magkeyRapid,
  magkeyReady = false,
  magkeyBusy = false,
  baselineValue,
  sliderMin,
  sliderMax,
  actuationSliderValue,
  releaseSliderValue,
  releaseLabel,
  releaseHint,
  safeActuation,
  safeRelease,
  onChangeMagkeyActuation,
  onChangeMagkeyRelease,
  onChangeMagkeyRapid,
  onReadMagkeyConfig,
  onShowDisplayKeypressTarget,
  onWriteMagkeyConfig,
  showDisplayTargetAction = false,
  displayTargetActionDisabled = false,
}) => {
  const magkeyDisabled = !magkeyReady || magkeyBusy;
  const baselineOffset = baselineValue ?? 0;
  const displayActionDisabled =
    magkeyDisabled || displayTargetActionDisabled || !onShowDisplayKeypressTarget;

  return (
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
          value={safeActuation}
          onChange={(e) => {
            const next = clampMagkey(parseInt(e.target.value || '0', 10));
            onChangeMagkeyActuation(next);
          }}
          aria-label="マグネキー actuation point"
          disabled={magkeyDisabled}
        />
        <Slider
          min={sliderMin}
          max={sliderMax}
          step={1}
          className="min-w-[180px] flex-1"
          value={actuationSliderValue}
          onValueChange={(v) => onChangeMagkeyActuation(clampMagkey(v + baselineOffset))}
          ariaLabel="マグネキー actuation slider"
          disabled={magkeyDisabled}
          markers={baselineValue !== null ? [{ value: 0, className: 'bg-sky-500' }] : []}
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
            value={safeRelease}
            onChange={(e) => {
              const next = clampMagkey(parseInt(e.target.value || '0', 10));
              onChangeMagkeyRelease(next);
            }}
            aria-label="マグネキー reset point"
            disabled={magkeyDisabled}
          />
          <Slider
            min={sliderMin}
            max={sliderMax}
            step={1}
            className="min-w-[180px] flex-1"
            value={releaseSliderValue}
            onValueChange={(v) => {
              const nextReleasePoint = clampMagkey(v + baselineOffset);
              if (magkeyRapid) {
                const next = clampMagkey(magkeyActuation - nextReleasePoint);
                onChangeMagkeyRelease(next);
              } else {
                onChangeMagkeyRelease(nextReleasePoint);
              }
            }}
            ariaLabel="マグネキー release slider"
            disabled={magkeyDisabled}
            markers={baselineValue !== null ? [{ value: 0, className: 'bg-sky-500' }] : []}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-36 shrink-0 text-xs font-semibold text-secondary-foreground">
          Rapid Trigger (RT)
        </div>
        <div className="flex items-center">
          <Checkbox
            checked={magkeyRapid}
            onCheckedChange={onChangeMagkeyRapid}
            ariaLabel="Rapid trigger"
            disabled={magkeyDisabled}
          />
        </div>
      </div>
      <div className="flex items-end gap-2 md:justify-end">
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => void onReadMagkeyConfig()}
            disabled={magkeyDisabled}
            aria-label="Read マグネキー values"
          >
            <RotateCw size={16} aria-hidden />
          </Button>
          <Button
            type="button"
            onClick={() => void onWriteMagkeyConfig()}
            disabled={magkeyDisabled}
            aria-label="Apply マグネキー values"
          >
            書き込み
          </Button>
          {showDisplayTargetAction && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void onShowDisplayKeypressTarget?.()}
              disabled={displayActionDisabled}
              aria-label="Show マグネキー target on display"
            >
              ディスプレイに表示
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
