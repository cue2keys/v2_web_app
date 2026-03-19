import type { DeviceItemT } from '@/generated/pendant/v2';
import { ModuleType } from '@/generated/pendant/v2/module-type';
import { classifyDevices, isRotaryEncoderType } from '@/lib/deviceList';
import { MATRIX_COLS, MATRIX_ROWS } from '@/lib/magkey';

const VIA_VENDOR_ID = '0xFEFD';
const VIA_PRODUCT_ID = '0xCCCC';
const VIA_KEYBOARD_NAME = 'cue2keys2';
const ENCODER_NEWLINES = '\n'.repeat(9);

const VIA_EXPORTABLE_TYPES = new Set<ModuleType>([
  ModuleType.V2_Keys4,
  ModuleType.V2_MagKeys4,
  ModuleType.V1_PCA9557_Keys4,
  ModuleType.V1_PCA9557_Keys5,
  ModuleType.V1_XL9555_Keys4,
  ModuleType.V1_XL9555_Keys5,
  ModuleType.V1_PCA9534A_RE,
  ModuleType.V2_RE,
]);

interface ViaKLEAdjustment {
  x?: number;
  y?: number;
}

export type ViaKLEEntry = string | ViaKLEAdjustment;
export type ViaKLERow = ViaKLEEntry[];

interface ViaMatrixPosition {
  row: number;
  col: number;
}

interface ViaModuleDescriptor {
  device: DeviceItemT;
  encoderIndex: number | null;
  height: number;
}

export interface ViaKeyboardDefinition {
  name: string;
  productId: string;
  vendorId: string;
  menus: [];
  keycodes: [];
  matrix: {
    rows: number;
    cols: number;
  };
  customKeycodes: [];
  layouts: {
    keymap: ViaKLERow[];
  };
}

export const isViaExportableDevice = (type: ModuleType): boolean => VIA_EXPORTABLE_TYPES.has(type);

export function getViaExportDevices(items: DeviceItemT[]): DeviceItemT[] {
  const { recognizedItems } = classifyDevices(items);
  return recognizedItems.filter((device) => device.ch > 0 && isViaExportableDevice(device.type));
}

export function getViaModuleHeight(device: DeviceItemT): number {
  switch (device.type) {
    case ModuleType.V1_PCA9557_Keys5:
    case ModuleType.V1_XL9555_Keys5:
      return 5;
    case ModuleType.V1_PCA9534A_RE:
    case ModuleType.V2_RE:
      return 1;
    case ModuleType.V1_PCA9557_Keys4:
    case ModuleType.V1_XL9555_Keys4:
    case ModuleType.V2_Keys4:
    case ModuleType.V2_MagKeys4:
      return 4;
    default:
      throw new Error(`Unsupported VIA module type: ${device.type}`);
  }
}

export function matrixIndexToRowCol(index: number): ViaMatrixPosition {
  if (!Number.isInteger(index) || index < 0 || index >= MATRIX_ROWS * MATRIX_COLS) {
    throw new Error(`Matrix index out of range: ${index}`);
  }
  return {
    row: Math.floor(index / MATRIX_COLS),
    col: index % MATRIX_COLS,
  };
}

const buildMatrixLabel = (index: number): string => {
  const { row, col } = matrixIndexToRowCol(index);
  return `${row},${col}`;
};

const buildEncoderLabel = (index: number, encoderIndex: number): string =>
  `${buildMatrixLabel(index)}${ENCODER_NEWLINES}e${encoderIndex}`;

const buildModuleLabel = (module: ViaModuleDescriptor, rowIndex: number): string | null => {
  if (rowIndex >= module.height) return null;

  if (isRotaryEncoderType(module.device.type)) {
    if (rowIndex > 0 || module.encoderIndex == null) return null;
    return buildEncoderLabel(module.device.shift, module.encoderIndex);
  }

  return buildMatrixLabel(module.device.shift + rowIndex);
};

function buildChannelRows(modules: ViaModuleDescriptor[], addChannelGap: boolean): ViaKLERow[] {
  const height = Math.max(...modules.map((module) => module.height));
  const rows: ViaKLERow[] = [];

  for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
    const row: ViaKLERow = [];
    let pendingGap = 0;

    if (addChannelGap && rowIndex === 0) {
      row.push({ y: 1 });
    }

    for (const module of modules) {
      const label = buildModuleLabel(module, rowIndex);
      if (label == null) {
        pendingGap += 1;
        continue;
      }
      if (pendingGap > 0) {
        row.push({ x: pendingGap });
        pendingGap = 0;
      }
      row.push(label);
    }

    rows.push(row);
  }

  return rows;
}

export function buildViaLayoutRows(items: DeviceItemT[]): ViaKLERow[] {
  const devices = getViaExportDevices(items);
  if (devices.length === 0) {
    throw new Error('No VIA-exportable devices connected');
  }

  const byChannel = new Map<number, DeviceItemT[]>();
  for (const device of devices) {
    const list = byChannel.get(device.ch);
    if (list) {
      list.push(device);
    } else {
      byChannel.set(device.ch, [device]);
    }
  }

  const rows: ViaKLERow[] = [];
  const channelIds = Array.from(byChannel.keys()).sort((a, b) => a - b);
  let encoderIndex = 0;

  channelIds.forEach((channelId, channelOffset) => {
    const channelDevices = byChannel.get(channelId) ?? [];
    const modules = channelDevices.map((device) => {
      const descriptor: ViaModuleDescriptor = {
        device,
        encoderIndex: isRotaryEncoderType(device.type) ? encoderIndex++ : null,
        height: getViaModuleHeight(device),
      };
      return descriptor;
    });
    rows.push(...buildChannelRows(modules, channelOffset > 0));
  });

  return rows;
}

export function buildViaKeyboardDefinition(items: DeviceItemT[]): ViaKeyboardDefinition {
  return {
    name: VIA_KEYBOARD_NAME,
    productId: VIA_PRODUCT_ID,
    vendorId: VIA_VENDOR_ID,
    menus: [],
    keycodes: [],
    matrix: {
      rows: MATRIX_ROWS,
      cols: MATRIX_COLS,
    },
    customKeycodes: [],
    layouts: {
      keymap: buildViaLayoutRows(items),
    },
  };
}
