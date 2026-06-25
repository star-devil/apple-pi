import { create } from 'zustand';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { piClient } from '@/lib/pi-client';
import { PRESET_PROVIDER_MAP, PRESET_PROVIDERS, isPresetProvider } from '@/lib/presets';
import type {
  AuthConfig,
  CustomModelDef,
  ModelsConfig,
  PiModel,
  ProviderConfig,
  SettingsConfig,
} from '@/lib/types';

export interface ProviderView {
  id: string;
  presetId: string | null;
  name: string;
  isPreset: boolean;
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  api: string;
  fetchable: boolean;
  keyOptional?: boolean;
  keyPlaceholder: string;
  keyUrl?: string;
  description: string;
  models: CustomModelDef[];
  presetModels?: CustomModelDef[];
}

export interface TestResult {
  provider: string;
  modelId: string;
  success: boolean;
  message: string;
  latency?: number;
}

interface ModelsState {
  models: PiModel[];
  currentModelId: string | null;
  currentProvider: string | null;
  auth: AuthConfig;
  settings: SettingsConfig;
  modelsConfig: ModelsConfig;
  loading: boolean;
  fetchingModels: boolean;
  error: string | null;
  toast: string | null;

  selectedProviderId: string | null;
  testing: boolean;
  testResult: TestResult | null;

  load: () => Promise<void>;
  selectProvider: (id: string) => void;
  getProviderViews: () => ProviderView[];
  getProviderView: (id: string) => ProviderView | undefined;
  getModelsForProvider: (provider: string) => PiModel[];
  fetchRemoteModels: (providerId: string, overrideApiKey?: string, overrideBaseUrl?: string) => Promise<CustomModelDef[]>;
  saveProvider: (
    id: string,
    apiKey: string,
    baseUrl: string,
    models?: CustomModelDef[]
  ) => Promise<void>;
  disableProvider: (id: string) => Promise<void>;
  enableProvider: (id: string, apiKey: string) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  addCustomProvider: (
    id: string,
    name: string,
    api: string,
    baseUrl: string,
    apiKey: string,
    models: CustomModelDef[]
  ) => Promise<void>;
  switchModel: (provider: string, modelId: string) => Promise<void>;
  testConnection: (provider: string, modelId: string) => Promise<void>;
  clearToast: () => void;
  clearError: () => void;
}

function buildProviderViews(
  auth: AuthConfig,
  modelsConfig: ModelsConfig
): ProviderView[] {
  const views = new Map<string, ProviderView>();

  for (const preset of PRESET_PROVIDERS) {
    const providerKey = preset.id;
    const authEntry = auth[providerKey];
    const providerCfg = modelsConfig.providers[providerKey];
    const enabled = !!authEntry;
    views.set(preset.id, {
      id: preset.id,
      presetId: preset.id,
      name: preset.name,
      isPreset: true,
      enabled,
      apiKey: authEntry?.key ?? '',
      baseUrl: providerCfg?.baseUrl ?? preset.baseUrl,
      api: preset.api,
      fetchable: preset.fetchable,
      keyOptional: preset.keyOptional,
      keyPlaceholder: preset.keyPlaceholder,
      keyUrl: preset.keyUrl,
      description: preset.description,
      models: (providerCfg?.models as CustomModelDef[]) ?? preset.presetModels ?? [],
      presetModels: preset.presetModels,
    });
  }

  for (const [providerKey, authEntry] of Object.entries(auth)) {
    if (isPresetProvider(providerKey)) continue;
    if (views.has(providerKey)) continue;
    const providerCfg = modelsConfig.providers[providerKey];
    views.set(providerKey, {
      id: providerKey,
      presetId: null,
      name: providerCfg?.name ?? providerKey,
      isPreset: false,
      enabled: true,
      apiKey: authEntry?.key ?? '',
      baseUrl: providerCfg?.baseUrl ?? '',
      api: providerCfg?.api ?? 'openai-completions',
      fetchable: providerCfg?.api === 'openai-completions' || providerCfg?.api === 'google-generative-ai',
      keyPlaceholder: 'sk-...',
      description: '',
      models: (providerCfg?.models as CustomModelDef[]) ?? [],
    });
  }

  for (const [providerKey, providerCfg] of Object.entries(modelsConfig.providers)) {
    if (views.has(providerKey)) continue;
    if (isPresetProvider(providerKey)) continue;
    views.set(providerKey, {
      id: providerKey,
      presetId: null,
      name: providerCfg.name ?? providerKey,
      isPreset: false,
      enabled: !!auth[providerKey],
      apiKey: auth[providerKey]?.key ?? '',
      baseUrl: providerCfg.baseUrl ?? '',
      api: providerCfg.api ?? 'openai-completions',
      fetchable: providerCfg.api === 'openai-completions' || providerCfg.api === 'google-generative-ai',
      keyPlaceholder: 'sk-...',
      description: '',
      models: (providerCfg.models as CustomModelDef[]) ?? [],
    });
  }

  const presetList = [...views.values()].filter((v) => v.isPreset);
  const customList = [...views.values()].filter((v) => !v.isPreset);
  return [...presetList, ...customList];
}

