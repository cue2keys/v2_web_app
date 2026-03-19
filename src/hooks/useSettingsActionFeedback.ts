import { runWithFeedback } from '@/lib/actionFeedback';
import type { SchemaItem } from '@/lib/schema';
import { useDeviceStore } from '@/store/deviceStore';
import type { ErrorToastConfig, ToastConfig } from './useWriteActionFeedback';
import { useWriteActionFeedback } from './useWriteActionFeedback';

interface ParamActionArgs {
  onReadParam: (p: SchemaItem) => Promise<void>;
  onWriteParam: (p: SchemaItem) => Promise<void>;
}

interface DisplayLedActionArgs {
  onRefreshModeSettings: () => Promise<Record<number, boolean> | null>;
  onApplyDisplayLedSettings: (nextDisplay: number, nextLed: number) => Promise<void>;
  onSendDisplayKeypressTarget: (row: number, col: number) => Promise<void>;
  refreshLogPrefix: string;
  applyLogPrefix: string;
  keypressLogPrefix?: string;
  refreshAfterApply?: boolean;
  applySuccessToast?: ToastConfig;
  applyErrorToast?: ErrorToastConfig;
  keypressSuccessToast?: (row: number, col: number) => ToastConfig;
  keypressErrorToast?: ErrorToastConfig;
}

type ArgResolver<TArgs extends unknown[], TValue> = TValue | ((...args: TArgs) => TValue);
type ResultResolver<TArgs extends unknown[], TResult, TValue> =
  | TValue
  | ((result: TResult, ...args: TArgs) => TValue);

interface CreateWriteActionOptions<TArgs extends unknown[], TResult> {
  logPrefix: ArgResolver<TArgs, string>;
  successToast?: ResultResolver<TArgs, TResult, ToastConfig | undefined>;
  errorToast?: ArgResolver<TArgs, ErrorToastConfig | undefined>;
  resultError?: ResultResolver<TArgs, TResult, ErrorToastConfig | undefined>;
  afterResult?: (result: TResult, ...args: TArgs) => void;
  rethrow?: boolean;
}

export function useSettingsActionFeedback() {
  const appendLog = useDeviceStore((state) => state.appendLog);
  const { runWriteAction } = useWriteActionFeedback();

  const resolveArg = <TArgs extends unknown[], TValue>(
    value: ArgResolver<TArgs, TValue>,
    args: TArgs,
  ): TValue =>
    typeof value === 'function' ? (value as (...args: TArgs) => TValue)(...args) : value;

  const resolveResult = <TArgs extends unknown[], TResult, TValue>(
    value: ResultResolver<TArgs, TResult, TValue> | undefined,
    result: TResult,
    args: TArgs,
  ): TValue | undefined =>
    typeof value === 'function'
      ? (value as (result: TResult, ...args: TArgs) => TValue)(result, ...args)
      : value;

  const createWriteAction = <TArgs extends unknown[], TResult>(
    action: (...args: TArgs) => Promise<TResult>,
    options: CreateWriteActionOptions<TArgs, TResult>,
  ) => {
    const {
      logPrefix,
      successToast,
      errorToast,
      resultError,
      afterResult,
      rethrow = false,
    } = options;
    return (...args: TArgs) =>
      runWriteAction(() => action(...args), {
        logPrefix: resolveArg(logPrefix, args),
        successToast: successToast
          ? (result) => resolveResult(successToast, result, args)
          : undefined,
        errorToast: errorToast ? resolveArg(errorToast, args) : undefined,
        resultError: resultError ? (result) => resolveResult(resultError, result, args) : undefined,
        afterResult: afterResult ? (result) => afterResult(result, ...args) : undefined,
        rethrow,
      });
  };

  const createParamActions = ({ onReadParam, onWriteParam }: ParamActionArgs) => ({
    onRead: (p: SchemaItem) =>
      runWithFeedback(() => onReadParam(p), {
        appendLog,
        logPrefix: `read ${p.key} err`,
      }),
    onWrite: createWriteAction(onWriteParam, {
      logPrefix: (p) => `write ${p.key} err`,
      successToast: (_, p) => ({ title: 'Saved', description: `${p.label} updated` }),
      errorToast: { title: 'Failed' },
    }),
  });

  const createDisplayLedActions = ({
    onRefreshModeSettings,
    onApplyDisplayLedSettings,
    onSendDisplayKeypressTarget,
    refreshLogPrefix,
    applyLogPrefix,
    keypressLogPrefix = 'display keypress err',
    refreshAfterApply = false,
    applySuccessToast,
    applyErrorToast,
    keypressSuccessToast,
    keypressErrorToast,
  }: DisplayLedActionArgs) => ({
    onRefresh: async () => {
      await runWithFeedback(() => onRefreshModeSettings(), {
        appendLog,
        logPrefix: refreshLogPrefix,
      });
    },
    onApply: createWriteAction(
      async (nextDisplay: number, nextLed: number) => {
        await onApplyDisplayLedSettings(nextDisplay, nextLed);
        if (!refreshAfterApply) return;
        try {
          await onRefreshModeSettings();
        } catch {}
      },
      {
        logPrefix: applyLogPrefix,
        successToast: applySuccessToast,
        errorToast: applyErrorToast,
      },
    ),
    onShowKeypressTarget: createWriteAction(onSendDisplayKeypressTarget, {
      logPrefix: keypressLogPrefix,
      successToast: (_, row, col) => keypressSuccessToast?.(row, col),
      errorToast: keypressErrorToast,
    }),
  });

  return {
    createWriteAction,
    createParamActions,
    createDisplayLedActions,
  };
}
