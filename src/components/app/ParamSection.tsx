import type { FC } from 'react';
import { useMemo } from 'react';
import { ParamCard } from '@/components/ParamCard';
import { RotaryEncoderSection } from '@/components/RotaryEncoderSection';
import { useSettingsActionFeedback } from '@/hooks/useSettingsActionFeedback';
import { getActiveSchema, schemaParamValue } from '@/lib/paramSchema';
import type { SchemaItem } from '@/lib/schema';
import { clamp } from '@/lib/utils';
import { useParamStore, type ParamValue } from '@/store/paramStore';
import { useShallow } from 'zustand/react/shallow';
import { buildParamSectionItems } from './paramSectionHelpers';

interface Props {
  onParamChange: (p: SchemaItem, v: ParamValue) => void;
  onReadParam: (p: SchemaItem) => Promise<void>;
  onWriteParam: (p: SchemaItem) => Promise<void>;
  includeKeys?: string[];
  excludeKeys?: string[];
}

export const ParamSection: FC<Props> = ({
  onParamChange,
  onReadParam,
  onWriteParam,
  includeKeys,
  excludeKeys,
}) => {
  const { schema, params, loaded, search } = useParamStore(
    useShallow((state) => ({
      schema: state.schema,
      params: state.params,
      loaded: state.loaded,
      search: state.search,
    })),
  );
  const { createParamActions } = useSettingsActionFeedback();
  const activeSchema = useMemo(() => getActiveSchema(schema), [schema]);
  const { otherParams, sortedReItems } = useMemo(
    () =>
      buildParamSectionItems({
        activeSchema,
        search,
        includeKeys,
        excludeKeys,
      }),
    [activeSchema, search, includeKeys, excludeKeys],
  );
  const paramActions = useMemo(
    () => createParamActions({ onReadParam, onWriteParam }),
    [createParamActions, onReadParam, onWriteParam],
  );
  const paramValueOf = (p: SchemaItem): ParamValue => schemaParamValue(p, params);

  return (
    <>
      <section className="kbd-grid">
        {otherParams.map((p) => (
          <ParamCard
            key={p.id}
            p={p}
            val={paramValueOf(p)}
            loaded={!!loaded[p.id]}
            onChange={onParamChange}
            onRead={paramActions.onRead}
            onWrite={paramActions.onWrite}
          />
        ))}
      </section>
      <RotaryEncoderSection
        items={sortedReItems}
        params={params}
        loaded={loaded}
        onChange={(p, v) => onParamChange(p, clamp(v, 0, 3))}
        onRead={paramActions.onRead}
        onWrite={paramActions.onWrite}
      />
    </>
  );
};
