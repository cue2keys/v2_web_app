import type { FC } from 'react';

interface Props {
  actuation: number;
  releasePoint: number;
  baselineValue: number | null;
  rapid: boolean;
  releaseLabel: string;
  loaded?: boolean;
}

export const MagkeyGraph: FC<Props> = ({
  actuation,
  releasePoint,
  baselineValue,
  rapid,
  releaseLabel,
  loaded = false,
}) => {
  const rangeMin = baselineValue ?? 0;
  const rangeMax = 0x0fff;
  const rangeSpan = Math.max(1, rangeMax - rangeMin);
  const toPct = (value: number) =>
    Math.min(100, Math.max(0, Math.round(((value - rangeMin) / rangeSpan) * 100)));
  const magkeyActuationPct = toPct(actuation);
  const magkeyReleasePct = toPct(releasePoint);
  const baselinePct = baselineValue === null ? null : 0;

  return (
    <div
      className={`rounded-md border border-border/60 bg-secondary/30 p-3 ${
        loaded ? '' : 'opacity-60'
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] text-secondary-foreground">
        <span>{baselineValue ?? 0}</span>
        <span>4095</span>
      </div>
      <div className="relative h-3 rounded-full bg-secondary">
        <div
          className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-primary"
          style={{ left: `${magkeyActuationPct}%` }}
        />
        <div
          className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-orange-500"
          style={{ left: `${magkeyReleasePct}%` }}
        />
        {baselinePct !== null && (
          <div
            className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-sky-500"
            style={{ left: `${baselinePct}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Actuation: {actuation}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          {rapid ? 'RT発動' : releaseLabel}: {releasePoint}
        </span>
        {baselineValue !== null && (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            基準位置: {baselineValue}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <span
            className={`h-2 w-2 rounded-full ${
              rapid ? 'bg-emerald-500' : 'bg-secondary-foreground'
            }`}
          />
          Rapid: {rapid ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
};
