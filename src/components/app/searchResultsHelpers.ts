import type { SchemaItem } from '@/lib/schema';

const DISPLAY_KEYWORDS = ['display', 'ディスプレイ', '表示', '表示モード', 'keypress', 'キー表示'];

const LED_KEYWORDS = ['led', 'LED', 'ベースモード', 'ベース', 'ペンダントLED', 'led base'];

export type SearchResultItem =
  | {
      id: string;
      kind: 'param';
      param: SchemaItem;
    }
  | {
      id: string;
      kind: 'display-panel' | 'led-panel';
    };

export interface SearchResultGroup {
  id: string;
  label: string;
  items: SearchResultItem[];
}

function matchesSearchKeywords(query: string, keywords: string[]) {
  if (!query) return false;
  return keywords.some((keyword) => {
    const normalized = keyword.toLowerCase();
    return normalized.includes(query) || query.includes(normalized);
  });
}

function ensureGroup(
  groups: Map<string, SearchResultGroup>,
  order: string[],
  id: string,
  label: string,
) {
  if (!groups.has(id)) {
    groups.set(id, { id, label, items: [] });
    order.push(id);
  }
  return groups.get(id)!;
}

function getParamGroup(groups: Map<string, SearchResultGroup>, order: string[], param: SchemaItem) {
  const trackballMatch = /^tb_.+_(\d+)$/.exec(param.key);
  if (trackballMatch) {
    return ensureGroup(
      groups,
      order,
      `tb_${trackballMatch[1]}`,
      `トラックボール ${trackballMatch[1]}`,
    );
  }

  const rotaryMatch = /^re_resolution_(\d+)$/.exec(param.key);
  if (rotaryMatch) {
    return ensureGroup(
      groups,
      order,
      `re_${rotaryMatch[1]}`,
      `ロータリーエンコーダー ${rotaryMatch[1]}`,
    );
  }

  return ensureGroup(groups, order, 'other', 'その他');
}

export function buildSearchResultGroups(
  activeSchema: SchemaItem[],
  search: string,
): SearchResultGroup[] {
  const query = search.trim().toLowerCase();
  if (!query) return [];

  const groups = new Map<string, SearchResultGroup>();
  const order: string[] = [];
  const paramResults = activeSchema.filter((param) => {
    if (param.key === 'display_mode' || param.key === 'led_base_mode') return false;
    return param.label.toLowerCase().includes(query) || param.key.toLowerCase().includes(query);
  });

  for (const param of paramResults) {
    getParamGroup(groups, order, param).items.push({
      id: `param_${param.id}`,
      kind: 'param',
      param,
    });
  }

  if (matchesSearchKeywords(query, DISPLAY_KEYWORDS)) {
    ensureGroup(groups, order, 'display', 'ディスプレイ').items.push({
      id: 'display-panel',
      kind: 'display-panel',
    });
  }

  if (matchesSearchKeywords(query, LED_KEYWORDS)) {
    ensureGroup(groups, order, 'led', 'LED').items.push({
      id: 'led-panel',
      kind: 'led-panel',
    });
  }

  return order.map((id) => groups.get(id)!);
}

export function countSearchResults(groups: SearchResultGroup[]) {
  return groups.reduce((count, group) => count + group.items.length, 0);
}
