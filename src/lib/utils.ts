import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SchemaItem } from './schema';
import type { PktT } from '@/generated/pendant/v2';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const MAGKEY_MAX = 0x0fff;
export const BYTE_MAX = 0xff;

export const clampByte = (v: number) => clamp(v | 0, 0, BYTE_MAX);
export const clampMagkey = (v: number) => clamp(v | 0, 0, MAGKEY_MAX);

export function formatErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const typeDefaultMax = (p: SchemaItem) =>
  p.type === 'uint8'
    ? 0xff
    : p.type === 'uint16'
      ? 0xffff
      : p.type === 'uint32'
        ? 0xffffffff
        : 0xffffffff;

export const hex = (u8: Uint8Array, n?: number) =>
  Array.from(u8)
    .slice(0, n ?? u8.length)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join(' ');

export function packValue(p: SchemaItem, val: number | string): Uint8Array {
  if (p.type === 'uint8' || p.type === 'enum' || p.type === 'bool')
    return new Uint8Array([(val as number) & 0xff]);
  if (p.type === 'uint16')
    return new Uint8Array([(val as number) & 0xff, ((val as number) >> 8) & 0xff]);
  if (p.type === 'uint32')
    return new Uint8Array([
      (val as number) & 0xff,
      ((val as number) >>> 8) & 0xff,
      ((val as number) >>> 16) & 0xff,
      ((val as number) >>> 24) & 0xff,
    ]);
  if (p.type === 'string') {
    const enc = new TextEncoder();
    const s = enc.encode(String(val));
    const bytes = s.slice(0, p.maxLen ?? 32);
    const out = new Uint8Array(bytes.length);
    out.set(bytes);
    return out;
  }
  return new Uint8Array([]);
}

export function unpackValue(p: SchemaItem, data: PktT): number | string {
  // Response layout (firmware): [protoVer, cmd, seq, len, ...data]
  const len = data.headers?.dataLength ?? 0;
  const start = 0; // data starts at index 0 in data.data
  const payload = new Uint8Array(data.data);
  if (len === 0) throw new Error('no data');
  if (p.type === 'uint8' || p.type === 'enum' || p.type === 'bool') return payload[start] ?? 0;
  if (p.type === 'uint16') return (payload[start]! | (payload[start + 1]! << 8)) >>> 0;
  if (p.type === 'uint32')
    return (
      (payload[start]! |
        (payload[start + 1]! << 8) |
        (payload[start + 2]! << 16) |
        (payload[start + 3]! << 24)) >>>
      0
    );
  if (p.type === 'string') return new TextDecoder().decode(payload.slice(start, start + len));
  return 0;
}

let nextSeq = 0;

export const createSeq = (): number => {
  const seq = nextSeq;
  nextSeq = (nextSeq + 1) & 0xff;
  return seq;
};
