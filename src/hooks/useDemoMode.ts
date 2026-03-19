import { useEffect } from 'react';
import { buildDemoSnapshot } from '@/lib/demoData';
import { buildDemoUrl, clearDemoQueryParam } from '@/lib/demoMode';
import { useDeviceStore } from '@/store/deviceStore';
import { useKeypressStore } from '@/store/keypressStore';
import { useMagkeyStore } from '@/store/magkeyStore';
import { useParamStore } from '@/store/paramStore';

interface UseDemoModeArgs {
  schema: Parameters<typeof buildDemoSnapshot>[0];
  demoConfigJson: object;
  isConnected: boolean;
  demoRequested: boolean;
  setDemoRequested: (v: boolean) => void;
}

export function useDemoMode({
  schema,
  demoConfigJson,
  isConnected,
  demoRequested,
  setDemoRequested,
}: UseDemoModeArgs) {
  const {
    demoMode,
    setDemoMode,
    setFwInfo,
    setDevList,
    setTrackballConnected,
    setTrackballFlagCount,
    setDisplayMode,
    setLedMode,
  } = useDeviceStore((state) => ({
    demoMode: state.demoMode,
    setDemoMode: state.setDemoMode,
    setFwInfo: state.setFwInfo,
    setDevList: state.setDevList,
    setTrackballConnected: state.setTrackballConnected,
    setTrackballFlagCount: state.setTrackballFlagCount,
    setDisplayMode: state.setDisplayMode,
    setLedMode: state.setLedMode,
  }));
  const { setParams, setLoaded } = useParamStore((state) => ({
    setParams: state.setParams,
    setLoaded: state.setLoaded,
  }));

  const isDemoActive = demoMode && !isConnected;

  useEffect(() => {
    setDemoMode(demoRequested && !isConnected);
  }, [demoRequested, isConnected, setDemoMode]);

  useEffect(() => {
    if (!isConnected || !demoRequested) return;
    clearDemoQueryParam();
    setDemoRequested(false);
  }, [demoRequested, isConnected, setDemoRequested]);

  useEffect(() => {
    if (!isDemoActive) return;
    if (schema.length === 0) return;
    const snapshot = buildDemoSnapshot(schema, demoConfigJson);
    setFwInfo(snapshot.fwInfo);
    setDevList(snapshot.devices);
    setTrackballConnected(snapshot.trackballConnected);
    setTrackballFlagCount(snapshot.trackballFlagCount);
    setDisplayMode(snapshot.displayMode);
    setLedMode(snapshot.ledMode);
    setParams(snapshot.params);
    setLoaded(snapshot.loaded);
    useKeypressStore.getState().setKeypressRow(snapshot.keypressRow);
    useKeypressStore.getState().setKeypressCol(snapshot.keypressCol);
    useKeypressStore.getState().setKeypressValue(snapshot.keypressValue);
    useKeypressStore.getState().setKeypressIsMagkey(snapshot.keypressIsMagkey);
    useMagkeyStore.getState().setMagkeyActuation(snapshot.magkeyActuation);
    useMagkeyStore.getState().setMagkeyRelease(snapshot.magkeyRelease);
    useMagkeyStore.getState().setMagkeyRapid(snapshot.magkeyRapid);
    useMagkeyStore.getState().setMagkeyConfigLoaded(true);
  }, [
    isDemoActive,
    schema,
    demoConfigJson,
    setDevList,
    setDisplayMode,
    setFwInfo,
    setLedMode,
    setLoaded,
    setParams,
    setTrackballConnected,
    setTrackballFlagCount,
  ]);

  const handleStartDemoMode = () => {
    const nextUrl = buildDemoUrl(window.location.href);
    window.location.assign(nextUrl);
  };

  return { isDemoActive, handleStartDemoMode };
}
