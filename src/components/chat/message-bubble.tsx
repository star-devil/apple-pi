import { Bot, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Markdown } from './markdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end px-window-padding">
        <div className="flex max-w-[80%] flex-col items-end gap-1">
          <div className="rounded-xl rounded-br-sm bg-ink-blue px-4 py-2.5 text-body text-ivory">
            <p className="leading-relaxed">{message.content}</p>
          </div>
          <span className="px-1 text-label-sm text-stone">{message.timestamp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-window-padding">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-warm-sand text-on-surface">
          <Bot className="h-4 w-4" strokeWidth={2} />
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-serif-title text-item font-medium text-on-surface">智能体</span>
          <span className="text-label-sm text-stone">{message.timestamp}</span>
        </div>
        <div className="rounded-xl rounded-tl-sm bg-ivory px-4 py-3 shadow-ring">
          <Markdown content={message.content} />
        </div>
        {/* 操作按钮 */}
        <div className="flex items-center gap-1 pt-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="点赞">
            <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="点踩">
            <ThumbsDown className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="重新生成">
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
