import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

interface Props {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, className = '', ariaLabel, disabled }: Props) {
  return (
    <CheckboxPrimitive.Root
      checked={!!checked}
      onCheckedChange={(v: CheckedState) => onCheckedChange?.(v === true)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-foreground shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${className}`}
    >
      <CheckboxPrimitive.Indicator>
        <Check size={14} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
