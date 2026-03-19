import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  v2_actual_addr_from_display,
  v2_display_addr_from_actual,
  v2_display_addr_label,
  v2_display_addr_max,
} from '../commonData/utils';
import { type ButtonProps, Button } from './ui/button';
import { Input } from './ui/input';

const decByte = (n: number) => (n & 0xff).toString(10);
const sanitizeDecimal = (value: string) => value.trim().replace(/[^\d]/g, '');

interface Props {
  value: number;
  onSubmit: (nextAddr: number) => Promise<void> | void;
  disabled?: boolean;
  buttonLabel?: ReactNode;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  buttonClassName?: string;
  submitLabel?: string;
  displayLabel?: string;
}

export const AddressEditor: FC<Props> = ({
  value,
  onSubmit,
  disabled,
  buttonLabel = <Pencil className="h-3 w-3" aria-hidden />,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonClassName,
  submitLabel = 'Set',
  displayLabel: displayLabelProp,
}) => {
  const [editing, setEditing] = useState(false);
  const [dec, setDec] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [composing, setComposing] = useState(false);
  const maxDisplay = v2_display_addr_max;
  const maxDigits = Math.max(String(maxDisplay).length, 1);
  const currentDisplay = v2_display_addr_from_actual(value);
  const currentDisplayText = currentDisplay == null ? decByte(value) : currentDisplay.toString(10);
  const displayLabel = displayLabelProp ?? v2_display_addr_label(value);

  const beginEdit = () => {
    if (disabled) return;
    setDec(currentDisplayText);
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const submit = async () => {
    if (saving) return;
    const cleaned = sanitizeDecimal(dec);
    if (!cleaned) {
      setError(`1〜${maxDisplay}の範囲で入力してください`);
      return;
    }
    const next = Number.parseInt(cleaned, 10);
    if (Number.isNaN(next)) {
      setError(`1〜${maxDisplay}の範囲で入力してください`);
      return;
    }
    if (currentDisplay === 0 && next === 0) {
      setEditing(false);
      return;
    }
    if (next < 1 || next > maxDisplay) {
      setError(`1〜${maxDisplay}の範囲で入力してください`);
      return;
    }
    if (currentDisplay != null && next === currentDisplay) {
      setEditing(false);
      return;
    }
    const nextAddr = v2_actual_addr_from_display(next);
    if (nextAddr == null) {
      setError(`1〜${maxDisplay}の範囲で入力してください`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(nextAddr);
      setEditing(false);
    } catch {
      setError('送信に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{displayLabel}</span>
        {!disabled && (
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className={buttonClassName}
            onClick={beginEdit}
            aria-label="Edit I2C address"
          >
            {buttonLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          className="w-16"
          autoFocus
          value={dec}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          maxLength={maxDigits}
          placeholder="1-96"
          aria-label="I2C address decimal"
          disabled={saving}
          onFocus={(e) => e.currentTarget.select()}
          onInput={(e) => {
            const next = sanitizeDecimal((e.currentTarget as HTMLInputElement).value).slice(
              0,
              maxDigits,
            );
            setDec(next);
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (composing || e.nativeEvent.isComposing) return;
              e.preventDefault();
              if (saving) return;
              void submit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelEdit();
            }
          }}
        />
        <Button size="sm" onClick={() => void submit()} disabled={saving} aria-label="Apply">
          {submitLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={cancelEdit}
          disabled={saving}
          aria-label="Cancel"
        >
          Cancel
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
