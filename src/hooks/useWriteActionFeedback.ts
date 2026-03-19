import { notifyDemoWriteBlocked } from '@/lib/demoMode';
import { pushToast } from '@/lib/toast';
import { formatErrorMessage } from '@/lib/utils';
import { useDeviceStore } from '@/store/deviceStore';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

export interface ToastConfig {
  title: string;
  description?: string;
}

export interface ErrorToastConfig {
  title?: string;
  description?: string | ((errorMessage: string) => string);
}

export interface WriteActionOptions<TResult> {
  logPrefix: string;
  successToast?: ToastConfig | ((result: TResult) => ToastConfig | undefined);
  errorToast?: ErrorToastConfig;
  resultError?: (result: TResult) => ErrorToastConfig | undefined;
  afterResult?: (result: TResult) => void;
  rethrow?: boolean;
}

const resolveErrorDescription = (
  errorToast: ErrorToastConfig | undefined,
  message: string,
): string | undefined => {
  if (!errorToast) return message;
  return typeof errorToast.description === 'function'
    ? errorToast.description(message)
    : (errorToast.description ?? message);
};

export function useWriteActionFeedback() {
  const { appendLog, demoMode } = useDeviceStore(
    useShallow((state) => ({
      appendLog: state.appendLog,
      demoMode: state.demoMode,
    })),
  );

  const runWriteAction = useCallback(
    async <TResult>(
      action: () => Promise<TResult>,
      options: WriteActionOptions<TResult>,
    ): Promise<void> => {
      const {
        logPrefix,
        successToast,
        errorToast,
        resultError,
        afterResult,
        rethrow = false,
      } = options;

      if (demoMode) {
        notifyDemoWriteBlocked();
        return;
      }

      try {
        const result = await action();
        afterResult?.(result);

        const resultLevelError = resultError?.(result);
        if (resultLevelError) {
          pushToast({
            title: resultLevelError.title ?? 'Failed',
            description: resolveErrorDescription(
              resultLevelError,
              resultLevelError.title ?? 'Failed',
            ),
            type: 'error',
          });
          return;
        }

        const resolvedSuccessToast =
          typeof successToast === 'function' ? successToast(result) : successToast;
        if (resolvedSuccessToast) {
          pushToast({
            title: resolvedSuccessToast.title,
            description: resolvedSuccessToast.description,
            type: 'success',
          });
        }
        return;
      } catch (error) {
        const message = formatErrorMessage(error);
        appendLog(`${logPrefix}: ${message}`);
        if (errorToast) {
          pushToast({
            title: errorToast.title ?? 'Failed',
            description: resolveErrorDescription(errorToast, message),
            type: 'error',
          });
        }
        if (rethrow) {
          throw error;
        }
        return;
      }
    },
    [appendLog, demoMode],
  );

  return {
    runWriteAction,
  };
}
