import type { ChangeEvent, FC } from 'react';
import type { SchemaItem } from '../lib/schema';
import { clamp, typeDefaultMax } from '../lib/utils';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectItem } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RotateCw } from 'lucide-react';
import { Slider } from './ui/slider';

interface Props {
  p: SchemaItem;
  val: number | string;
  onChange: (p: SchemaItem, v: number | string) => void;
  onRead: (p: SchemaItem) => void;
  onWrite: (p: SchemaItem) => void;
  loaded?: boolean;
}

export const ParamCard: FC<Props> = ({ p, val, onChange, onRead, onWrite, loaded = false }) => {
  const rawVal = Number(val ?? p.default ?? 0);
  const helperText = (() => {
    const n = rawVal;
    switch (p.key) {
      case 'angle_L':
      case 'angle_R':
        return `${n}°`;
      case 'pointer_speed_magnification':
      case 'drag_scroll_speed_magnification':
        return `${(n * 0.25).toFixed(2)}x`;
      case 'mouse_layer_off_delay_ms':
        return `${n * 100} ms`;
      default:
        return '';
    }
  })();

  const onNum = (e: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(e.currentTarget.value, 10);
    const n = Number.isNaN(parsed) ? 0 : parsed;
    const v = clamp(n, p.min ?? 0, p.max ?? typeDefaultMax(p));
    onChange(p, v);
  };

  return (
    <Card>
      <CardTitle>
        {p.label}
        {!loaded && (
          <span className="kbd-pill kbd-muted ml-2" title="まだ読み込まれていません">
            未読み込み
          </span>
        )}
      </CardTitle>
      <CardContent>
        <div className={`flex flex-col gap-2 ${!loaded ? 'opacity-50' : ''}`}>
          <div className="flex w-full items-center gap-3">
            {p.type === 'enum' && (
              <Select
                value={String(val ?? p.default)}
                onValueChange={(v) => onChange(p, parseInt(v, 10))}
                ariaLabel={p.label}
                disabled={!loaded}
              >
                {(p.options ?? []).map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
            )}
            {p.type === 'bool' && (
              <>
                <Checkbox
                  ariaLabel={p.label}
                  checked={!!val}
                  onCheckedChange={(v) => onChange(p, v ? 1 : 0)}
                  disabled={!loaded}
                />
                <span className="kbd-muted">{val ? 'On' : 'Off'}</span>
              </>
            )}
            {p.ui === 'range' && (
              <Slider
                min={p.min ?? 0}
                max={p.max ?? typeDefaultMax(p)}
                step={p.step ?? 1}
                value={Number(val ?? p.default ?? 0)}
                onValueChange={(v) => onChange(p, v)}
                ariaLabel={p.label}
                className="flex-1"
                disabled={!loaded}
              />
            )}
            {p.ui === 'number' && p.type !== 'enum' && p.type !== 'bool' && (
              <Input
                aria-label={p.label}
                type="number"
                min={p.min ?? 0}
                max={p.max ?? typeDefaultMax(p)}
                step={p.step ?? 1}
                value={Number(val ?? p.default ?? 0)}
                onInput={onNum}
                disabled={!loaded}
              />
            )}

            <Button
              size="icon"
              className="ml-auto"
              onClick={() => onRead(p)}
              aria-label={`${p.label} を読み取り`}
            >
              <RotateCw size={16} aria-hidden />
            </Button>
            <Button
              onClick={() => onWrite(p)}
              aria-label={`${p.label} に書き込み`}
              disabled={!loaded}
            >
              Write
            </Button>
          </div>

          {helperText && (
            <div className="mt-1 flex w-full gap-3 text-sm text-secondary-foreground">
              <span>反映値: {helperText}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
