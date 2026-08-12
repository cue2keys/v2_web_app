import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { SchemaItem } from '@/lib/schema';
import { defaultParamValue, getActiveSchema, schemaParamValue } from '@/lib/paramSchema';
import { packValue, unpackValue, clamp, formatErrorMessage } from '@/lib/utils';
import { send } from '@/lib/hid';
import { APICommand } from '@/types/protocol';
import type { HIDCommandValueID } from '@/generated/pendant/v2';
import { useDeviceStore } from '@/store/deviceStore';
import { useParamStore, type ParamValue } from '@/store/paramStore';
import { useShallow } from 'zustand/react/shallow';
import { createJsonActions } from './useJsonActions';
import { useWriteActionFeedback } from './useWriteActionFeedback';

interface BatchWriteSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  failures: string[];
}

export function useParamActions() {
  const { deviceRef, appendLog, setDeviceNicknames } = useDeviceStore(
    useShallow((state) => ({
      deviceRef: state.deviceRef,
      appendLog: state.appendLog,
      setDeviceNicknames: state.setDeviceNicknames,
    })),
  );
  const { runWriteAction } = useWriteActionFeedback();
  const { schema, params, loaded, setParam, setLoadedFor, setParams, setLoaded, setJsonText } =
    useParamStore(
      useShallow((state) => ({
        schema: state.schema,
        params: state.params,
        loaded: state.loaded,
        setParam: state.setParam,
        setLoadedFor: state.setLoadedFor,
        setParams: state.setParams,
        setLoaded: state.setLoaded,
        setJsonText: state.setJsonText,
      })),
    );
  const activeSchema = useMemo(() => getActiveSchema(schema), [schema]);
  const lastSaveTimeRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduledSaveAtRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const buildParamsFromSchema = useCallback((items: SchemaItem[]): Record<number, ParamValue> => {
    const out: Record<number, ParamValue> = {};
    for (const p of items) {
      out[p.id] = defaultParamValue(p);
    }
    return out;
  }, []);

  const buildLoadedFromSchema = useCallback((items: SchemaItem[]): Record<number, boolean> => {
    const out: Record<number, boolean> = {};
    for (const p of items) out[p.id] = false;
    return out;
  }, []);

  const paramValueOf = (p: SchemaItem): ParamValue => schemaParamValue(p, params);

  const scheduleSave = () => {
    if (!deviceRef.current) return;

    const now = Date.now();
    const earliestNext = lastSaveTimeRef.current ? lastSaveTimeRef.current + 1000 : now;
    const targetTime = Math.max(now, earliestNext);

    if (scheduledSaveAtRef.current !== null) {
      if (scheduledSaveAtRef.current <= targetTime) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    }

    const delay = Math.max(0, targetTime - now);
    scheduledSaveAtRef.current = targetTime;

    const runSave = async () => {
      try {
        const dev = deviceRef.current;
        if (!dev) return;
        await send(dev, APICommand.CUSTOM_MENU_SAVE, 0 as HIDCommandValueID, new Uint8Array());
        lastSaveTimeRef.current = Date.now();
      } catch (e) {
        appendLog(`save err: ${formatErrorMessage(e)}`);
      } finally {
        scheduledSaveAtRef.current = null;
        saveTimerRef.current = null;
      }
    };

    if (delay === 0) {
      void runSave();
    } else {
      saveTimerRef.current = window.setTimeout(() => {
        void runSave();
      }, delay);
    }
  };

  const readParam = async (p: SchemaItem) => {
    const res = await send(
      deviceRef.current!,
      APICommand.CUSTOM_MENU_GET_VALUE,
      p.id,
      new Uint8Array(),
    );
    return unpackValue(p, res);
  };

  const commitParam = async (p: SchemaItem, val: ParamValue) => {
    const payload = packValue(p, val);
    await send(deviceRef.current!, APICommand.CUSTOM_MENU_SET_VALUE, p.id, payload);
    scheduleSave();
  };

  const onParamChange = (p: SchemaItem, v: ParamValue) => setParam(p.id, v);

  const readAndStore = async (p: SchemaItem) => {
    try {
      const v = await readParam(p);
      setParam(p.id, v);
      setLoadedFor(p.id, true);
    } catch (e) {
      appendLog(`read ${p.key} err: ${formatErrorMessage(e)}`);
    }
  };

  const commitCurrentParam = async (p: SchemaItem) => commitParam(p, paramValueOf(p));

  const writeParam = (p: SchemaItem) =>
    runWriteAction(() => commitCurrentParam(p), {
      logPrefix: `write ${p.key} err`,
      successToast: { title: 'Saved', description: `${p.label} updated` },
      errorToast: { title: 'Failed' },
    });

  const commitAngleValue = async (p: SchemaItem, v: number) => {
    const normalized = ((Math.round(v) % 360) + 360) % 360;
    const clampedValue = clamp(normalized, p.min ?? 0, p.max ?? 359);
    setParam(p.id, clampedValue);
    await commitParam(p, clampedValue);
    return clampedValue;
  };

  const writeAngleValue = (p: SchemaItem, v: number) =>
    runWriteAction(() => commitAngleValue(p, v), {
      logPrefix: `write ${p.key} err`,
      successToast: (clampedValue) => ({
        title: 'Saved',
        description: `${p.label} を ${clampedValue}° に設定しました`,
      }),
      errorToast: { title: 'Failed' },
    });

  async function readAll() {
    for (const p of activeSchema) {
      try {
        const v = await readParam(p);
        setParam(p.id, v);
        setLoadedFor(p.id, true);
      } catch (e) {
        appendLog(`readAll: ${p.key} skipped (${formatErrorMessage(e)})`);
      }
    }
  }

  const commitWriteAll = async (): Promise<BatchWriteSummary> => {
    const summary: BatchWriteSummary = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      failures: [],
    };
    for (const p of activeSchema) {
      if (p.optional && !loaded[p.id]) {
        continue;
      }
      summary.attempted += 1;
      try {
        await commitParam(p, paramValueOf(p));
        summary.succeeded += 1;
      } catch (e) {
        summary.failed += 1;
        summary.failures.push(`${p.key} skipped (${formatErrorMessage(e)})`);
      }
    }
    return summary;
  };

  const writeAll = () =>
    runWriteAction(commitWriteAll, {
      logPrefix: 'writeAll err',
      successToast: (summary) =>
        summary.failed === 0 ? { title: 'Saved', description: 'All values written' } : undefined,
      errorToast: { title: 'Failed' },
      resultError: (summary) =>
        summary.failed > 0
          ? {
              title: 'Failed',
              description: `${summary.succeeded}/${summary.attempted} values written. Check log.`,
            }
          : undefined,
      afterResult: (summary) => {
        summary.failures.forEach((message) => appendLog(`writeAll: ${message}`));
      },
    });

  const { exportJSONToTextarea, importJSONFromTextarea } = createJsonActions({
    activeSchema,
    readAll,
    appendLog,
    setDeviceNicknames,
    setJsonText,
    setParams,
    setLoaded,
  });

  const resetDefaults = () => setParams(buildParamsFromSchema(activeSchema));

  return {
    buildParamsFromSchema,
    buildLoadedFromSchema,
    paramValueOf,
    onParamChange,
    readParam,
    commitParam,
    commitCurrentParam,
    writeParam,
    readAndStore,
    writeAngleValue,
    readAll,
    writeAll,
    exportJSONToTextarea,
    importJSONFromTextarea,
    resetDefaults,
  };
}
