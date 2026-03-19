import { DeviceItemT } from '@/generated/pendant/v2';
import type { ModuleType } from '@/generated/pendant/v2/module-type';
import { getActiveSchema } from '@/lib/paramSchema';
import type { SchemaItem } from '@/lib/schema';
import type { ParamValue } from '@/store/paramStore';

interface DemoDeviceConfig {
  ch: number;
  addr: number;
  type: number;
  shift: number;
  uid: string;
}

interface DemoConfig {
  fwInfo?: string;
  displayMode?: number;
  ledMode?: number;
  trackballConnected?: Record<string, boolean>;
  trackballFlagCount?: number;
  devices?: DemoDeviceConfig[];
  keypress?: {
    row?: number;
    col?: number;
    value?: number;
    isMagkey?: boolean;
  };
  magkey?: {
    actuation?: number;
    release?: number;
    rapid?: boolean;
  };
  paramRandomSeed?: number;
  paramOverrides?: Record<string, number>;
}

export interface DemoSnapshot {
  fwInfo: string;
  displayMode: number;
  ledMode: number;
  trackballConnected: Record<number, boolean> | null;
  trackballFlagCount: number;
  devices: DeviceItemT[];
  keypressRow: number;
  keypressCol: number;
  keypressValue: number;
  keypressIsMagkey: boolean;
  magkeyActuation: number;
  magkeyRelease: number;
  magkeyRapid: boolean;
  params: Record<number, ParamValue>;
  loaded: Record<number, boolean>;
}

const createRng = (seed: number): (() => number) => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const randomInt = (min: number, max: number, rnd: () => number): number => {
  if (max <= min) return min;
  return min + Math.floor(rnd() * (max - min + 1));
};

const randomValueForParam = (item: SchemaItem, rnd: () => number): ParamValue => {
  if (item.type === 'bool') {
    return rnd() >= 0.5 ? 1 : 0;
  }
  if (item.type === 'enum' && item.options && item.options.length > 0) {
    const index = randomInt(0, item.options.length - 1, rnd);
    return item.options[index]?.value ?? 0;
  }
  if (item.type === 'string') {
    return String(item.default ?? 'demo');
  }

  const min = Math.trunc(item.min ?? 0);
  const max = Math.trunc(item.max ?? min + 100);
  const step = Math.max(1, Math.trunc(item.step ?? 1));
  const raw = randomInt(min, max, rnd);
  return min + Math.floor((raw - min) / step) * step;
};

const toDevice = (config: DemoDeviceConfig): DeviceItemT => {
  let uid = BigInt(0);
  try {
    uid = BigInt(config.uid);
  } catch {
    uid = BigInt(0);
  }
  return new DeviceItemT(config.ch, config.addr, config.type as ModuleType, config.shift, uid);
};

const toTrackballMap = (input?: Record<string, boolean>): Record<number, boolean> | null => {
  if (!input) return null;
  const out: Record<number, boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    const idx = Number.parseInt(key, 10);
    if (!Number.isFinite(idx) || idx <= 0) continue;
    out[idx] = Boolean(value);
  }
  return Object.keys(out).length > 0 ? out : null;
};

export const buildDemoSnapshot = (schema: SchemaItem[], config: DemoConfig): DemoSnapshot => {
  const rnd = createRng(config.paramRandomSeed ?? 1);
  const activeSchema = getActiveSchema(schema);
  const displayMode = config.displayMode ?? 0;
  const ledMode = config.ledMode ?? 0;
  const params: Record<number, ParamValue> = {};
  const loaded: Record<number, boolean> = {};

  for (const item of activeSchema) {
    const override = config.paramOverrides?.[item.key];
    params[item.id] = override ?? randomValueForParam(item, rnd);
    loaded[item.id] = true;
  }

  const displayItem = activeSchema.find((item) => item.key === 'display_mode');
  if (displayItem) {
    params[displayItem.id] = displayMode;
  }
  const ledItem = activeSchema.find((item) => item.key === 'led_base_mode');
  if (ledItem) {
    params[ledItem.id] = ledMode;
  }

  const trackballConnected = toTrackballMap(config.trackballConnected);
  const devices = (config.devices ?? []).map(toDevice);

  return {
    fwInfo: config.fwInfo ?? 'DEMO',
    displayMode,
    ledMode,
    trackballConnected,
    trackballFlagCount:
      config.trackballFlagCount ??
      (trackballConnected ? Object.keys(trackballConnected).length : 0),
    devices,
    keypressRow: config.keypress?.row ?? 0,
    keypressCol: config.keypress?.col ?? 0,
    keypressValue: config.keypress?.value ?? 0,
    keypressIsMagkey: Boolean(config.keypress?.isMagkey),
    magkeyActuation: config.magkey?.actuation ?? 600,
    magkeyRelease: config.magkey?.release ?? 500,
    magkeyRapid: Boolean(config.magkey?.rapid),
    params,
    loaded,
  };
};