async function migrateLegacyUserKeys(
  auth: AuthConfig,
  modelsConfig: ModelsConfig
): Promise<{ auth: AuthConfig; modelsConfig: ModelsConfig; migrated: boolean }> {
  let migrated = false;
  const newAuth: AuthConfig = {};
  for (const [key, val] of Object.entries(auth)) {
    const m = key.match(/^(.*)-user$/);
    if (m && isPresetProvider(m[1])) {
      const newKey = m[1];
      newAuth[newKey] = val;
      migrated = true;
    } else {
      newAuth[key] = val;
    }
  }

  let newModelsConfig = modelsConfig;
  if (modelsConfig.providers) {
    const newProviders: typeof modelsConfig.providers = {};
    for (const [key, val] of Object.entries(modelsConfig.providers)) {
      const m = key.match(/^(.*)-user$/);
      if (m && isPresetProvider(m[1])) {
        newProviders[m[1]] = val;
        migrated = true;
      } else {
        newProviders[key] = val;
      }
    }
    newModelsConfig = { ...modelsConfig, providers: newProviders };
  }

  if (migrated) {
    await piClient.saveAuth(newAuth);
    await piClient.saveModelsConfig(newModelsConfig);
  }

  return { auth: newAuth, modelsConfig: newModelsConfig, migrated };
}

function selectNextProvider(views: ProviderView[], removedId: string): string | null {
  const idx = views.findIndex((v) => v.id === removedId);
  if (idx < 0) return views[0]?.id ?? null;
  return views[idx + 1]?.id ?? views[idx - 1]?.id ?? null;
}

async function restartAndRefresh(): Promise<PiModel[]> {
  await piClient.restart();
  const resp = await piClient.getAvailableModels();
  if (resp.success && resp.data) {
    const data = resp.data as { models?: PiModel[] };
    return data.models ?? [];
  }
  return [];
}

