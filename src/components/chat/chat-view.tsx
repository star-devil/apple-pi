import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { Composer } from './composer';
import { usePiEvents } from './use-pi-events';
import { useChatStore } from '@/store/chat';
import { piClient } from '@/lib/pi-client';

export function ChatView() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const error = useChatStore((s) => s.error);
  const addMessage = useChatStore((s) => s.addMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const setError = useChatStore((s) => s.setError);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to the Pi event stream once.
  usePiEvents();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    addMessage({ id: crypto.randomUUID(), role: 'user', text });
    piClient
      .prompt(text)
      .then((r) => {
        if (!r.success) setError(r.error ?? 'prompt 失败');
      })
      .catch((e) => setError(String(e)));
  };

  const handleAbort = () => {
    void piClient.abort();
    setStreaming(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-window-padding">
          {messages.length === 0 && (
            <div className="mt-20 text-center text-muted-foreground">
              开始与 agent 对话吧。
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-2 text-label-md text-destructive">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <Composer onSend={handleSend} onAbort={handleAbort} isStreaming={isStreaming} />
    </div>
  );
}
