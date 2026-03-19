import { create } from 'zustand';
import type { SchemaItem } from '@/lib/schema';

export type ParamValue = number | string;

interface ParamState {
  schema: SchemaItem[];
  params: Record<number, ParamValue>;
  loaded: Record<number, boolean>;
  search: string;
  jsonText: string;
  setSchema: (schema: SchemaItem[]) => void;
  setParams: (params: Record<number, ParamValue>) => void;
  setParam: (id: number, value: ParamValue) => void;
  setLoaded: (loaded: Record<number, boolean>) => void;
  setLoadedFor: (id: number, value: boolean) => void;
  setSearch: (search: string) => void;
  setJsonText: (jsonText: string) => void;
}

export const useParamStore = create<ParamState>()((set) => ({
  schema: [],
  params: {},
  loaded: {},
  search: '',
  jsonText: '',
  setSchema: (schema) => set({ schema }),
  setParams: (params) => set({ params }),
  setParam: (id, value) =>
    set((state) => ({
      params: {
        ...state.params,
        [id]: value,
      },
    })),
  setLoaded: (loaded) => set({ loaded }),
  setLoadedFor: (id, value) =>
    set((state) => ({
      loaded: {
        ...state.loaded,
        [id]: value,
      },
    })),
  setSearch: (search) => set({ search }),
  setJsonText: (jsonText) => set({ jsonText }),
}));