export const useModelsStore = create<ModelsState>((set, get) => ({
  models: [],
  currentModelId: null,
  currentProvider: null,
  auth: {},
  settings: {},
  modelsConfig: { providers: {} },
  loading: false,
  fetchingModels: false,
  error: null,
  toast: null,
  selectedProviderId: null,
  testing: false,
  testResult: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const [rawAuth, settings, rawModelsConfig, stateResp, modelsResp] = await Promise.all([
        piClient.getAuth(),
        piClient.getSettings(),
        piClient.getModelsConfig(),
        piClient.getState(),
        piClient.getAvailableModels(),
      ]);

      const { auth, modelsConfig, migrated } = await migrateLegacyUserKeys(rawAuth, rawModelsConfig);
      if (migrated) {
        await piClient.restart();
      }

      let models: PiModel[] = [];
      if (modelsResp.success && modelsResp.data) {
        const data = modelsResp.data as { models?: PiModel[] };
        models = data.models ?? [];
      }
      if (migrated) {
        const fresh = await piClient.getAvailableModels();
        if (fresh.success && fresh.data) {
          const data = fresh.data as { models?: PiModel[] };
          models = data.models ?? [];
        }
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

      const views = buildProviderViews(auth, modelsConfig);
      const firstEnabled = views.find((v) => v.enabled) ?? views[0] ?? null;

      set({
        auth,
        settings,
        modelsConfig,
        models,
        currentModelId,
        currentProvider,
        selectedProviderId: get().selectedProviderId ?? firstEnabled?.id ?? null,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  selectProvider: (id) => set({ selectedProviderId: id, testResult: null }),

  getProviderViews: () => buildProviderViews(get().auth, get().modelsConfig),

  getProviderView: (id) => buildProviderViews(get().auth, get().modelsConfig).find((v) => v.id === id),

  getModelsForProvider: (provider) => {
    return get().models.filter((m) => m.provider === provider);
  },

  fetchRemoteModels: async (providerId, overrideApiKey, overrideBaseUrl) => {
    const view = get().getProviderView(providerId);
    if (!view) return [];

    const apiKey = overrideApiKey ?? view.apiKey;
    const baseUrl = overrideBaseUrl ?? view.baseUrl;

    set({ fetchingModels: true, error: null });
    try {
      let models: CustomModelDef[] = [];

      if (view.fetchable) {
        const remoteModels = await piClient.fetchModels(baseUrl, apiKey || null, view.api);
        models = remoteModels.map((m) => ({
          id: m.id,
          name: m.name,
          reasoning: false,
          input: ['text'] as const,
        }));
      } else if (view.presetModels) {
        models = view.presetModels;
      }

      set({ fetchingModels: false });
      return models;
    } catch (e) {
      set({ fetchingModels: false, error: `拉取模型列表失败: ${String(e)}` });
      return [];
    }
  },

  saveProvider: async (id, apiKey, baseUrl, models) => {
    set({ loading: true, error: null });
    try {
      const auth = { ...get().auth };
      const modelsConfig: ModelsConfig = {
        providers: { ...get().modelsConfig.providers },
      };

      const preset = PRESET_PROVIDER_MAP[id];
      const providerKey = preset ? preset.id : id;

      if (preset?.keyOptional && !apiKey) {
        auth[providerKey] = { type: 'api_key', key: 'ollama' };
      } else {
        auth[providerKey] = { type: 'api_key', key: apiKey };
      }

      const existing = modelsConfig.providers[providerKey];
      const providerCfg: ProviderConfig = {
        ...existing,
        baseUrl,
        api: preset ? preset.api : (existing?.api ?? 'openai-completions'),
      };
      if (models && models.length > 0) {
        providerCfg.models = models;
      }

      modelsConfig.providers[providerKey] = providerCfg;

      await piClient.saveAuth(auth);
      await piClient.saveModelsConfig(modelsConfig);
      const freshModels = await restartAndRefresh();

      set({
        auth,
        modelsConfig,
        models: freshModels,
        loading: false,
        toast: '配置已保存,运行时已重启',
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  disableProvider: async (id) => {
    set({ loading: true, error: null });
    try {
      const auth = { ...get().auth };

      const preset = PRESET_PROVIDER_MAP[id];
      const providerKey = preset ? preset.id : id;

      delete auth[providerKey];
      await piClient.saveAuth(auth);
      const freshModels = await restartAndRefresh();

      set({
        auth,
        models: freshModels,
        loading: false,
        toast: preset ? `已停用 ${preset.name}` : `已停用 ${id}`,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  enableProvider: async (id, apiKey) => {
    set({ loading: true, error: null });
    try {
      const auth = { ...get().auth };
      const preset = PRESET_PROVIDER_MAP[id];
      const providerKey = preset ? preset.id : id;

      if (preset?.keyOptional && !apiKey) {
        auth[providerKey] = { type: 'api_key', key: 'ollama' };
      } else {
        auth[providerKey] = { type: 'api_key', key: apiKey };
      }

      await piClient.saveAuth(auth);
      const freshModels = await restartAndRefresh();

      set({
        auth,
        models: freshModels,
        loading: false,
        toast: preset ? `已启用 ${preset.name}` : `已启用 ${id}`,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  removeProvider: async (id) => {
    set({ loading: true, error: null });
    try {
      const auth = { ...get().auth };
      const modelsConfig: ModelsConfig = {
        providers: { ...get().modelsConfig.providers },
      };

      delete auth[id];
      delete modelsConfig.providers[id];

      await piClient.saveAuth(auth);
      await piClient.saveModelsConfig(modelsConfig);
      const freshModels = await restartAndRefresh();

      const views = buildProviderViews(auth, modelsConfig);
      const nextId = selectNextProvider(views, id);

      set({
        auth,
        modelsConfig,
        models: freshModels,
        selectedProviderId: nextId,
        loading: false,
        toast: `已删除 ${id}`,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  addCustomProvider: async (id, name, api, baseUrl, apiKey, models) => {
    set({ loading: true, error: null });
    try {
      const auth = { ...get().auth };
      const modelsConfig: ModelsConfig = {
        providers: { ...get().modelsConfig.providers },
      };

      auth[id] = { type: 'api_key', key: apiKey };
      const providerCfg: ProviderConfig = {
        name,
        baseUrl,
        api: api as ProviderConfig['api'],
      };
      if (models.length > 0) {
        providerCfg.models = models;
      }
      modelsConfig.providers[id] = providerCfg;

      await piClient.saveAuth(auth);
      await piClient.saveModelsConfig(modelsConfig);
      const freshModels = await restartAndRefresh();

      set({
        auth,
        modelsConfig,
        models: freshModels,
        selectedProviderId: id,
        loading: false,
        toast: `自定义供应商 ${name} 已添加`,
      });
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

  testConnection: async (provider, modelId) => {
    set({ testing: true, testResult: null });
    const originalModelId = get().currentModelId;
    const originalProvider = get().currentProvider;
    const start = Date.now();

    let unlistenFn: UnlistenFn | undefined;
    let unlistenPromise: Promise<UnlistenFn> | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = () => {
      if (unlistenFn) unlistenFn();
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };

    try {
      const switchResp = await piClient.setModel(provider, modelId);
      if (!switchResp.success) {
        throw new Error(switchResp.error ?? `无法切换到模型 ${modelId}`);
      }

      const result = await new Promise<TestResult>((resolve) => {
        const finish = (r: TestResult) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(r);
        };

        unlistenPromise = piClient.onEvent((e) => {
          if (settled) return;
          if (e.type === 'turn_end') {
            finish({
              provider,
              modelId,
              success: true,
              message: '连接成功',
              latency: Date.now() - start,
            });
          } else if (e.type === 'agent_end' && e.assistantMessageEvent?.type === 'error') {
            finish({
              provider,
              modelId,
              success: false,
              message: e.assistantMessageEvent.error ?? '模型返回错误',
              latency: Date.now() - start,
            });
          }
        });
        unlistenPromise.then((fn) => {
          if (settled) {
            fn();
          } else {
            unlistenFn = fn;
          }
        });

        timeoutHandle = setTimeout(() => {
          finish({
            provider,
            modelId,
            success: false,
            message: '测试超时(15s)',
            latency: Date.now() - start,
          });
        }, 15000);

        piClient.prompt('hi').then((resp) => {
          if (!resp.success) {
            finish({
              provider,
              modelId,
              success: false,
              message: resp.error ?? '发送测试消息失败',
              latency: Date.now() - start,
            });
          }
        });
      });

      set({ testing: false, testResult: result });

      if (originalProvider && originalModelId) {
        await piClient.setModel(originalProvider, originalModelId).catch(() => {});
        set({ currentProvider: originalProvider, currentModelId: originalModelId });
      }
    } catch (e) {
      cleanup();
      set({
        testing: false,
        testResult: {
          provider,
          modelId,
          success: false,
          message: String(e),
          latency: Date.now() - start,
        },
      });
    }
  },

  clearToast: () => set({ toast: null }),
  clearError: () => set({ error: null }),
}));
