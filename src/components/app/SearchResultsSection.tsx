import type { FC } from 'react';
import { useMemo } from 'react';
import { DisplayLedPanel } from '@/components/DisplayLedPanel';
import { ParamCard } from '@/components/ParamCard';
import { useSettingsActionFeedback } from '@/hooks/useSettingsActionFeedback';
import { getActiveSchema, schemaParamValue } from '@/lib/paramSchema';
import type { SchemaItem } from '@/lib/schema';
import { useDeviceStore } from '@/store/deviceStore';
import { useParamStore, type ParamValue } from '@/store/paramStore';
import { useShallow } from 'zustand/react/shallow';
import {
  buildSearchResultGroups,
  countSearchResults,
  type SearchResultItem,
} from './searchResultsHelpers';

interface Props {
  onParamChange: (p: SchemaItem, v: ParamValue) => void;
  onReadParam: (p: SchemaItem) => Promise<void>;
  onWriteParam: (p: SchemaItem) => Promise<void>;
  onRefreshModeSettings: () => Promise<Record<number, boolean> | null>;
  onApplyDisplayLedSettings: (nextDisplay: number, nextLed: number) => Promise<void>;
  onSendDisplayKeypressTarget: (row: number, col: number) => Promise<void>;
}

export const SearchResultsSection: FC<Props> = ({
  onParamChange,
  onReadParam,
  onWriteParam,
  onRefreshModeSettings,
  onApplyDisplayLedSettings,
  onSendDisplayKeypressTarget,
}) => {
  const { schema, params, loaded, search } = useParamStore(
    useShallow((state) => ({
      schema: state.schema,
      params: state.params,
      loaded: state.loaded,
      search: state.search,
    })),
  );
  const { displayMode, ledMode } = useDeviceStore(
    useShallow((state) => ({
      displayMode: state.displayMode,
      ledMode: state.ledMode,
    })),
  );
  const { createDisplayLedActions, createParamActions } = useSettingsActionFeedback();
  const activeSchema = useMemo(() => getActiveSchema(schema), [schema]);
  const groupedResults = useMemo(
    () => buildSearchResultGroups(activeSchema, search),
    [activeSchema, search],
  );
  const resultCount = useMemo(() => countSearchResults(groupedResults), [groupedResults]);
  const paramActions = useMemo(
    () => createParamActions({ onReadParam, onWriteParam }),
    [createParamActions, onReadParam, onWriteParam],
  );
  const displayActions = useMemo(
    () =>
      createDisplayLedActions({
        onRefreshModeSettings,
        onApplyDisplayLedSettings,
        onSendDisplayKeypressTarget,
        refreshLogPrefix: 'display refresh err',
        applyLogPrefix: 'display apply err',
      }),
    [
      createDisplayLedActions,
      onApplyDisplayLedSettings,
      onRefreshModeSettings,
      onSendDisplayKeypressTarget,
    ],
  );
  const ledActions = useMemo(
    () =>
      createDisplayLedActions({
        onRefreshModeSettings,
        onApplyDisplayLedSettings,
        onSendDisplayKeypressTarget,
        refreshLogPrefix: 'led refresh err',
        applyLogPrefix: 'led apply err',
      }),
    [
      createDisplayLedActions,
      onApplyDisplayLedSettings,
      onRefreshModeSettings,
      onSendDisplayKeypressTarget,
    ],
  );
  const paramValueOf = (p: SchemaItem): ParamValue => schemaParamValue(p, params);

  if (!search.trim()) return null;

  const renderItem = (item: SearchResultItem) => {
    if (item.kind === 'param') {
      return (
        <ParamCard
          p={item.param}
          val={paramValueOf(item.param)}
          loaded={!!loaded[item.param.id]}
          onChange={onParamChange}
          onRead={paramActions.onRead}
          onWrite={paramActions.onWrite}
        />
      );
    }

    const actions = item.kind === 'display-panel' ? displayActions : ledActions;
    return (
      <DisplayLedPanel
        displayMode={displayMode}
        ledMode={ledMode}
        variant={item.kind === 'display-panel' ? 'display' : 'led'}
        onRefresh={actions.onRefresh}
        onApply={actions.onApply}
        onShowKeypressTarget={actions.onShowKeypressTarget}
      />
    );
  };

  return (
    <section className="space-y-3">
      <div className="text-sm text-secondary-foreground">
        検索結果: "{search}" ({resultCount})
      </div>
      {resultCount === 0 ? (
        <p className="text-sm text-secondary-foreground">該当する設定がありません。</p>
      ) : (
        <div className="space-y-5">
          {groupedResults.map((group, groupIdx) => (
            <div key={`${group.label}-${groupIdx}`} className="space-y-2">
              <div className="text-xs font-medium text-secondary-foreground">{group.label}</div>
              <section className="kbd-grid">
                {group.items.map((item) => (
                  <div key={item.id}>{renderItem(item)}</div>
                ))}
              </section>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
