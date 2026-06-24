import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ChatView } from '@/components/chat/chat-view';
import { piClient } from '@/lib/pi-client';

export const Route = createFileRoute('/')({
  component: ChatPage
});

function ChatPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await piClient.ready();
        if (!cancelled) setReady(ok);
      } catch {
        if (!cancelled) setReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <ChatView key={ready ? 'ready' : 'init'} />;
}
