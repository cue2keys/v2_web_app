import type { DeviceItemT } from '@/generated/pendant/v2';

export interface MagkeyConfig {
  actuation: number;
  release: number;
  rapid: boolean;
}

export interface KeyConfigState extends MagkeyConfig {
  row: number;
  col: number;
  valid: boolean;
  loaded: boolean;
  busy: boolean;
  baseline: number | null;
  releaseBeforeRapid: number | null;
}

export interface MagkeyPreset extends MagkeyConfig {
  name: string;
}

export interface UseMagkeyModuleArgs {
  device: DeviceItemT | null;
  onReadConfig: (row: number, col: number) => Promise<MagkeyConfig>;
  onReadKeypress: (row: number, col: number) => Promise<number | null>;
  onWriteConfig: (
    row: number,
    col: number,
    actuation: number,
    release: number,
    rapid: boolean,
  ) => Promise<MagkeyConfig>;
}
