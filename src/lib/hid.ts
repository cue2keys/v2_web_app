import { HIDCommandValueID, PktHeaderT, PktT, type KBC_ParamID } from '@/generated/pendant/v2';
import { PRODUCT_ID, REPORT_ID, USAGE_ID, USAGE_PAGE, VENDOR_ID } from '../types/devices';
import type { APICommand } from '../types/protocol';
import { VIA_CHANNEL_ID } from '../types/protocol';
import { convertPkttToUint8Array, readPkttFromUint8Array, verifyResponse } from './flatc';
import { createInputReportWaiter } from './hidWaiter';
import { logger } from './logger';
import { createSeq, hex } from './utils';

const inputDrainHandlers = new WeakMap<HIDDevice, (e: HIDInputReportEvent) => void>();

export function ensureInputDrain(dev: HIDDevice): void {
  if (inputDrainHandlers.has(dev)) return;
  const handler = (e: HIDInputReportEvent) => {
    // Keep RAW IN queue drained even when no request is pending.
    void e.data;
  };
  dev.addEventListener('inputreport', handler);
  inputDrainHandlers.set(dev, handler);
}

export function removeInputDrain(dev: HIDDevice): void {
  const handler = inputDrainHandlers.get(dev);
  if (!handler) return;
  try {
    dev.removeEventListener('inputreport', handler);
  } catch {}
  inputDrainHandlers.delete(dev);
}

export async function connect(): Promise<HIDDevice | undefined> {
  if (!navigator.hid) {
    throw new Error('WebHID API not supported in this browser');
  }

  const list = await navigator.hid.requestDevice({
    filters: [
      { vendorId: VENDOR_ID, productId: PRODUCT_ID, usagePage: USAGE_PAGE, usage: USAGE_ID },
    ],
  });
  if (!list.length) return;

  const dev: HIDDevice = list[0]!;
  await dev.open();
  ensureInputDrain(dev);

  return dev;
}

export async function send(
  dev: HIDDevice,
  apiCommand: APICommand,
  valueID: KBC_ParamID | HIDCommandValueID,
  payload: Uint8Array,
): Promise<PktT> {
  if (!dev) throw new Error('not connected');
  ensureInputDrain(dev);

  const pktt = new PktT(
    new PktHeaderT(apiCommand, VIA_CHANNEL_ID, createSeq(), valueID, payload.length),
    Array.from(payload),
  );

  const out = convertPkttToUint8Array(pktt);
  logger.debug(`OUT [${REPORT_ID}] ${hex(out, 32)}`);
  const waiter = createInputReportWaiter<PktT>(dev, (reportData, reportId) => {
    const receivedPkt = readPkttFromUint8Array(reportData);
    logger.debug(`IN  [${reportId}]`, receivedPkt);
    if (!verifyResponse(pktt, receivedPkt)) {
      logger.error('invalid response pkt', receivedPkt);
      return undefined;
    }
    return receivedPkt;
  });

  try {
    await dev.sendReport(REPORT_ID, out);
  } catch (e) {
    waiter.dispose();
    throw e;
  }

  return waiter.promise;
}
