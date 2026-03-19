import { useEffect, useRef, useState } from 'react';
import { subscribeToast } from '../../lib/toast';

interface Toast {
  id: number;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const unsub = subscribeToast((t) => {
      setToasts((prev) => [...prev, t]);
      // auto dismiss after 2500ms
      const timerId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
        timerIdsRef.current.delete(timerId);
      }, 2500);
      timerIdsRef.current.add(timerId);
    });
    return () => {
      unsub();
      timerIdsRef.current.forEach((timerId) => clearTimeout(timerId));
      timerIdsRef.current.clear();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-md border bg-card px-4 py-3 text-card-foreground shadow ${
            t.type === 'success'
              ? 'border-emerald-300'
              : t.type === 'error'
                ? 'border-destructive/40'
                : 'border-border'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="text-sm font-medium">{t.title}</div>
          {t.description && (
            <div className="mt-0.5 text-xs text-secondary-foreground">{t.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
