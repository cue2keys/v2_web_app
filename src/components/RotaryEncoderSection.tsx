import { RotateCw } from 'lucide-react';
import type { FC } from 'react';
import type { SchemaItem } from '../lib/schema';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';
import { Select, SelectItem } from './ui/select';

interface Props {
  items: SchemaItem[]; // sorted
  params: Record<number, number | string>;
  loaded: Record<number, boolean>;
  onChange: (p: SchemaItem, v: number) => void;
  onRead: (p: SchemaItem) => void;
  onWrite: (p: SchemaItem) => void;
}

export const RotaryEncoderSection: FC<Props> = ({
  items,
  params,
  loaded,
  onChange,
  onRead,
  onWrite,
}) => {
  if (!items.length) return null;
  return (
    <section className="my-6">
      <Card>
        <CardTitle>ロータリーエンコーダー解像度 (反映には再起動が必要)</CardTitle>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p>反応する（だいたいの）クリック数を表しています。</p>
            {items.map((p) => {
              const value = Number(params[p.id] ?? p.default ?? 0);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 ${!loaded[p.id] ? 'opacity-50' : ''}`}
                >
                  <div className="min-w-44 text-sm text-secondary-foreground">{p.label}</div>
                  <div className="flex items-center gap-2">
                    <Select
                      ariaLabel={p.label}
                      value={String(value)}
                      disabled={!loaded[p.id]}
                      onValueChange={(v) =>
                        onChange(p, Math.max(0, Math.min(3, parseInt(v, 10) || 0)))
                      }
                    >
                      {[0, 1, 2, 3].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {String(n + 1)}
                        </SelectItem>
                      ))}
                    </Select>
                    <Button
                      className="ml-auto h-8 w-8 p-0"
                      variant="ghost"
                      aria-label={`${p.label} を読み取り`}
                      onClick={() => onRead(p)}
                    >
                      <RotateCw size={16} aria-hidden />
                    </Button>
                    <Button
                      aria-label={`${p.label} に書き込み`}
                      onClick={() => onWrite(p)}
                      disabled={!loaded[p.id]}
                    >
                      書き込み
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
