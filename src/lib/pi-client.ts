import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { AuthConfig, RpcCommand, RpcEvent, RpcResponse, SettingsConfig } from './types';

// Singleton wrapper around the Tauri IPC bridge to the Pi sidecar.
export const piClient = {
  /** Ensure the sidecar is started; returns true if healthy. */
  ready: () => invoke<boolean>('pi_ready'),

  /** Start the sidecar if not running. */
  start: () => invoke<void>('pi_start'),

  /** Send a raw RPC command and await its response (matched by id). */
  send: (cmd: RpcCommand) => invoke<RpcResponse>('pi_send', { cmd }),

  /** Send a prompt; the assistant response arrives via onEvent stream. */
  prompt: (text: string): Promise<RpcResponse> =>
    piClient.send({ type: 'prompt', message: text, id: crypto.randomUUID() }),

  /** Abort the current agent operation. */
  abort: (): Promise<RpcResponse> => piClient.send({ type: 'abort' }),

  /** Switch model at runtime. */
  setModel: (provider: string, modelId: string): Promise<RpcResponse> =>
    piClient.send({ type: 'set_model', provider, modelId, id: crypto.randomUUID() }),

  /** List available models (from the sidecar's model registry). */
  getAvailableModels: (): Promise<RpcResponse> =>
    piClient.send({ type: 'get_available_models', id: crypto.randomUUID() }),

  /** Get current session state. */
  getState: (): Promise<RpcResponse> =>
    piClient.send({ type: 'get_state', id: crypto.randomUUID() }),

  /** Subscribe to the Pi event stream. Returns an unsubscribe function. */
  onEvent: (handler: (e: RpcEvent) => void): Promise<UnlistenFn> =>
    listen<RpcEvent>('pi:event', (e) => handler(e.payload)),

  // ---------- Config file access (direct file IO in Rust) ----------

  getAuth: (): Promise<AuthConfig> => invoke<AuthConfig>('config_get_auth'),
  saveAuth: (auth: AuthConfig): Promise<void> => invoke<void>('config_save_auth', { auth }),
  getSettings: (): Promise<SettingsConfig> => invoke<SettingsConfig>('config_get_settings'),
  saveSettings: (settings: SettingsConfig): Promise<void> =>
    invoke<void>('config_save_settings', { settings }),
};
