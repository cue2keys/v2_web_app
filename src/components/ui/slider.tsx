import * as SliderPrimitive from '@radix-ui/react-slider';

interface Props {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onValueChange: (v: number) => void;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  markers?: { value: number; className?: string }[];
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  className = '',
  ariaLabel,
  disabled,
  markers,
}: Props) {
  const range = max - min;
  const markerNodes =
    markers?.map((marker, idx) => {
      const pct =
        range === 0 ? 0 : Math.max(0, Math.min(100, ((marker.value - min) / range) * 100));
      return (
        <span
          key={`marker-${idx}`}
          className={`pointer-events-none absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 ${
            marker.className ?? 'bg-secondary-foreground/70'
          }`}
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        />
      );
    }) ?? null;
  return (
    <SliderPrimitive.Root
      className={`relative flex w-full touch-none select-none items-center ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
      min={min}
      max={max}
      step={step}
      value={[value]}
      aria-label={ariaLabel}
      disabled={disabled}
      onValueChange={(vals: number[]) =>
        onValueChange(typeof vals[0] === 'number' ? vals[0] : value)
      }
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {markerNodes}
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-input bg-background shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
    </SliderPrimitive.Root>
  );
}
