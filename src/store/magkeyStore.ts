import { create } from 'zustand';

interface MagkeyState {
  magkeyActuation: number;
  magkeyRelease: number;
  magkeyRapid: boolean;
  magkeyReleaseBeforeRapid: number | null;
  magkeyConfigLoaded: boolean;
  magkeyConfigBusy: boolean;
  setMagkeyActuation: (magkeyActuation: number) => void;
  setMagkeyRelease: (magkeyRelease: number) => void;
  setMagkeyRapid: (magkeyRapid: boolean) => void;
  setMagkeyReleaseBeforeRapid: (magkeyReleaseBeforeRapid: number | null) => void;
  setMagkeyConfigLoaded: (magkeyConfigLoaded: boolean) => void;
  setMagkeyConfigBusy: (magkeyConfigBusy: boolean) => void;
  resetMagkeyState: () => void;
}

export const useMagkeyStore = create<MagkeyState>()((set) => ({
  magkeyActuation: 0,
  magkeyRelease: 0,
  magkeyRapid: false,
  magkeyReleaseBeforeRapid: null,
  magkeyConfigLoaded: false,
  magkeyConfigBusy: false,
  setMagkeyActuation: (magkeyActuation) => set({ magkeyActuation }),
  setMagkeyRelease: (magkeyRelease) => set({ magkeyRelease }),
  setMagkeyRapid: (magkeyRapid) => set({ magkeyRapid }),
  setMagkeyReleaseBeforeRapid: (magkeyReleaseBeforeRapid) => set({ magkeyReleaseBeforeRapid }),
  setMagkeyConfigLoaded: (magkeyConfigLoaded) => set({ magkeyConfigLoaded }),
  setMagkeyConfigBusy: (magkeyConfigBusy) => set({ magkeyConfigBusy }),
  resetMagkeyState: () =>
    set({
      magkeyActuation: 0,
      magkeyRelease: 0,
      magkeyRapid: false,
      magkeyReleaseBeforeRapid: null,
      magkeyConfigLoaded: false,
      magkeyConfigBusy: false,
    }),
}));
