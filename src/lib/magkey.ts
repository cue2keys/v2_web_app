import type { DeviceItemT } from '@/generated/pendant/v2';
import { ModuleType } from '@/generated/pendant/v2/module-type';

export const MATRIX_COLS = 32;
export const MATRIX_ROWS = 10;

export const isMatrixIndexValid = (row: number, col: number) =>
  row >= 0 && row < MATRIX_ROWS && col >= 0 && col < MATRIX_COLS;

export const getMagkeyKeyPositions = (device: DeviceItemT) => {
  if (device.type !== ModuleType.V2_MagKeys4) return [];
  const shift = device.shift ?? 0;
  return Array.from({ length: 4 }, (_, idx) => {
    const keyIndex = shift + idx;
    const row = Math.floor(keyIndex / MATRIX_COLS);
    const col = keyIndex % MATRIX_COLS;
    return {
      index: keyIndex,
      row,
      col,
      valid: isMatrixIndexValid(row, col),
    };
  });
};

export function findMagkeyDevice(
  devices: DeviceItemT[],
  row: number,
  col: number,
): DeviceItemT | null {
  if (!isMatrixIndexValid(row, col)) return null;
  const keyIndex = row * MATRIX_COLS + col;
  for (const device of devices) {
    if (device.type !== ModuleType.V2_MagKeys4) continue;
    const shift = device.shift ?? 0;
    if (keyIndex >= shift && keyIndex < shift + 4) return device;
  }
  return null;
}
