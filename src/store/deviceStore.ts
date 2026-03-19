import { create } from 'zustand';
import type { DeviceItemT } from '@/generated/pendant/v2';
import type { DeviceNicknames } from '@/lib/deviceNicknames';
import { logger } from '@/lib/logger';

const sharedDeviceRef: { current: HIDDevice | null } = { current: null };

export type FirmwareCheckState = 'idle' | 'checking' | 'ready' | 'error';

interface DeviceState {
  deviceRef: { current: HIDDevice | null };
  connected: boolean;
  demoMode: boolean;
  fwInfo: string;
  latestFirmwareVersion: string;
  latestReleaseUrl: string;
  updateAvailable: boolean;
  firmwareCheckState: FirmwareCheckState;
  deviceNicknames: DeviceNicknames;
  devList: DeviceItemT[];
  selectedDev: DeviceItemT | null;
  trackballConnected: Record<number, boolean> | null;
  trackballFlagCount: number;
  displayMode: number | null;
  ledMode: number | null;
  setConnected: (connected: boolean) => void;
  setDemoMode: (demoMode: boolean) => void;
  setFwInfo: (fwInfo: string) => void;
  setLatestFirmwareVersion: (latestFirmwareVersion: string) => void;
  setLatestReleaseUrl: (latestReleaseUrl: string) => void;
  setUpdateAvailable: (updateAvailable: boolean) => void;
  setFirmwareCheckState: (firmwareCheckState: FirmwareCheckState) => void;
  resetFirmwareReleaseInfo: () => void;
  setDeviceNicknames: (deviceNicknames: DeviceNicknames) => void;
  setDevList: (devList: DeviceItemT[]) => void;
  setSelectedDev: (selectedDev: DeviceItemT | null) => void;
  setTrackballConnected: (trackballConnected: Record<number, boolean> | null) => void;
  setTrackballFlagCount: (trackballFlagCount: number) => void;
  setDisplayMode: (displayMode: number | null) => void;
  setLedMode: (ledMode: number | null) => void;
  appendLog: (message: string) => void;
  resetDeviceState: () => void;
}

export const useDeviceStore = create<DeviceState>()((set) => ({
  deviceRef: sharedDeviceRef,
  connected: false,
  demoMode: false,
  fwInfo: '',
  latestFirmwareVersion: '',
  latestReleaseUrl: '',
  updateAvailable: false,
  firmwareCheckState: 'idle',
  deviceNicknames: {},
  devList: [],
  selectedDev: null,
  trackballConnected: null,
  trackballFlagCount: 0,
  displayMode: null,
  ledMode: null,
  setConnected: (connected) => set({ connected }),
  setDemoMode: (demoMode) => set({ demoMode }),
  setFwInfo: (fwInfo) => set({ fwInfo }),
  setLatestFirmwareVersion: (latestFirmwareVersion) => set({ latestFirmwareVersion }),
  setLatestReleaseUrl: (latestReleaseUrl) => set({ latestReleaseUrl }),
  setUpdateAvailable: (updateAvailable) => set({ updateAvailable }),
  setFirmwareCheckState: (firmwareCheckState) => set({ firmwareCheckState }),
  resetFirmwareReleaseInfo: () =>
    set({
      latestFirmwareVersion: '',
      latestReleaseUrl: '',
      updateAvailable: false,
      firmwareCheckState: 'idle',
    }),
  setDeviceNicknames: (deviceNicknames) => set({ deviceNicknames }),
  setDevList: (devList) => set({ devList }),
  setSelectedDev: (selectedDev) => set({ selectedDev }),
  setTrackballConnected: (trackballConnected) => set({ trackballConnected }),
  setTrackballFlagCount: (trackballFlagCount) => set({ trackballFlagCount }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setLedMode: (ledMode) => set({ ledMode }),
  appendLog: (message) => {
    const t = new Date().toLocaleTimeString();
    logger.log(`[${t}] ${message}`);
  },
  resetDeviceState: () =>
    set({
      connected: false,
      demoMode: false,
      fwInfo: '',
      latestFirmwareVersion: '',
      latestReleaseUrl: '',
      updateAvailable: false,
      firmwareCheckState: 'idle',
      devList: [],
      selectedDev: null,
      trackballConnected: null,
      trackballFlagCount: 0,
      displayMode: null,
      ledMode: null,
    }),
}));
