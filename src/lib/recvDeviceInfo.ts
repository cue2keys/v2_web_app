import type { DeviceItemT, HIDCommandValueID } from '@/generated/pendant/v2';
import { DeviceItem, PktHeaderT, PktT } from '@/generated/pendant/v2';
import { REPORT_ID } from '../types/devices';
import type { APICommand } from '../types/protocol';
import { VIA_CHANNEL_ID } from '../types/protocol';
import {
  convertPkttToUint8Array,
  readDeviceItemTFromUint8Array,
  readMultiPartPkttFromUint8Array,
  verifyResponse,
} from './flatc';
import { createInputReportWaiter } from './hidWaiter';
import { logger } from './logger';
import { createSeq, hex } from './utils';

export async function recvDeviceInfo(
  dev: HIDDevice,
  apiCommand: APICommand,
  valueID: HIDCommandValueID,
): Promise<DeviceItemT[]> {
  if (!dev) throw new Error('not connected');

  const pktt = new PktT(new PktHeaderT(apiCommand, VIA_CHANNEL_ID, createSeq(), valueID, 0), []);

  const out = convertPkttToUint8Array(pktt);
  logger.debug(`OUT [${REPORT_ID}] ${hex(out, 32)}`);

  const parts: (Uint8Array | null)[] = [];
  const waiter = createInputReportWaiter<Uint8Array>(dev, (reportData, reportId) => {
    const receivedPkt = readMultiPartPkttFromUint8Array(reportData);
    logger.debug(
      `IN  [${reportId}] ${hex(reportData, 32)} ${receivedPkt.headers?.dataLength} ${receivedPkt.additionalHeaders?.part}/${receivedPkt.additionalHeaders?.totalParts}`,
    );
    if (!verifyResponse(pktt, receivedPkt)) {
      logger.error('invalid response pkt', receivedPkt);
      return undefined;
    }
    logger.debug(`data: ${hex(new Uint8Array(receivedPkt.data), 32)}`);

    if (!parts.length) {
      for (let i = 0; i < receivedPkt.additionalHeaders!.totalParts + 1; i++) parts.push(null);
    }
    parts[receivedPkt.additionalHeaders!.part] = new Uint8Array(
      receivedPkt.data.slice(0, receivedPkt.headers?.dataLength),
    );
    if (parts.some((part) => part === null)) return undefined;

    const totalLen = parts.reduce((acc, cur) => acc + (cur ? cur.length : 0), 0);
    const buf = new Uint8Array(totalLen);
    let off = 0;
    for (const chunk of parts) {
      if (!chunk) continue;
      const rem = Math.min(chunk.length, totalLen - off);
      if (rem <= 0) break;
      buf.set(chunk.slice(0, rem), off);
      off += rem;
    }
    return buf;
  });

  try {
    await dev.sendReport(REPORT_ID, out);
  } catch (e) {
    waiter.dispose();
    throw e;
  }

  const receivedBuf = await waiter.promise;
  logger.debug(`RECV total ${receivedBuf.length} bytes`);
  logger.debug(receivedBuf);
  // received byte array is just sequential DeviceItemT data
  if (receivedBuf.length % DeviceItem.sizeOf() !== 0) {
    console.error(`invalid data length: ${receivedBuf.length}`);
    return [];
  }
  const devicesInfo: DeviceItemT[] = [];
  for (let i = 0; i < receivedBuf.length; i += DeviceItem.sizeOf()) {
    const chunk = receivedBuf.slice(i, i + DeviceItem.sizeOf());
    const deviceInfo = readDeviceItemTFromUint8Array(chunk);
    devicesInfo.push(deviceInfo);
  }
  logger.debug('devicesInfo', devicesInfo);

  return devicesInfo;
}
