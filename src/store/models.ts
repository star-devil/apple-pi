import { create } from 'zustand';
import { piClient } from '@/lib/pi-client';
import type { AuthConfig, PiModel, SettingsConfig } from '@/lib/types';

interface ModelsState {
  models: PiModel[];
  currentModelId: string | null;
  currentProvider: string | null;
  auth: AuthConfig;
  settings: SettingsConfig;
  loading: boolean;
  error: string | null;

  // Load everything needed for the models page in one shot.
  load: () => Promise<void>;
  // Persist auth.json and reload available models (new provider/key may unlock models).
  saveAuth: (auth: AuthConfig) => Promise<void>;
  // Persist settings.json and hot-swap the active model via RPC.
  saveSettingsAndSwitch: (settings: SettingsConfig) => Promise<void>;
  // Switch the active model at runtime without touching settings.json.
  switchModel: (provider: string, modelId: string) => Promise<void>;
}

export const useModelsStore = create<ModelsState>((set, get) => ({
  models: [],
  currentModelId: null,
  currentProvider: null,
  auth: {},
  settings: {},
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const [auth, settings, stateResp, modelsResp] = await Promise.all([
        piClient.getAuth(),
        piClient.getSettings(),
        piClient.getState(),
        piClient.getAvailableModels(),
      ]);

      let models: PiModel[] = [];
      if (modelsResp.success && modelsResp.data) {
        const data = modelsResp.data as { models?: PiModel[] };
        models = data.models ?? [];
      }

      let currentModelId = settings.defaultModel ?? null;
      let currentProvider = settings.defaultProvider ?? null;
      if (stateResp.success && stateResp.data) {
        const data = stateResp.data as { model?: PiModel };
        if (data.model) {
          currentModelId = data.model.id;
          currentProvider = data.model.provider;
        }
      }

      set({
        auth,
        settings,
        models,
        currentModelId,
        currentProvider,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  saveAuth: async (auth) => {
    set({ loading: true, error: null });
    try {
      await piClient.saveAuth(auth);
      set({ auth });
      // A new provider/key may unlock additional models; refresh the list.
      const resp = await piClient.getAvailableModels();
      if (resp.success && resp.data) {
        const data = resp.data as { models?: PiModel[] };
        set({ models: data.models ?? [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  saveSettingsAndSwitch: async (settings) => {
    set({ loading: true, error: null });
    try {
      await piClient.saveSettings(settings);
      // Hot-swap the active model if a default is configured.
      if (settings.defaultProvider && settings.defaultModel) {
        const resp = await piClient.setModel(
          settings.defaultProvider,
          settings.defaultModel
        );
        if (resp.success) {
          set({
            currentProvider: settings.defaultProvider,
            currentModelId: settings.defaultModel,
          });
        } else {
          throw new Error(resp.error ?? 'set_model failed');
        }
      }
      set({ settings, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  switchModel: async (provider, modelId) => {
    set({ loading: true, error: null });
    try {
      const resp = await piClient.setModel(provider, modelId);
      if (resp.success) {
        set({
          currentProvider: provider,
          currentModelId: modelId,
          settings: { ...get().settings, defaultProvider: provider, defaultModel: modelId },
          loading: false,
        });
        // Persist the new default to settings.json as well.
        await piClient.saveSettings({
          ...get().settings,
          defaultProvider: provider,
          defaultModel: modelId,
        });
      } else {
        throw new Error(resp.error ?? 'set_model failed');
      }
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },
}));
