import { pushToast } from '@/lib/toast';

export const DEMO_WRITE_BLOCK_MESSAGE =
  'デモモードでは書き込みできません。デバイスを接続してください';

export const isDemoRequestedFromUrl = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
};

export const buildDemoUrl = (href: string): string => {
  const url = new URL(href);
  url.searchParams.set('demo', 'true');
  return url.toString();
};

export const clearDemoQueryParam = (): void => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('demo') !== 'true') return;
  url.searchParams.delete('demo');
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', next);
};

export const notifyDemoWriteBlocked = (): void => {
  pushToast({
    title: 'デモモード',
    description: DEMO_WRITE_BLOCK_MESSAGE,
    type: 'info',
  });
};
