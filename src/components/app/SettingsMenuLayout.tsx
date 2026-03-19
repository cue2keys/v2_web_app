import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { FC, ReactNode } from 'react';

export type SettingsCategoryId = 'devices' | 'general' | 'trackball' | 'display' | 'led' | 'other';

export interface SettingsCategory {
  id: SettingsCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface Props {
  categories: SettingsCategory[];
  activeCategoryId: SettingsCategoryId;
  onSelectCategory: (id: SettingsCategoryId) => void;
  children: ReactNode;
}

interface CatStyle {
  bg: string;
  activeBg: string;
  text: string;
  border: string;
  glow: string;
}

const CAT_STYLES: Record<SettingsCategoryId, CatStyle> = {
  devices: {
    bg: '#FFF0F5',
    activeBg: '#FFB3CC',
    text: '#700030',
    border: '#FFB3CC',
    glow: 'rgba(255,100,160,0.28)',
  },
  general: {
    bg: '#FFF5EE',
    activeBg: '#FFC89A',
    text: '#C05020',
    border: '#FFC89A',
    glow: 'rgba(255,140,60,0.28)',
  },
  trackball: {
    bg: '#FFFCEE',
    activeBg: '#FFE566',
    text: '#887800',
    border: '#FFE566',
    glow: 'rgba(220,200,0,0.28)',
  },
  display: {
    bg: '#EDFFFE',
    activeBg: '#7AE8E0',
    text: '#005858',
    border: '#7AE8E0',
    glow: 'rgba(0,180,180,0.28)',
  },
  led: {
    bg: '#F3EEFF',
    activeBg: '#BF96FF',
    text: '#5818CC',
    border: '#BF96FF',
    glow: 'rgba(160,90,255,0.28)',
  },
  other: {
    bg: '#EEF8FF',
    activeBg: '#7ECEFF',
    text: '#0858CC',
    border: '#7ECEFF',
    glow: 'rgba(40,150,255,0.28)',
  },
};

export const SettingsMenuLayout: FC<Props> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  children,
}) => {
  return (
    <section>
      {/* Horizontal category tab bar */}
      <div className="sticky top-[61px] z-20 border-b border-border/40 bg-background/95 px-4 pb-2 pt-3 backdrop-blur-sm">
        <div
          className="scrollbar-none flex gap-2 overflow-x-auto pb-0.5"
          role="tablist"
          aria-label="設定カテゴリー"
        >
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId;
            const s = CAT_STYLES[category.id];
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectCategory(category.id)}
                style={{
                  backgroundColor: isActive ? s.activeBg : s.bg,
                  borderColor: s.border,
                  color: s.text,
                  ...(isActive && { boxShadow: `0 3px 12px ${s.glow}` }),
                }}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm transition-all duration-200',
                  isActive ? 'font-bold' : 'font-medium hover:opacity-75 active:scale-95',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span>{category.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="px-4 py-5">{children}</div>
    </section>
  );
};
