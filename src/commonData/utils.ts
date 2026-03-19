import { Consts as ModuleV2Consts } from '../generated/module/v2/consts';
import { toHex } from '../lib/format';

// 0x18 is the beginning of PCA9557
const PCA9557_FROM_ADDR = 0x18;
const PCA9557_END_ADDR = PCA9557_FROM_ADDR + 8;

// 0x20 is the beginning of XL9555/TCA9535
const XL9555_FROM_ADDR = 0x20;
const XL9555_END_ADDR = XL9555_FROM_ADDR + 8;

// 0x38 is the beginning of PCA9534A
// NOTICE: OLED resides on 0x3C, thus MAX_RE_PER_CH_NUM is 4 to skip this address.
// Additionally, on the hardware side, the A2 pin needs to be low.
const PCA9534A_FROM_ADDR = 0x38;
const PCA9534A_END_ADDR = PCA9534A_FROM_ADDR + 4;

const I2C_MULTIPX_ADDR = 0x70;
const I2C_MULTIPX_ADDR_IGNORE_START = 0x71;
const I2C_MULTIPX_ADDR_IGNORE_END = 0x80;
const I2C_OLED_DISPLAY_ADDR = 0x3c;
const V2_RESERVED_ADDR_LABEL = '-';

const MIN_DYNAMIC_ADDRESS = Number(ModuleV2Consts.MIN_DYNAMIC_ADDRESS);
const MAX_DYNAMIC_ADDRESS = Number(ModuleV2Consts.MAX_DYNAMIC_ADDRESS);

export const is_v2_fixed_addr = (address: number) =>
  (PCA9557_FROM_ADDR <= address && address < PCA9557_END_ADDR) ||
  (XL9555_FROM_ADDR <= address && address < XL9555_END_ADDR) ||
  (PCA9534A_FROM_ADDR <= address && address < PCA9534A_END_ADDR);

export const is_v2_valid_addr = (address: number) => {
  let valid = MIN_DYNAMIC_ADDRESS <= address && address <= MAX_DYNAMIC_ADDRESS;
  valid = valid && !is_v2_fixed_addr(address);
  valid =
    valid && !(I2C_MULTIPX_ADDR_IGNORE_START <= address && address < I2C_MULTIPX_ADDR_IGNORE_END);
  valid = valid && address !== I2C_MULTIPX_ADDR;
  valid = valid && address !== I2C_OLED_DISPLAY_ADDR;
  return valid;
};

export const is_v2_reserved_addr = (address: number) =>
  address === I2C_MULTIPX_ADDR || address === I2C_OLED_DISPLAY_ADDR;

const V2_VALID_ADDRS = (() => {
  const list: number[] = [];
  for (let addr = MIN_DYNAMIC_ADDRESS; addr <= MAX_DYNAMIC_ADDRESS; addr += 1) {
    if (is_v2_valid_addr(addr)) {
      list.push(addr);
    }
  }
  return list;
})();

export const v2_display_addr_max = V2_VALID_ADDRS.length;

export const v2_display_addr_from_actual = (address: number) => {
  const idx = V2_VALID_ADDRS.indexOf(address);
  return idx >= 0 ? idx + 1 : null;
};

export const v2_actual_addr_from_display = (displayAddr: number) => {
  if (displayAddr < 1 || displayAddr > V2_VALID_ADDRS.length) return null;
  return V2_VALID_ADDRS[displayAddr - 1] ?? null;
};

export const v2_display_addr_label = (address: number) => {
  if (is_v2_reserved_addr(address)) return V2_RESERVED_ADDR_LABEL;
  if (is_v2_fixed_addr(address)) return `HW (${toHex(address)})`;
  const display = v2_display_addr_from_actual(address);
  if (display === 0) return '0 (未設定)';
  if (display == null) return String(address);
  return String(display);
};
