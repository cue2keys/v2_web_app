import { isRotaryResolutionSchemaItem, isTrackballSchemaItem } from '@/lib/paramSchema';
import type { SchemaItem } from '@/lib/schema';

interface BuildParamSectionItemsArgs {
  activeSchema: SchemaItem[];
  search: string;
  includeKeys?: string[];
  excludeKeys?: string[];
}

export function buildParamSectionItems({
  activeSchema,
  search,
  includeKeys,
  excludeKeys,
}: BuildParamSectionItemsArgs) {
  const query = search.trim().toLowerCase();
  const filtered = activeSchema.filter((p) => {
    if (!query) return true;
    return p.label.toLowerCase().includes(query) || p.key?.toLowerCase().includes(query);
  });

  const includeSet = includeKeys ? new Set(includeKeys) : null;
  const excludeSet = excludeKeys ? new Set(excludeKeys) : null;
  const filteredByKey = filtered.filter((p) => {
    if (includeSet?.has(p.key) === false) return false;
    if (excludeSet?.has(p.key)) return false;
    return true;
  });

  const trackballIds = new Set(activeSchema.filter(isTrackballSchemaItem).map((p) => p.id));
  const rotaryItems = filteredByKey.filter(isRotaryResolutionSchemaItem);
  const rotaryIds = new Set(rotaryItems.map((p) => p.id));

  return {
    otherParams: filteredByKey.filter((p) => !rotaryIds.has(p.id) && !trackballIds.has(p.id)),
    sortedReItems: rotaryItems.slice().sort((a, b) => {
      const left = parseInt(a.key.replace(/\D+/g, '') || '0', 10);
      const right = parseInt(b.key.replace(/\D+/g, '') || '0', 10);
      return left - right;
    }),
  };
}
