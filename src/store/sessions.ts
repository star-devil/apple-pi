import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { piClient } from '@/lib/pi-client';
import { useChatStore } from '@/store/chat';
import type { ChatMessage, PiMessage, SessionEntry } from '@/lib/types';

interface SessionsState {
  sessions: SessionEntry[];
  currentSessionId: string | null;
  loading: boolean;
  error: string | null;

  list: () => Promise<void>;
  /** Switch to an existing session and load its messages. */
  open: (session: SessionEntry) => Promise<void>;
  /** Start a new empty session. */
  create: () => Promise<void>;
}

/// Convert a PiMessage (from get_messages RPC) into a ChatMessage for the UI.
/// A single Pi message may carry multiple content parts (thinking + text + toolCalls);
/// they are flattened into one ChatMessage.
function piMessageToChat(m: PiMessage, index: number): ChatMessage {
  let text = '';
  let thinking: string | undefined;
  const toolCalls: ChatMessage['toolCalls'] = [];

  for (const c of m.content) {
    switch (c.type) {
      case 'text':
        text += c.text;
        break;
      case 'thinking':
        thinking = (thinking ?? '') + c.thinking;
        break;
      case 'toolCall': {
        toolCalls.push({
          id: c.id,
          name: c.name,
          arguments: c.arguments,
        });
        break;
      }
      // toolResult / system content is not surfaced in the bubble for now.
      default:
        break;
    }
  }

  return {
    id: m.id ?? `msg-${index}`,
    role: m.role,
    text,
    thinking,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    streaming: false,
  };
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  loading: false,
  error: null,

  list: async () => {
    set({ loading: true, error: null });
    try {
      const sessions = await invoke<SessionEntry[]>('list_sessions');
      set({ sessions, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  open: async (session) => {
    set({ loading: true, error: null });
    try {
      const resp = await piClient.switchSession(session.path);
      if (!resp.success) {
        throw new Error(resp.error ?? 'switch_session failed');
      }
      // Load messages and feed into the chat store.
      const msgsResp = await piClient.getMessages();
      if (!msgsResp.success) {
        throw new Error(msgsResp.error ?? 'get_messages failed');
      }
      const data = msgsResp.data as { messages: PiMessage[] };
      const chatMessages = (data.messages ?? []).map(piMessageToChat);
      useChatStore.getState().clear();
      for (const cm of chatMessages) {
        useChatStore.getState().addMessage(cm);
      }
      set({ currentSessionId: session.id, loading: false });
      // Refresh the list in case the session order changed.
      void get().list();
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  create: async () => {
    set({ loading: true, error: null });
    try {
      const resp = await piClient.newSession();
      if (!resp.success) {
        throw new Error(resp.error ?? 'new_session failed');
      }
      useChatStore.getState().clear();
      set({ currentSessionId: null, loading: false });
      void get().list();
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },
}));
