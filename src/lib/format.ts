import { ModuleType } from '@/generated/pendant/v2/module-type';

export const toHex = (n: number) => '0x' + (n & 0xff).toString(16).toUpperCase().padStart(2, '0');

const DEVICE_TYPE_LABELS: Record<number, string> = {
  [ModuleType.UNKNOWN]: '不明',
  [ModuleType.V1_PCA9557_Keys4]: '4キー（プロトタイプ）',
  [ModuleType.V1_PCA9557_Keys5]: '5キー（プロトタイプ）',
  [ModuleType.V1_XL9555_Keys4]: '4キー（初代）',
  [ModuleType.V1_XL9555_Keys5]: '5キー（初代）',
  [ModuleType.V1_PCA9534A_RE]: 'ロータリーエンコーダー (初代)',
  [ModuleType.V2_Keys4]: '4キー（v2）',
  [ModuleType.V2_MagKeys4]: 'マグネ4キー（v2）',
  [ModuleType.V2_RE]: 'ロータリーエンコーダー（v2）',
  [ModuleType.I2C_MUX]: 'I2C MUX',
  [ModuleType.DISPLAY]: 'ディスプレイ',
};

export const deviceTypeName = (t: number) => DEVICE_TYPE_LABELS[t] ?? `Type ${t}`;

export const formatUid = (uid: bigint) => {
  const bytes: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    const byte = Number((uid >> BigInt(8 * i)) & BigInt(0xff));
    bytes.push(byte.toString(16).toUpperCase().padStart(2, '0'));
  }
  return bytes.join('-');
};
