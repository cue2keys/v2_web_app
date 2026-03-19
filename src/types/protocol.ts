export const VIA_CHANNEL_ID = 0x00; // always 0x00
export const EP_SIZE = 32; // 32 bytes fixed

// defined in VIA
export enum APICommand {
  CUSTOM_MENU_SET_VALUE = 0x07,
  CUSTOM_MENU_GET_VALUE = 0x08,
  CUSTOM_MENU_SAVE = 0x09,
}
