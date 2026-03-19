import { GetKeypressCmdT, GetKeypressResponse, HIDCommandValueID } from '@/generated/pendant/v2';
import { APICommand } from '../types/protocol';
import { send } from './hid';
import { convertPkttToUint8Array, readGetKeypressResponseTFromUint8Array } from './flatc';

export interface KeypressResult {
  value: number;
  isMagkey: boolean;
}

export async function getKeypress(
  dev: HIDDevice,
  row: number,
  col: number,
): Promise<KeypressResult | null> {
  const payload = convertPkttToUint8Array(new GetKeypressCmdT(row & 0xff, col & 0xff));
  const resp = await send(
    dev,
    APICommand.CUSTOM_MENU_GET_VALUE,
    HIDCommandValueID.get_keypress,
    payload,
  );

  const len = resp.headers?.dataLength ?? 0;
  if (len < GetKeypressResponse.sizeOf()) return null;

  const parsed = readGetKeypressResponseTFromUint8Array(new Uint8Array(resp.data));
  return { value: parsed.value, isMagkey: parsed.isMagkey };
}
