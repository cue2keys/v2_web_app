import { GetTrackballConnectedResponse, HIDCommandValueID } from '@/generated/pendant/v2';
import { APICommand } from '../types/protocol';
import { send } from './hid';
import { readGetTrackballConnectedResponseTFromUint8Array } from './flatc';

export interface TrackballConnectedResult {
  connected: Record<number, boolean>;
  count: number;
}

export async function getTrackballConnected(
  dev: HIDDevice,
): Promise<TrackballConnectedResult | null> {
  const resp = await send(
    dev,
    APICommand.CUSTOM_MENU_GET_VALUE,
    HIDCommandValueID.get_trackball_connected,
    new Uint8Array(),
  );

  const len = resp.headers?.dataLength ?? 0;
  if (len < GetTrackballConnectedResponse.sizeOf()) return null;

  const parsed = readGetTrackballConnectedResponseTFromUint8Array(new Uint8Array(resp.data));
  const count = Math.min(parsed.count, parsed.flags.length);
  const connected: Record<number, boolean> = {};
  for (let i = 0; i < count; i += 1) {
    connected[i + 1] = parsed.flags[i] === 1;
  }

  return { connected, count };
}
