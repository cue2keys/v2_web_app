import { RotateCw } from 'lucide-react';
import type { ChangeEvent, FC } from 'react';
import type { SchemaItem } from '../lib/schema';
import { useTrackballCalibration } from '@/hooks/useTrackballCalibration';
import { ParamCard } from './ParamCard';
import { TrackballVisualization } from './TrackballVisualization';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface Props {
  items: SchemaItem[];
  params: Record<number, number | string>;
  loaded: Record<number, boolean>;
  connected?: Record<number, boolean> | null;
  onChange: (p: SchemaItem, v: number | string) => void;
  onRead: (p: SchemaItem) => void | Promise<void>;
  onWrite: (p: SchemaItem) => void | Promise<void>;
  onWriteAngle: (p: SchemaItem, v: number) => void | Promise<void>;
}

export const TrackballCalibrator: FC<Props> = ({
  items,
  params,
  loaded,
  connected,
  onChange,
  onRead,
  onWrite,
  onWriteAngle,
}) => {
  const {
    grouped,
    activeIndex,
    setActiveIndex,
    angleItem,
    otherItems,
    deviceAngle,
    currentState,
    calcAngle,
    handleAngleChange,
    handleCirclePointer,
  } = useTrackballCalibration(items, params, connected);

  if (grouped.order.length === 0) return null;

  return (
    <section className="my-6">
      <Card>
        <CardTitle>トラックボール</CardTitle>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="トラックボール">
            {grouped.order.map((idx, orderIdx) => {
              const active = orderIdx === activeIndex;
              const disabled = connected != null && connected[idx] !== true;
              return (
                <Button
                  key={idx}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  disabled={disabled}
                  role="tab"
                  aria-selected={active}
                  aria-label={`トラックボール${idx}`}
                  onClick={() => setActiveIndex(orderIdx)}
                >
                  {idx}
                </Button>
              );
            })}
          </div>

          {angleItem && (
            <div className="rounded-lg border border-border p-4">
              <div className="mb-3 text-sm font-semibold">角度調整</div>
              <p className="text-base text-secondary-foreground">
                円の中心にカーソルを合わせてから、真上にしたい方向にボールを転がしてください。
                <br />
                円と接した付近でクリックをすると、設定する値が計算されます。
              </p>

              <div className="mt-4 grid gap-6 md:grid-cols-[minmax(260px,320px)_1fr]">
                <div className="flex items-center justify-center">
                  <TrackballVisualization
                    contactAngle={currentState.contact}
                    onPointerDown={handleCirclePointer}
                    onPointerMove={(e) => e.buttons === 1 && handleCirclePointer(e)}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 md:grid-cols-1">
                    <label className="flex flex-col gap-2 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-foreground">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          計測した角度ずれ
                        </div>
                        <Input
                          size={3}
                          aria-label="計測した角度ずれ"
                          type="number"
                          min={0}
                          max={359}
                          step={1}
                          value={currentState.contact}
                          onInput={(e: ChangeEvent<HTMLInputElement>) =>
                            handleAngleChange(Number(e.currentTarget.value || 0))
                          }
                        />
                        <span className="text-sm text-secondary-foreground">°</span>
                      </div>

                      <div className="text-xs text-secondary-foreground">
                        円をクリックしても入力できます。
                      </div>
                    </label>
                    <label className="flex flex-col gap-2 rounded-lg p-3">
                      {angleItem && (
                        <div>
                          現在の設定値: {loaded[angleItem.id] ? `${deviceAngle}°` : '未読み込み'}
                          <Button
                            variant="outline"
                            size="icon"
                            className="ml-4"
                            onClick={() => void onRead(angleItem)}
                            aria-label={`${angleItem.label} を読み取り`}
                          >
                            <RotateCw size={16} aria-hidden />
                          </Button>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <div className="text-xs">計算結果</div>
                        <div className="text-2xl font-semibold">{calcAngle}°</div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {angleItem && (
                          <Button
                            className="h-9 px-4"
                            disabled={!loaded[angleItem.id]}
                            onClick={async () => {
                              onChange(angleItem, calcAngle);
                              await onWriteAngle(angleItem, calcAngle);
                              handleAngleChange(0);
                            }}
                          >
                            Write
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {otherItems.length > 0 && (
            <div className="grid gap-4">
              <div className="kbd-grid">
                {otherItems.map((item) => {
                  const val = params[item.id] ?? item.default ?? 0;
                  return (
                    <ParamCard
                      key={item.id}
                      p={item}
                      val={typeof val === 'boolean' ? (val ? 1 : 0) : val}
                      loaded={!!loaded[item.id]}
                      onChange={onChange}
                      onRead={(pp) => void onRead(pp)}
                      onWrite={(pp) => void onWrite(pp)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
