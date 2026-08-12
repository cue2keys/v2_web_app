import { Lightbulb, List, Monitor, MoreHorizontal, Mouse, Settings } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import kbConfigJson from './commonData/kb_config.json';
import demoConfigJson from './commonData/demo_config.json';
import { ControlSection } from './components/app/ControlSection';
import { DeviceSection } from './components/app/DeviceSection';
import { OtherSection } from './components/app/OtherSection';
import { ParamSection } from './components/app/ParamSection';
import { SearchResultsSection } from './components/app/SearchResultsSection';
import {
  SettingsMenuLayout,
  type SettingsCategory,
  type SettingsCategoryId,
} from './components/app/SettingsMenuLayout';
import { EmptyStateCard } from './components/EmptyStateCard';
import { Header } from './components/Header';
import { Toaster } from './components/ui/toaster';
import { useDeviceActions } from './hooks/useDeviceActions';
import { useParamActions } from './hooks/useParamActions';
import { useAppInit } from './hooks/useAppInit';
import { useDemoMode } from './hooks/useDemoMode';
import { useSettingsActionFeedback } from './hooks/useSettingsActionFeedback';
import { isDemoRequestedFromUrl } from './lib/demoMode';
import { toHex } from './lib/format';
import { getActiveSchema } from './lib/paramSchema';
import { useDeviceStore } from './store/deviceStore';
import { useParamStore } from './store/paramStore';
import { useShallow } from 'zustand/react/shallow';

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'devices',
    title: '接続デバイス',
    description: '検出済みモジュール一覧',
    icon: List,
  },
  {
    id: 'general',
    title: '一般',
    description: '基本パラメーターと入力設定',
    icon: Settings,
  },
  {
    id: 'trackball',
    title: 'トラックボール',
    description: '角度・感度・スクロール',
    icon: Mouse,
  },
  {
    id: 'display',
    title: 'ディスプレイ',
    description: '表示モードの切り替え',
    icon: Monitor,
  },
  {
    id: 'led',
    title: 'LED',
    description: '発光パターン',
    icon: Lightbulb,
  },
  {
    id: 'other',
    title: 'その他',
    description: '診断・設定',
    icon: MoreHorizontal,
  },
];

