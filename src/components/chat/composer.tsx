import { useState, type FormEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSend: (text: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function Composer({ onSend, onAbort, isStreaming, disabled }: ComposerProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || isStreaming || disabled) return;
    onSend(text);
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-outline-variant/40 bg-surface-container-lowest p-window-padding"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={disabled ? '正在连接 agent…' : '输入消息,Enter 发送,Shift+Enter 换行'}
        disabled={disabled}
        rows={1}
        className={cn(
          'max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-outline-variant/50 bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          'disabled:opacity-50'
        )}
      />
      {isStreaming ? (
        <Button type="button" variant="destructive" size="icon" onClick={onAbort} aria-label="停止">
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="submit" size="icon" disabled={disabled || !value.trim()} aria-label="发送">
          <Send className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
