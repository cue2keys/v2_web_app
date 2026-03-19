import * as SelectPrimitive from '@radix-ui/react-select';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onValueChange,
  placeholder,
  className = '',
  children,
  ariaLabel,
  disabled,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={`kbd-input flex items-center justify-between ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
        disabled={disabled}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <ChevronDown className="opacity-70" size={16} aria-hidden />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-background text-foreground shadow-md">
          <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-secondary/60"
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
