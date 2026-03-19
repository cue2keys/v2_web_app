import { pushToast } from './toast';
import { formatErrorMessage } from './utils';

interface SuccessToastOptions {
  title: string;
  description?: string;
}

interface ErrorToastOptions {
  title?: string;
  description?: string | ((errorMessage: string) => string);
}

interface RunWithFeedbackOptions {
  appendLog?: (message: string) => void;
  logPrefix?: string;
  successToast?: SuccessToastOptions;
  errorToast?: ErrorToastOptions;
  rethrow?: boolean;
}

export async function runWithFeedback<T>(
  action: () => Promise<T>,
  options: RunWithFeedbackOptions = {},
): Promise<T | undefined> {
  const { appendLog, logPrefix, successToast, errorToast, rethrow = false } = options;
  try {
    const result = await action();
    if (successToast) {
      pushToast({
        title: successToast.title,
        description: successToast.description,
        type: 'success',
      });
    }
    return result;
  } catch (error) {
    const message = formatErrorMessage(error);
    if (appendLog && logPrefix) {
      appendLog(`${logPrefix}: ${message}`);
    }
    if (errorToast) {
      pushToast({
        title: errorToast.title ?? 'Failed',
        description:
          typeof errorToast.description === 'function'
            ? errorToast.description(message)
            : (errorToast.description ?? message),
        type: 'error',
      });
    }
    if (rethrow) {
      throw error;
    }
    return undefined;
  }
}
