interface HIDDevice {
  productName?: string;
  vendorId?: number;
  productId?: number;
  opened?: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  addEventListener(type: 'inputreport', listener: (e: HIDInputReportEvent) => void): void;
  removeEventListener(type: 'inputreport', listener: (e: HIDInputReportEvent) => void): void;
}

interface HIDInputReportEvent extends Event {
  data: DataView;
  reportId: number;
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice;
}

interface HID {
  requestDevice(options: {
    filters: { vendorId?: number; productId?: number; usagePage?: number; usage?: number }[];
  }): Promise<HIDDevice[]>;
  addEventListener(type: 'connect' | 'disconnect', listener: (e: HIDConnectionEvent) => void): void;
  removeEventListener(
    type: 'connect' | 'disconnect',
    listener: (e: HIDConnectionEvent) => void,
  ): void;
}

interface Navigator {
  hid?: HID;
}
