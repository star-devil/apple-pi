import { create } from 'zustand';
import type { ChatMessage, ToolCall } from '@/lib/types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;

  // Append a fully-formed message (user prompt, or finalize a completed assistant msg).
  addMessage: (msg: ChatMessage) => void;

  // Start a new assistant message in streaming state.
  startAssistant: (id: string) => void;

  // Accumulate text delta into the streaming assistant message.
  appendText: (id: string, delta: string) => void;

  // Accumulate thinking delta.
  appendThinking: (id: string, delta: string) => void;

  // Record a tool call on the streaming assistant message.
  addToolCall: (id: string, toolCall: ToolCall) => void;

  // Mark the streaming assistant message as done.
  finalize: (id: string) => void;

  setStreaming: (s: boolean) => void;
  setError: (e: string | null) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  error: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  startAssistant: (id) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: 'assistant', text: '', streaming: true },
      ],
    })),

  appendText: (id, delta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, text: m.text + delta } : m
      ),
    })),

  appendThinking: (id, delta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, thinking: (m.thinking ?? '') + delta } : m
      ),
    })),

  addToolCall: (id, toolCall) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCall] }
          : m
      ),
    })),

  finalize: (id) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming: false } : m
      ),
    })),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setError: (error) => set({ error }),
  clear: () => set({ messages: [], error: null, isStreaming: false }),
}));
