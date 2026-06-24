import { useEffect, useRef } from 'react';
import { piClient } from '@/lib/pi-client';
import { useChatStore } from '@/store/chat';
import type { RpcEvent } from '@/lib/types';

// Tracks the id of the assistant message currently being streamed for one
// agent run, so message_update deltas accumulate into the right bubble.
export function usePiEvents() {
  const assistantIdRef = useRef<string | null>(null);
  const { startAssistant, appendText, appendThinking, addToolCall, finalize, setStreaming, setError } =
    useChatStore.getState();

  useEffect(() => {
    const unlistenP = piClient.onEvent((e: RpcEvent) => {
      switch (e.type) {
        case 'agent_start': {
          setStreaming(true);
          setError(null);
          const id = crypto.randomUUID();
          assistantIdRef.current = id;
          startAssistant(id);
          break;
        }
        case 'agent_end': {
          const id = assistantIdRef.current;
          if (id) finalize(id);
          assistantIdRef.current = null;
          setStreaming(false);
          break;
        }
        case 'message_update': {
          const id = assistantIdRef.current;
          if (!id || !e.assistantMessageEvent) break;
          const ev = e.assistantMessageEvent;
          switch (ev.type) {
            case 'text_delta':
              if (ev.delta) appendText(id, ev.delta);
              break;
            case 'thinking_delta':
              if (ev.delta) appendThinking(id, ev.delta);
              break;
            case 'toolcall_start':
              if (ev.toolCall) addToolCall(id, ev.toolCall);
              break;
          }
          break;
        }
        case 'extension_error': {
          setError(String(e['error'] ?? 'extension error'));
          break;
        }
      }
    });

    return () => {
      unlistenP.then((un) => un());
    };
  }, [startAssistant, appendText, appendThinking, addToolCall, finalize, setStreaming, setError]);
}
