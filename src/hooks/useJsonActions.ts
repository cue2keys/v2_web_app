import { defaultParamValue } from '@/lib/paramSchema';
import { pushToast } from '@/lib/toast';
import { formatErrorMessage } from '@/lib/utils';
import { writeDeviceNicknames } from '@/lib/deviceNicknames';
import { useDeviceStore } from '@/store/deviceStore';
import { useParamStore, type ParamValue } from '@/store/paramStore';
import type { SchemaItem } from '@/lib/schema';

interface JsonActionsArgs {
  activeSchema: SchemaItem[];
  readAll: () => Promise<void>;
  appendLog: (msg: string) => void;
  setDeviceNicknames: (nicknames: Record<string, string>) => void;
  setJsonText: (text: string) => void;
  setParams: (params: Record<number, ParamValue>) => void;
  setLoaded: (loaded: Record<number, boolean>) => void;
}

export function createJsonActions({
  activeSchema,
  readAll,
  appendLog,
  setDeviceNicknames,
  setJsonText,
  setParams,
  setLoaded,
}: JsonActionsArgs) {
  async function exportJSONToTextarea(options?: {
    includeSettings?: boolean;
    includeNicknames?: boolean;
  }) {
    const includeSettings = options?.includeSettings ?? true;
    const includeNicknames = options?.includeNicknames ?? true;

    if (includeSettings) {
      await readAll();
    }

    const payload: Record<string, unknown> = {
      schemaVersion: 1,
      timestamp: Date.now(),
    };
    if (includeSettings) {
      const latestParams = useParamStore.getState().params;
      const out: Record<string, ParamValue> = {};
      for (const p of activeSchema) out[p.key] = latestParams[p.id] ?? defaultParamValue(p);
      payload.params = out;
    }
    if (includeNicknames) {
      const latestNicknames = useDeviceStore.getState().deviceNicknames;
      payload.nicknames = { ...latestNicknames };
    }
    setJsonText(JSON.stringify(payload, null, 2));
    appendLog('exported JSON to textarea');
  }

  function importJSONFromTextarea(): boolean {
    try {
      interface ImportJson {
        schemaVersion?: number;
        timestamp?: number;
        params?: Record<string, ParamValue>;
        nicknames?: Record<string, string>;
      }
      const currentJsonText = useParamStore.getState().jsonText;
      const obj = JSON.parse(currentJsonText) as ImportJson;
      if (!obj || typeof obj !== 'object') throw new Error('invalid format');

      const hasParams = !!obj.params && typeof obj.params === 'object';
      const hasNicknames = !!obj.nicknames && typeof obj.nicknames === 'object';
      if (!hasParams && !hasNicknames)
        throw new Error('invalid format: params or nicknames required');

      if (hasParams) {
        const { params: currentParams, loaded: currentLoaded } = useParamStore.getState();
        const next = { ...currentParams } as Record<number, ParamValue>;
        const nextLoaded = { ...currentLoaded } as Record<number, boolean>;
        for (const p of activeSchema) {
          if (Object.prototype.hasOwnProperty.call(obj.params, p.key)) {
            const val = obj.params![p.key];
            if (val !== undefined) {
              next[p.id] = val;
              nextLoaded[p.id] = true;
            }
          }
        }
        setParams(next);
        setLoaded(nextLoaded);
      }

      if (hasNicknames) {
        const currentNicknames = useDeviceStore.getState().deviceNicknames;
        const merged = { ...currentNicknames };
        for (const [key, value] of Object.entries(obj.nicknames!)) {
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
              merged[key] = trimmed;
            } else {
              delete merged[key];
            }
          }
        }
        setDeviceNicknames(merged);
        writeDeviceNicknames(merged);
      }

      const parts: string[] = [];
      if (hasParams) parts.push('パラメーター');
      if (hasNicknames) parts.push('ニックネーム');
      appendLog(`imported JSON from textarea: ${parts.join(', ')}`);
      pushToast({
        title: 'Imported',
        description: `${parts.join('と')}をインポートしました${hasParams ? '（デバイスへの保存は Save All で行ってください）' : ''}`,
        type: 'success',
      });
      return hasParams;
    } catch (e: unknown) {
      const msg = formatErrorMessage(e);
      appendLog(`import json err: ${msg}`);
      pushToast({
        title: 'Import failed',
        description: `JSONの読み込みに失敗しました: ${msg}`,
        type: 'error',
      });
      return false;
    }
  }

  return { exportJSONToTextarea, importJSONFromTextarea };
}
