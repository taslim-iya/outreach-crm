import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'number';
}

export function EditableCell({ value, onSave, className, placeholder = '—', type = 'text' }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
  }, [draft, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commit();
    } else if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm px-1.5 py-0 min-w-[60px]"
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'cursor-pointer rounded px-1.5 py-0.5 -mx-1.5 hover:bg-muted/60 transition-colors inline-block min-h-[1.5rem] min-w-[2rem]',
        !value && 'text-muted-foreground/50',
        className,
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  );
}
