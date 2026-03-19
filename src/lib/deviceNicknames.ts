export type DeviceNicknames = Record<string, string>;

const STORAGE_KEY = 'cue2keys.deviceNicknames.v1';

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const readDeviceNicknames = (): DeviceNicknames => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)) return {};
    const out: DeviceNicknames = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
};

export const writeDeviceNicknames = (map: DeviceNicknames) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage failures (quota, privacy mode, etc.)
  }
};

export const updateDeviceNickname = (
  prev: DeviceNicknames,
  uid: bigint,
  nickname: string,
): DeviceNicknames => {
  const key = uid.toString();
  const trimmed = nickname.trim();
  const next = { ...prev };
  if (trimmed) {
    next[key] = trimmed;
  } else {
    delete next[key];
  }
  writeDeviceNicknames(next);
  return next;
};
