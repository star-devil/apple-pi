// Pi RPC protocol types — see https://github.com/earendil-works/pi packages/coding-agent/docs/rpc.md
// Subset relevant to apple-pi MVP (chat + model switching).

// ---------- Commands (frontend -> sidecar via invoke('pi_send')) ----------

export interface RpcCommand {
  type: string;
  id?: string;
  message?: string;
  provider?: string;
  modelId?: string;
  [key: string]: unknown;
}

export interface RpcResponse {
  id?: string;
  type: 'response';
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

// ---------- Events (sidecar -> frontend via listen('pi:event')) ----------

export type RpcEventType =
  | 'agent_start'
  | 'agent_end'
  | 'turn_start'
  | 'turn_end'
  | 'message_start'
  | 'message_update'
  | 'message_end'
  | 'tool_execution_start'
  | 'tool_execution_update'
  | 'tool_execution_end'
  | 'queue_update'
  | 'compaction_start'
  | 'compaction_end'
  | 'auto_retry_start'
  | 'auto_retry_end'
  | 'extension_error';

export interface RpcEvent {
  type: RpcEventType;
  sessionId?: string;
  assistantMessageEvent?: AssistantMessageEvent;
  messages?: PiMessage[];
  [key: string]: unknown;
}

// assistantMessageEvent.type discriminates content kind
export interface AssistantMessageEvent {
  type:
    | 'text_start'
    | 'text_delta'
    | 'text_end'
    | 'thinking_start'
    | 'thinking_delta'
    | 'thinking_end'
    | 'toolcall_start'
    | 'toolcall_delta'
    | 'toolcall_end'
    | 'done'
    | 'error';
  delta?: string;
  text?: string;
  thinking?: string;
  toolCall?: ToolCall;
  error?: string;
  [key: string]: unknown;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  [key: string]: unknown;
}

// ---------- Pi message model ----------

export type PiMessageRole = 'user' | 'assistant' | 'toolResult' | 'system';

export interface PiMessage {
  id?: string;
  role: PiMessageRole;
  content: MessageContent[];
  [key: string]: unknown;
}

export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string }
  | { type: 'toolCall'; id: string; name: string; arguments: Record<string, unknown> }
  | { type: 'toolResult'; toolCallId?: string; content?: unknown };

// ---------- apple-pi UI model (derived from RPC events) ----------

export interface ChatMessage {
  id: string;
  role: PiMessageRole;
  text: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  streaming?: boolean;
}

// ---------- Model registry (from get_available_models) ----------

export interface ModelCost {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export interface PiModel {
  id: string;
  name: string;
  provider: string;
  api?: string;
  baseUrl?: string;
  reasoning?: boolean;
  contextWindow?: number;
  maxTokens?: number;
  cost?: ModelCost;
  [key: string]: unknown;
}

// API 规范标识符(对应 Pi sidecar 的 KnownApi)
export type ApiSpec =
  | 'openai-completions'
  | 'openai-responses'
  | 'anthropic-messages'
  | 'google-generative-ai'
  | 'google-vertex'
  | 'mistral-conversations'
  | 'bedrock-converse-stream'
  | (string & {});

// models.json 中自定义模型定义
export interface CustomModelDef {
  id: string;
  name?: string;
  api?: ApiSpec;
  baseUrl?: string;
  reasoning?: boolean;
  input?: ('text' | 'image')[];
  contextWindow?: number;
  maxTokens?: number;
  cost?: { input: number; output: number; cacheRead?: number; cacheWrite?: number };
  headers?: Record<string, string>;
  [key: string]: unknown;
}

// ---------- Pi config files (auth.json / settings.json) ----------

// auth.json: provider -> credential entry
export interface AuthEntry {
  type?: string; // "api_key" | "command" | "env"
  key?: string; // literal key, or command, or env var name
}
export type AuthConfig = Record<string, AuthEntry>;

// models.json: custom provider configurations (baseUrl, headers, models, ...)
export interface ProviderConfig {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  api?: ApiSpec;
  headers?: Record<string, string>;
  models?: CustomModelDef[];
  modelOverrides?: Record<string, unknown>;
  [key: string]: unknown;
}
export interface ModelsConfig {
  providers: Record<string, ProviderConfig>;
}

export interface SettingsConfig {
  defaultProvider?: string | null;
  defaultModel?: string | null;
  defaultThinkingLevel?: string;
  [key: string]: unknown;
}

// ---------- Session history (from list_sessions Tauri command) ----------

export interface SessionEntry {
  id: string;
  timestamp: string;
  cwd?: string | null;
  path: string;
  title: string;
}
