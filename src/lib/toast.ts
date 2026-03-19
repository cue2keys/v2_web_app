interface Toast {
  id: number;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

type Listener = (t: Toast) => void;

const listeners = new Set<Listener>();
let idSeq = 1;

export function subscribeToast(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function pushToast(t: Omit<Toast, 'id'>) {
  const toast = { id: idSeq++, ...t } as Toast;
  listeners.forEach((fn) => fn(toast));
}
