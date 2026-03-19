import type { FC } from 'react';
import { useMemo } from 'react';
import { findMagkeyDevice } from '@/lib/magkey';
import { getActiveSchema, isTrackballSchemaItem } from '@/lib/paramSchema';
import type { SchemaItem } from '@/lib/schema';
import { useDeviceStore } from '@/store/deviceStore';
import { useParamStore, type ParamValue } from '@/store/paramStore';
import { useKeypressStore } from '@/store/keypressStore';
import { useMagkeyStore } from '@/store/magkeyStore';
import { useShallow } from 'zustand/react/shallow';
import { createKeypressResetHandlers, KeypressControlPanel } from './ControlSectionKeypressPanel';
import { DisplayLedControlPanel, TrackballControlPanel } from './ControlSectionPanels';

export interface ControlSectionCommonProps {
  onParamChange: (p: SchemaItem, v: ParamValue) => void;
  onReadParam: (p: SchemaItem) => Promise<void>;
  onWriteParam: (p: SchemaItem) => Promise<void>;
  onWriteAngle: (p: SchemaItem, v: number) => Promise<void>;
  onRefreshModeSettings: () => Promise<Record<number, boolean> | null>;
  onApplyDisplayLedSettings: (nextDisplay: number, nextLed: number) => Promise<void>;
  onSendDisplayKeypressTarget: (row: number, col: number) => Promise<void>;
  onReadKeypress: () => Promise<void>;
  onReadMagkeyConfig: () => Promise<void>;
  onWriteMagkeyConfig: () => Promise<void>;
}

interface Props extends ControlSectionCommonProps {
  mode?: 'all' | 'trackball' | 'display' | 'led' | 'other';
}

export const ControlSection: FC<Props> = ({
  onParamChange,
  onReadParam,
  onWriteParam,
  onWriteAngle,
  onRefreshModeSettings,
  onApplyDisplayLedSettings,
  onSendDisplayKeypressTarget,
  onReadKeypress,
  onReadMagkeyConfig,
  onWriteMagkeyConfig,
  mode = 'all',
}) => {
  const { schema, params, loaded } = useParamStore(
    useShallow((state) => ({
      schema: state.schema,
      params: state.params,
      loaded: state.loaded,
    })),
  );
  const { trackballConnected, displayMode, ledMode, devList } = useDeviceStore(
    useShallow((state) => ({
      trackballConnected: state.trackballConnected,
      displayMode: state.displayMode,
      ledMode: state.ledMode,
      devList: state.devList,
    })),
  );
  const {
    keypressRow,
    keypressCol,
    keypressValue,
    keypressIsMagkey,
    keypressBusy,
    setKeypressRow,
    setKeypressCol,
    setKeypressIsMagkey,
  } = useKeypressStore(
    useShallow((state) => ({
      keypressRow: state.keypressRow,
      keypressCol: state.keypressCol,
      keypressValue: state.keypressValue,
      keypressIsMagkey: state.keypressIsMagkey,
      keypressBusy: state.keypressBusy,
      setKeypressRow: state.setKeypressRow,
      setKeypressCol: state.setKeypressCol,
      setKeypressIsMagkey: state.setKeypressIsMagkey,
    })),
  );
  const {
    magkeyActuation,
    magkeyRelease,
    magkeyRapid,
    magkeyReleaseBeforeRapid,
    magkeyConfigLoaded,
    magkeyConfigBusy,
    setMagkeyActuation,
    setMagkeyRelease,
    setMagkeyRapid,
    setMagkeyReleaseBeforeRapid,
    setMagkeyConfigLoaded,
  } = useMagkeyStore(
    useShallow((state) => ({
      magkeyActuation: state.magkeyActuation,
      magkeyRelease: state.magkeyRelease,
      magkeyRapid: state.magkeyRapid,
      magkeyReleaseBeforeRapid: state.magkeyReleaseBeforeRapid,
      magkeyConfigLoaded: state.magkeyConfigLoaded,
      magkeyConfigBusy: state.magkeyConfigBusy,
      setMagkeyActuation: state.setMagkeyActuation,
      setMagkeyRelease: state.setMagkeyRelease,
      setMagkeyRapid: state.setMagkeyRapid,
      setMagkeyReleaseBeforeRapid: state.setMagkeyReleaseBeforeRapid,
      setMagkeyConfigLoaded: state.setMagkeyConfigLoaded,
    })),
  );
  const activeSchema = useMemo(() => getActiveSchema(schema), [schema]);
  const trackballItems = useMemo(() => activeSchema.filter(isTrackballSchemaItem), [activeSchema]);
  const showTrackball = mode === 'all' || mode === 'trackball';
  const showDisplay = mode === 'all' || mode === 'display';
  const showLed = mode === 'all' || mode === 'led';
  const showKeypress = mode === 'all' || mode === 'other';
  const magkeyTarget = useMemo(
    () => findMagkeyDevice(devList, keypressRow, keypressCol),
    [devList, keypressCol, keypressRow],
  );
  const isMagkeyTarget = keypressIsMagkey ?? !!magkeyTarget;
  const keypressResetHandlers = useMemo(
    () =>
      createKeypressResetHandlers(
        setKeypressRow,
        setKeypressCol,
        setMagkeyConfigLoaded,
        setMagkeyReleaseBeforeRapid,
        setKeypressIsMagkey,
      ),
    [
      setKeypressCol,
      setKeypressIsMagkey,
      setKeypressRow,
      setMagkeyConfigLoaded,
      setMagkeyReleaseBeforeRapid,
    ],
  );

  return (
    <>
      {showTrackball && (
        <TrackballControlPanel
          items={trackballItems}
          params={params}
          loaded={loaded}
          trackballConnected={trackballConnected}
          onParamChange={onParamChange}
          onReadParam={onReadParam}
          onWriteParam={onWriteParam}
          onWriteAngle={onWriteAngle}
        />
      )}
      {(showDisplay || showLed) && (
        <DisplayLedControlPanel
          mode={showDisplay && showLed ? 'both' : showDisplay ? 'display' : 'led'}
          displayMode={displayMode}
          ledMode={ledMode}
          onRefreshModeSettings={onRefreshModeSettings}
          onApplyDisplayLedSettings={onApplyDisplayLedSettings}
          onSendDisplayKeypressTarget={onSendDisplayKeypressTarget}
        />
      )}
      {showKeypress && (
        <KeypressControlPanel
          mode={mode}
          row={keypressRow}
          col={keypressCol}
          value={keypressValue}
          busy={keypressBusy}
          magkeyActuation={magkeyActuation}
          magkeyRelease={magkeyRelease}
          magkeyRapid={magkeyRapid}
          magkeyReleaseBeforeRapid={magkeyReleaseBeforeRapid}
          magkeyLoaded={magkeyConfigLoaded}
          magkeyBusy={magkeyConfigBusy}
          magkeyReady={isMagkeyTarget}
          onReadKeypress={onReadKeypress}
          onReadMagkeyConfig={onReadMagkeyConfig}
          onWriteMagkeyConfig={onWriteMagkeyConfig}
          onChangeMagkeyActuation={setMagkeyActuation}
          onChangeMagkeyRelease={setMagkeyRelease}
          onChangeMagkeyRapid={setMagkeyRapid}
          onChangeMagkeyReleaseBeforeRapid={setMagkeyReleaseBeforeRapid}
          onChangeRow={keypressResetHandlers.onChangeRow}
          onChangeCol={keypressResetHandlers.onChangeCol}
        />
      )}
    </>
  );
};
