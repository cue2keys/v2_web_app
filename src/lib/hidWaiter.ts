export interface InputReportWaiter<T> {
  promise: Promise<T>;
  dispose: () => void;
}

export function createInputReportWaiter<T>(
  dev: HIDDevice,
  parseReport: (reportData: Uint8Array, reportId: number) => T | undefined,
  timeoutMs = 2000,
): InputReportWaiter<T> {
  let onInputReport: ((e: HIDInputReportEvent) => void) | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    try {
      if (onInputReport) {
        dev.removeEventListener('inputreport', onInputReport);
      }
    } catch {}
  };

  const promise = new Promise<T>((resolve, reject) => {
    const finishWith = (result: { ok: true; value: T } | { ok: false; error: Error }) => {
      dispose();
      if (result.ok) {
        resolve(result.value);
      } else {
        reject(result.error);
      }
    };

    timeoutId = setTimeout(() => {
      finishWith({ ok: false, error: new Error('timeout') });
    }, timeoutMs);

    function onInputReportInternal(e: HIDInputReportEvent) {
      const parsed = parseReport(new Uint8Array(e.data.buffer), e.reportId);
      if (parsed === undefined) return;
      finishWith({ ok: true, value: parsed });
    }

    onInputReport = onInputReportInternal;
    dev.addEventListener('inputreport', onInputReportInternal);
  });

  return { promise, dispose };
}
