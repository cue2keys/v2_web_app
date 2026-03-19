import type { SchemaItem } from './schema';

export type ParamLikeValue = number | string;

export const isDummyTrackballParam = (item: SchemaItem) => item.key === '_dummy_tb';

export const getActiveSchema = (schema: SchemaItem[]) =>
  schema.filter((item) => !isDummyTrackballParam(item));

export const defaultParamValue = (item: SchemaItem): ParamLikeValue =>
  item.type === 'bool' ? (item.default ? 1 : 0) : (item.default as number | string);

export const schemaParamValue = (
  item: SchemaItem,
  params: Record<number, ParamLikeValue>,
): ParamLikeValue => params[item.id] ?? defaultParamValue(item);

export const isTrackballSchemaItem = (item: SchemaItem) => /^tb_.+_\d+$/.test(item.key);

export const isRotaryResolutionSchemaItem = (item: SchemaItem) =>
  /^re_resolution_\d+$/.test(item.key) || item.label.includes('ロータリーエンコーダー');
