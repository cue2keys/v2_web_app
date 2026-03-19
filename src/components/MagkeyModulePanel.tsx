import type { FC } from 'react';
import type { DeviceItemT } from '@/generated/pendant/v2';
import { Info } from 'lucide-react';
import { useMagkeyModule, type MagkeyConfig } from '@/hooks/useMagkeyModule';
import { KeypressPanel } from './KeypressPanel';
import { MagkeyBulkSettings } from './MagkeyBulkSettings';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface Props {
  device: DeviceItemT | null;
  onReadConfig: (row: number, col: number) => Promise<MagkeyConfig>;
  onReadKeypress: (row: number, col: number) => Promise<number | null>;
  onWriteConfig: (
    row: number,
    col: number,
    actuation: number,
    release: number,
    rapid: boolean,
  ) => Promise<MagkeyConfig>;
  onClose: () => void;
}

export const MagkeyModulePanel: FC<Props> = ({
  device,
  onReadConfig,
  onReadKeypress,
  onWriteConfig,
  onClose,
}) => {
  const {
    keys,
    ignoreBaseline,
    setIgnoreBaseline,
    bulkActuation,
    setBulkActuation,
    bulkRelease,
    setBulkRelease,
    bulkRapid,
    setBulkRapid,
    bulkBusy,
    presetName,
    setPresetName,
    presets,
    isMagkeyModule,
    deviceKey,
    releaseLabel,
    releaseHint,
    bulkReleasePoint,
    updateKey,
    handleChangeKeyRelease,
    handleChangeKeyRapid,
    handleRead,
    handleWrite,
    handleApplyAll,
    handleSavePreset,
    handleApplyPreset,
  } = useMagkeyModule({ device, onReadConfig, onReadKeypress, onWriteConfig });

  if (!device || !isMagkeyModule) return null;

  const deviceLabel = `ch${device.ch} / addr 0x${device.addr
    .toString(16)
    .toUpperCase()
    .padStart(2, '0')}`;

  return (
    <section className="my-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-base font-semibold">マグネキー設定</div>
          <div className="text-xs text-secondary-foreground">{deviceLabel}</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-secondary-foreground">
            <Checkbox
              checked={ignoreBaseline}
              onCheckedChange={(v) => setIgnoreBaseline(Boolean(v))}
              ariaLabel="Ignore baseline and use zero"
            />
            基準位置を無視 (0基準)
          </label>
          <Button type="button" variant="ghost" className="h-7 px-2" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
      <MagkeyBulkSettings
        bulkActuation={bulkActuation}
        setBulkActuation={setBulkActuation}
        bulkRelease={bulkRelease}
        setBulkRelease={setBulkRelease}
        bulkRapid={bulkRapid}
        setBulkRapid={setBulkRapid}
        bulkBusy={bulkBusy}
        bulkReleasePoint={bulkReleasePoint}
        releaseLabel={releaseLabel}
        releaseHint={releaseHint}
        presetName={presetName}
        setPresetName={setPresetName}
        presets={presets}
        onApplyAll={handleApplyAll}
        onSavePreset={handleSavePreset}
        onApplyPreset={handleApplyPreset}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {keys.map((key, idx) => (
          <KeypressPanel
            key={`${deviceKey}-${idx}`}
            row={key.row}
            col={key.col}
            value={null}
            busy={false}
            magkeyActuation={key.actuation}
            magkeyRelease={key.release}
            magkeyRapid={key.rapid}
            magkeyLoaded={key.loaded}
            magkeyBusy={key.busy}
            magkeyReady={key.valid}
            magkeyBaseline={ignoreBaseline ? 0 : key.baseline}
            title={
              <div className="inline-flex items-center gap-1.5">
                <span>{`Key ${idx + 1}`}</span>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-secondary-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label="Key position hint"
                      >
                        <Info size={14} className="cursor-help" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{`Row ${key.row} / Col ${key.col}`}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            showKeypressControls={false}
            showMagkeyGraph
            className="my-0"
            onChangeRow={() => {
              /* no-op */
            }}
            onChangeCol={() => {
              /* no-op */
            }}
            onRead={() => {
              /* no-op */
            }}
            onReadMagkeyConfig={() => void handleRead(idx)}
            onWriteMagkeyConfig={() => void handleWrite(idx)}
            onChangeMagkeyActuation={(next) => updateKey(idx, { actuation: next })}
            onChangeMagkeyRelease={(next) => handleChangeKeyRelease(idx, next)}
            onChangeMagkeyRapid={(next) => handleChangeKeyRapid(idx, next)}
          />
        ))}
      </div>
    </section>
  );
};
