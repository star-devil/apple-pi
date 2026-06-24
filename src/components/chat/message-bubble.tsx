import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-body-md',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-surface-container text-on-surface'
        )}
      >
        {message.thinking && (
          <details className="mb-2 rounded-lg bg-surface-container-high/50 p-2 text-label-sm text-muted-foreground">
            <summary className="cursor-pointer select-none">思考过程</summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-label-sm">
              {message.thinking}
            </pre>
          </details>
        )}
        <div className="whitespace-pre-wrap break-words">
          {message.text || (message.streaming ? '…' : '')}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-outline-variant/30 pt-2">
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className="text-label-sm text-muted-foreground">
                🔧 {tc.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
