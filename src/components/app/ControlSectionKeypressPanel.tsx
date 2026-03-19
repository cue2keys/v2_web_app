import { KeypressPanel } from '@/components/KeypressPanel';
import { toRapidToggleState } from '@/lib/magkeyConfig';

interface KeypressControlPanelProps {
  mode: 'all' | 'trackball' | 'display' | 'led' | 'other';
  row: number;
  col: number;
  value: number | null;
  busy: boolean;
  magkeyActuation: number;
  magkeyRelease: number;
  magkeyRapid: boolean;
  magkeyReleaseBeforeRapid: number | null;
  magkeyLoaded: boolean;
  magkeyBusy: boolean;
  magkeyReady: boolean;
  onReadKeypress: () => Promise<void>;
  onReadMagkeyConfig: () => Promise<void>;
  onWriteMagkeyConfig: () => Promise<void>;
  onChangeMagkeyActuation: (next: number) => void;
  onChangeMagkeyRelease: (next: number) => void;
  onChangeMagkeyRapid: (next: boolean) => void;
  onChangeMagkeyReleaseBeforeRapid: (next: number | null) => void;
  onChangeRow: (next: number) => void;
  onChangeCol: (next: number) => void;
}

function getResetKeypressSelection(
  onChange: (next: number) => void,
  resetMagkeyConfigLoaded: (loaded: boolean) => void,
  resetMagkeyReleaseBeforeRapid: (release: number | null) => void,
  resetKeypressIsMagkey: (value: boolean | null) => void,
) {
  return (next: number) => {
    onChange(next);
    resetMagkeyConfigLoaded(false);
    resetMagkeyReleaseBeforeRapid(null);
    resetKeypressIsMagkey(null);
  };
}

export function createKeypressResetHandlers(
  setKeypressRow: (next: number) => void,
  setKeypressCol: (next: number) => void,
  setMagkeyConfigLoaded: (loaded: boolean) => void,
  setMagkeyReleaseBeforeRapid: (release: number | null) => void,
  setKeypressIsMagkey: (value: boolean | null) => void,
) {
  return {
    onChangeRow: getResetKeypressSelection(
      setKeypressRow,
      setMagkeyConfigLoaded,
      setMagkeyReleaseBeforeRapid,
      setKeypressIsMagkey,
    ),
    onChangeCol: getResetKeypressSelection(
      setKeypressCol,
      setMagkeyConfigLoaded,
      setMagkeyReleaseBeforeRapid,
      setKeypressIsMagkey,
    ),
  };
}

export function KeypressControlPanel({
  mode,
  row,
  col,
  value,
  busy,
  magkeyActuation,
  magkeyRelease,
  magkeyRapid,
  magkeyReleaseBeforeRapid,
  magkeyLoaded,
  magkeyBusy,
  magkeyReady,
  onReadKeypress,
  onReadMagkeyConfig,
  onWriteMagkeyConfig,
  onChangeMagkeyActuation,
  onChangeMagkeyRelease,
  onChangeMagkeyRapid,
  onChangeMagkeyReleaseBeforeRapid,
  onChangeRow,
  onChangeCol,
}: KeypressControlPanelProps) {
  const handleChangeMagkeyRapid = (next: boolean) => {
    const nextState = toRapidToggleState({
      currentRapid: magkeyRapid,
      nextRapid: next,
      release: magkeyRelease,
      releaseBeforeRapid: magkeyReleaseBeforeRapid,
    });
    onChangeMagkeyRelease(nextState.release);
    onChangeMagkeyReleaseBeforeRapid(nextState.releaseBeforeRapid);
    onChangeMagkeyRapid(nextState.rapid);
  };

  return (
    <KeypressPanel
      row={row}
      col={col}
      value={value}
      busy={busy}
      magkeyActuation={magkeyActuation}
      magkeyRelease={magkeyRelease}
      magkeyRapid={magkeyRapid}
      magkeyLoaded={magkeyLoaded}
      magkeyBusy={magkeyBusy}
      magkeyReady={magkeyReady}
      title={mode === 'other' ? 'Keypress' : undefined}
      showMagkeyControls={mode !== 'other'}
      onChangeRow={onChangeRow}
      onChangeCol={onChangeCol}
      onRead={onReadKeypress}
      onReadMagkeyConfig={onReadMagkeyConfig}
      onWriteMagkeyConfig={onWriteMagkeyConfig}
      onChangeMagkeyActuation={onChangeMagkeyActuation}
      onChangeMagkeyRelease={onChangeMagkeyRelease}
      onChangeMagkeyRapid={handleChangeMagkeyRapid}
    />
  );
}
