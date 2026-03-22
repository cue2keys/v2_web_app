import { useMemo } from 'react';
import { DisplayLedPanel } from '@/components/DisplayLedPanel';
import { TrackballCalibrator } from '@/components/TrackballCalibrator';
import { useSettingsActionFeedback } from '@/hooks/useSettingsActionFeedback';
import type { SchemaItem } from '@/lib/schema';
import type { ParamValue } from '@/store/paramStore';

interface TrackballControlPanelProps {
  items: SchemaItem[];
  params: Record<number, ParamValue>;
  loaded: Record<number, boolean>;
  trackballConnected: Record<number, boolean> | null;
  onParamChange: (p: SchemaItem, v: ParamValue) => void;
  onReadParam: (p: SchemaItem) => Promise<void>;
  onWriteParam: (p: SchemaItem) => Promise<void>;
  onWriteAngle: (p: SchemaItem, v: number) => Promise<void>;
}

interface DisplayLedControlPanelProps {
  mode: 'display' | 'led' | 'both';
  displayMode: number | null;
  ledMode: number | null;
  onRefreshModeSettings: () => Promise<Record<number, boolean> | null>;
  onApplyDisplayLedSettings: (nextDisplay: number, nextLed: number) => Promise<void>;
  onSendDisplayKeypressTarget: (row: number, col: number) => Promise<void>;
}

export function TrackballControlPanel({
  items,
  params,
  loaded,
  trackballConnected,
  onParamChange,
  onReadParam,
  onWriteParam,
  onWriteAngle,
}: TrackballControlPanelProps) {
  const { createParamActions } = useSettingsActionFeedback();
  const paramActions = createParamActions({ onReadParam, onWriteParam });

  return (
    <TrackballCalibrator
      items={items}
      params={params}
      loaded={loaded}
      connected={trackballConnected}
      onChange={onParamChange}
      onRead={paramActions.onRead}
      onWrite={paramActions.onWrite}
      onWriteAngle={onWriteAngle}
    />
  );
}

export function DisplayLedControlPanel({
  mode,
  displayMode,
  ledMode,
  onRefreshModeSettings,
  onApplyDisplayLedSettings,
  onSendDisplayKeypressTarget,
}: DisplayLedControlPanelProps) {
  const { createDisplayLedActions } = useSettingsActionFeedback();
  const actions = useMemo(
    () =>
      createDisplayLedActions({
        onRefreshModeSettings,
        onApplyDisplayLedSettings,
        onSendDisplayKeypressTarget,
        refreshLogPrefix: 'display/led refresh err',
        applyLogPrefix: 'display/led apply err',
        refreshAfterApply: true,
        applySuccessToast: {
          title: 'Applied',
          description: 'Display / LED settings updated',
        },
        applyErrorToast: { title: 'Apply failed' },
        keypressSuccessToast: (row, col) => ({
          title: 'Applied',
          description: `Display switched to 指定キー表示 ${row}/${col}`,
        }),
        keypressErrorToast: { title: 'Apply failed' },
      }),
    [
      createDisplayLedActions,
      onApplyDisplayLedSettings,
      onRefreshModeSettings,
      onSendDisplayKeypressTarget,
    ],
  );

  return (
    <DisplayLedPanel
      displayMode={displayMode}
      ledMode={ledMode}
      variant={mode}
      onRefresh={actions.onRefresh}
      onApply={actions.onApply}
      onShowKeypressTarget={actions.onShowKeypressTarget}
    />
  );
}
