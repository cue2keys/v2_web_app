export type ParamType = 'uint8' | 'uint16' | 'uint32' | 'bool' | 'enum' | 'string';

export interface EnumOption {
  value: number;
  label: string;
}

export interface SchemaItem {
  id: number;
  key: string;
  label: string;
  type: ParamType;
  min?: number;
  max?: number;
  step?: number;
  ui?: 'range' | 'number';
  options?: EnumOption[];
  default: number | string | boolean;
  maxLen?: number;
}

export interface KbConfigItem {
  name: string;
  shortname?: string;
  bit: number;
  default: number;
  max: number;
  keycode?: string;
  mod_step_ary?: number[];
  description?: string;
  description_ja?: string;
}

export function mapKbConfigToSchema(cfg: KbConfigItem[]): SchemaItem[] {
  return cfg.map((c, idx): SchemaItem => {
    const max = c.max ?? 0;
    const label = c.description_ja ?? c.description ?? c.name;
    const key = c.name;
    const isBool = c.bit === 1 && max === 1;
    const type: ParamType = isBool
      ? 'bool'
      : max <= 0xff
        ? 'uint8'
        : max <= 0xffff
          ? 'uint16'
          : 'uint32';
    const ui: SchemaItem['ui'] = isBool ? undefined : max >= 20 ? 'range' : 'number';
    const options: EnumOption[] | undefined = (() => {
      if (c.name === 'trackball_led_off_timeout') {
        return [
          { value: 0, label: 'なし / Never' },
          { value: 1, label: '5分' },
          { value: 2, label: '10分' },
          { value: 3, label: '15分' },
        ];
      }
      const cpiMatch = /^tb_cpi_step_(\d+)$/.exec(c.name);
      if (cpiMatch) {
        const upper = max > 0 ? max : 15;
        return Array.from({ length: upper + 1 }, (_, i) => ({
          value: i,
          label: `${(i + 1) * 200} CPI`,
        }));
      }
      if (c.name === 'tapping_term_50ms') {
        const upper = max > 0 ? max : 15;
        return Array.from({ length: upper + 1 }, (_, i) => ({
          value: i,
          label: `${50 + i * 25} ms`,
        }));
      }
      if (c.name === 'display_mode') {
        return [
          { value: 0, label: 'Info' },
          { value: 1, label: 'U1 Walking' },
        ];
      }
      if (c.name === 'led_base_mode') {
        return [
          { value: 0, label: 'Off' },
          { value: 1, label: 'Layer' },
          { value: 2, label: 'Random On Type' },
          { value: 3, label: 'Scanning' },
        ];
      }
      if (c.name === 'magkey_data_bytes') {
        return [
          { value: 0, label: '12bit (6 bytes)' },
          { value: 1, label: '8bit (4 bytes)' },
          { value: 2, label: '4bit (2 bytes)' },
          { value: 3, label: '2bit (1 byte)' },
        ];
      }
      return undefined;
    })();
    const resolvedLabel = c.name.startsWith('tb_cpi_step_')
      ? 'CPI (初代の場合は近似値)'
      : c.name === 'tapping_term_50ms'
        ? 'タップ判定時間'
        : label;
    return {
      id: idx + 1,
      key,
      label: resolvedLabel,
      type: options ? 'enum' : type,
      min: 0,
      max,
      step: 1,
      ui,
      options,
      default: options ? Math.min(Math.max(0, c.default), options.length - 1) : c.default,
    };
  });
}
