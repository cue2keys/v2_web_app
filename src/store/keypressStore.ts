import { create } from 'zustand';

interface KeypressState {
  keypressRow: number;
  keypressCol: number;
  keypressValue: number | null;
  keypressIsMagkey: boolean | null;
  keypressBusy: boolean;
  setKeypressRow: (keypressRow: number) => void;
  setKeypressCol: (keypressCol: number) => void;
  setKeypressValue: (keypressValue: number | null) => void;
  setKeypressIsMagkey: (keypressIsMagkey: boolean | null) => void;
  setKeypressBusy: (keypressBusy: boolean) => void;
  resetKeypressState: () => void;
}

export const useKeypressStore = create<KeypressState>()((set) => ({
  keypressRow: 0,
  keypressCol: 0,
  keypressValue: null,
  keypressIsMagkey: null,
  keypressBusy: false,
  setKeypressRow: (keypressRow) => set({ keypressRow }),
  setKeypressCol: (keypressCol) => set({ keypressCol }),
  setKeypressValue: (keypressValue) => set({ keypressValue }),
  setKeypressIsMagkey: (keypressIsMagkey) => set({ keypressIsMagkey }),
  setKeypressBusy: (keypressBusy) => set({ keypressBusy }),
  resetKeypressState: () =>
    set({
      keypressValue: null,
      keypressIsMagkey: null,
      keypressBusy: false,
    }),
}));