export function App() {
  const [demoRequested, setDemoRequested] = useState<boolean>(() => isDemoRequestedFromUrl());
  const { schema, search, loaded, setSearch } = useParamStore(
    useShallow((state) => ({
      schema: state.schema,
      search: state.search,
      loaded: state.loaded,
      setSearch: state.setSearch,
    })),
  );
  const { connected, demoMode, deviceRef } = useDeviceStore(
    useShallow((state) => ({
      connected: state.connected,
      demoMode: state.demoMode,
      deviceRef: state.deviceRef,
    })),
  );
  const activeSchema = useMemo(() => getActiveSchema(schema), [schema]);
  const isConnected = connected && !!deviceRef.current;
  const hasLoadedAll =
    activeSchema.length > 0 &&
    activeSchema.every((p) => p.optional === true || loaded[p.id] === true);
  const hasSearch = search.trim().length > 0;
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategoryId>('devices');

  const {
    buildParamsFromSchema,
    buildLoadedFromSchema,
    onParamChange,
    readParam,
    commitParam,
    commitCurrentParam,
    readAndStore,
    writeAngleValue,
    readAll,
    writeAll,
    exportJSONToTextarea,
    importJSONFromTextarea,
    resetDefaults,
  } = useParamActions();
  const { createWriteAction } = useSettingsActionFeedback();

  const {
    clearConnection,
    onConnect,
    refreshModeSettings,
    readKeypress,
    readKeypressFor,
    readMagkeyConfig,
    readMagkeyConfigFor,
    commitMagkeyConfigFor,
    writeMagkeyConfig,
    applyDisplayLedSettings,
    sendDisplayKeypressTarget,
    updateI2CAddress,
    updateStaticI2CAddress,
    onRescanDevices,
  } = useDeviceActions({ buildLoadedFromSchema, readAll, readParam, commitParam });

  const { isDemoActive, handleStartDemoMode } = useDemoMode({
    schema,
    demoConfigJson,
    isConnected,
    demoRequested,
    setDemoRequested,
  });

  useAppInit({
    kbConfigJson,
    buildParamsFromSchema,
    buildLoadedFromSchema,
    clearConnection,
  });

  const isReady = isDemoActive || (isConnected && hasLoadedAll);
  const handleUpdateStaticAddress = createWriteAction(updateStaticI2CAddress, {
    logPrefix: 'update address err',
    successToast: (_, nextAddr) => ({
      title: 'Saved',
      description: `I2C address updated to ${toHex(nextAddr)}`,
    }),
    errorToast: { title: 'Failed' },
    rethrow: true,
  });

  const controlSectionCommonProps = {
    onParamChange,
    onReadParam: readAndStore,
    onWriteParam: commitCurrentParam,
    onWriteAngle: writeAngleValue,
    onRefreshModeSettings: refreshModeSettings,
    onApplyDisplayLedSettings: applyDisplayLedSettings,
    onSendDisplayKeypressTarget: sendDisplayKeypressTarget,
    onReadKeypress: readKeypress,
    onReadMagkeyConfig: readMagkeyConfig,
    onWriteMagkeyConfig: writeMagkeyConfig,
  };

  return (
    <Fragment>
      {demoMode && (
        <div className="demo-mode-banner" role="status" aria-live="polite">
          demo mode
        </div>
      )}
      {isReady && (
        <Header
          connected={isConnected}
          demoMode={demoMode}
          onConnect={onConnect}
          onDisconnect={() => clearConnection('manual disconnect')}
          search={search}
          onSearch={setSearch}
          ready={isReady}
        />
      )}
      <main className="container max-w-none">
        {isReady ? (
          <>
            <SettingsMenuLayout
              categories={SETTINGS_CATEGORIES}
              activeCategoryId={settingsCategory}
              onSelectCategory={setSettingsCategory}
            >
              {hasSearch ? (
                <SearchResultsSection
                  onParamChange={onParamChange}
                  onReadParam={readAndStore}
                  onWriteParam={commitCurrentParam}
                  onRefreshModeSettings={refreshModeSettings}
                  onApplyDisplayLedSettings={applyDisplayLedSettings}
                  onSendDisplayKeypressTarget={sendDisplayKeypressTarget}
                />
              ) : (
                <>
                  {settingsCategory === 'devices' && (
                    <DeviceSection
                      onRefresh={onRescanDevices}
                      onUpdateAddress={updateI2CAddress}
                      onReadMagkeyConfigFor={readMagkeyConfigFor}
                      onReadKeypressFor={readKeypressFor}
                      onShowDisplayKeypressTarget={sendDisplayKeypressTarget}
                      onWriteMagkeyConfigFor={commitMagkeyConfigFor}
                    />
                  )}
                  {settingsCategory === 'general' && (
                    <ParamSection
                      onParamChange={onParamChange}
                      onReadParam={readAndStore}
                      onWriteParam={commitCurrentParam}
                      excludeKeys={['rescan_i2c_on_read_error', 'display_mode', 'led_base_mode']}
                    />
                  )}
                  {settingsCategory === 'trackball' && (
                    <ControlSection {...controlSectionCommonProps} mode="trackball" />
                  )}
                  {settingsCategory === 'display' && (
                    <ControlSection {...controlSectionCommonProps} mode="display" />
                  )}
                  {settingsCategory === 'led' && (
                    <ControlSection {...controlSectionCommonProps} mode="led" />
                  )}
                  {settingsCategory === 'other' && (
                    <OtherSection
                      onParamChange={onParamChange}
                      onReadParam={readAndStore}
                      onWriteParam={commitCurrentParam}
                      onReadAll={readAll}
                      onWriteAll={writeAll}
                      onResetDefaults={resetDefaults}
                      onExport={exportJSONToTextarea}
                      onImport={importJSONFromTextarea}
                      onUpdateStaticAddress={handleUpdateStaticAddress}
                      controlSectionCommonProps={controlSectionCommonProps}
                    />
                  )}
                </>
              )}
            </SettingsMenuLayout>
          </>
        ) : (
          <EmptyStateCard
            connected={isConnected}
            onConnect={onConnect}
            onReadAll={readAll}
            onEnterDemoMode={handleStartDemoMode}
          />
        )}
        <Toaster />
      </main>
    </Fragment>
  );
}
