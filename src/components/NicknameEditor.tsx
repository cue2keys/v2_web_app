import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Props {
  value?: string;
  onSubmit: (next: string) => Promise<void> | void;
  disabled?: boolean;
  emptyLabel?: string;
}

export const NicknameEditor: FC<Props> = ({ value, onSubmit, disabled, emptyLabel = '未設定' }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [composing, setComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setText(value ?? '');
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const beginEdit = () => {
    if (disabled) return;
    setText(value ?? '');
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await onSubmit(text.trim());
      setEditing(false);
    } catch {
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1">
        <span className={value ? '' : 'text-secondary-foreground'}>{value ?? emptyLabel}</span>
        {!disabled && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 bg-transparent p-0 hover:bg-transparent [&_svg]:size-3"
            onClick={beginEdit}
            aria-label={value ? 'Edit nickname' : 'Add nickname'}
          >
            <Pencil className="h-3 w-3" aria-hidden />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Input
          className="w-40"
          ref={inputRef}
          value={text}
          autoComplete="off"
          spellCheck={false}
          aria-label="Device nickname"
          onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (composing || e.nativeEvent.isComposing) return;
              e.preventDefault();
              void submit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelEdit();
            }
          }}
        />
        <Button size="sm" onClick={() => void submit()} disabled={saving} aria-label="Apply">
          Set
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
