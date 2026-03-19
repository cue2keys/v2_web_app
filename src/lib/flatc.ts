import type {
  DeviceItemT,
  GetKeypressResponseT,
  GetTrackballConnectedResponseT,
  MultiPartPktT,
  PktT,
  SetI2CAddrCmdResponseT,
} from '@/generated/pendant/v2';
import {
  DeviceItem,
  GetKeypressResponse,
  GetTrackballConnectedResponse,
  MultiPartPkt,
  Pkt,
  SetI2CAddrCmdResponse,
} from '@/generated/pendant/v2';
import * as flatbuffers from 'flatbuffers';
import { EP_SIZE } from '../types/protocol';

// flatbuffer data have 4 byte root offset, so we need to slice it properly
export const convertPkttToUint8Array = (
  flatObj: flatbuffers.IGeneratedObject,
): Uint8Array<ArrayBuffer> => {
  const pktData = new flatbuffers.Builder(EP_SIZE);
  flatObj.pack(pktData);
  const buf = pktData.dataBuffer();
  const out = buf.bytes().subarray(buf.capacity() - pktData.offset());
  return new Uint8Array(out);
};

export function readPkttFromUint8Array(u8: Uint8Array): PktT {
  const buf = new flatbuffers.ByteBuffer(u8);
  // packet is just raw buffers, so ignore root offset
  const rawpkt = new Pkt().__init(0, buf);
  return rawpkt.unpack();
}

export function readMultiPartPkttFromUint8Array(u8: Uint8Array): MultiPartPktT {
  const buf = new flatbuffers.ByteBuffer(u8);
  const rawpkt = new MultiPartPkt().__init(0, buf);
  return rawpkt.unpack();
}

export function readDeviceItemTFromUint8Array(u8: Uint8Array): DeviceItemT {
  const buf = new flatbuffers.ByteBuffer(u8);
  const rawpkt = new DeviceItem().__init(0, buf);
  return rawpkt.unpack();
}

export function readSetI2CAddrCmdResponseTFromUint8Array(u8: Uint8Array): SetI2CAddrCmdResponseT {
  const buf = new flatbuffers.ByteBuffer(u8);
  const rawpkt = new SetI2CAddrCmdResponse().__init(0, buf);
  return rawpkt.unpack();
}

export function readGetKeypressResponseTFromUint8Array(u8: Uint8Array): GetKeypressResponseT {
  const buf = new flatbuffers.ByteBuffer(u8);
  const rawpkt = new GetKeypressResponse().__init(0, buf);
  return rawpkt.unpack();
}

export function readGetTrackballConnectedResponseTFromUint8Array(
  u8: Uint8Array,
): GetTrackballConnectedResponseT {
  const buf = new flatbuffers.ByteBuffer(u8);
  const rawpkt = new GetTrackballConnectedResponse().__init(0, buf);
  return rawpkt.unpack();
}

export const verifyResponse = (
  sent: PktT | MultiPartPktT,
  received: PktT | MultiPartPktT,
): boolean => {
  return (
    received.headers?.commandId === sent.headers?.commandId &&
    received.headers?.channelId === sent.headers?.channelId &&
    received.headers?.seq === sent.headers?.seq &&
    received.headers?.valueId === sent.headers?.valueId
  );
};
