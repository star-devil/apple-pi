import type { ApiSpec, CustomModelDef } from './types';

export interface PresetProvider {
  id: string;
  name: string;
  baseUrl: string;
  api: ApiSpec;
  keyUrl: string;
  keyPlaceholder: string;
  keyOptional?: boolean;
  fetchable: boolean;
  presetModels?: CustomModelDef[];
  description: string;
}

export const PRESET_PROVIDERS: PresetProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    api: 'openai-completions',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...',
    fetchable: true,
    description: 'GPT-4o / o1 / o3 系列',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    api: 'anthropic-messages',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...',
    fetchable: false,
    presetModels: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', reasoning: true, input: ['text', 'image'] },
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', reasoning: true, input: ['text', 'image'] },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', reasoning: true, input: ['text', 'image'] },
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', reasoning: true, input: ['text', 'image'] },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', reasoning: false, input: ['text', 'image'] },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', reasoning: false, input: ['text', 'image'] },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', reasoning: false, input: ['text'] },
    ],
    description: 'Claude Sonnet / Opus 系列(无公开列表接口,预置常用模型)',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    api: 'openai-completions',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    keyPlaceholder: 'sk-...',
    fetchable: true,
    description: 'DeepSeek V3 / R1 系列',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    api: 'google-generative-ai',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIza...',
    fetchable: true,
    description: 'Gemini 2.0 / 2.5 系列',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    api: 'openai-completions',
    keyUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-...',
    fetchable: true,
    description: '聚合多家模型,一个 Key 访问全部',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    api: 'openai-completions',
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    keyPlaceholder: '...',
    fetchable: true,
    description: 'GLM-4 系列(国内)',
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    api: 'openai-completions',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    keyPlaceholder: 'sk-...',
    fetchable: true,
    description: 'Kimi 系列(国内)',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    api: 'openai-completions',
    keyUrl: 'https://ollama.com',
    keyPlaceholder: 'ollama(无需密钥)',
    keyOptional: true,
    fetchable: true,
    description: '本地模型,需先安装 Ollama',
  },
];

export const PRESET_PROVIDER_MAP: Record<string, PresetProvider> = Object.fromEntries(
  PRESET_PROVIDERS.map((p) => [p.id, p])
);

export const API_SPEC_OPTIONS: { value: ApiSpec; label: string; defaultBaseUrl: string }[] = [
  { value: 'openai-completions', label: 'OpenAI 兼容', defaultBaseUrl: 'https://api.openai.com/v1' },
  { value: 'anthropic-messages', label: 'Anthropic', defaultBaseUrl: 'https://api.anthropic.com' },
  { value: 'openai-completions', label: 'Ollama', defaultBaseUrl: 'http://localhost:11434/v1' },
];

export function isPresetProvider(id: string): boolean {
  return id in PRESET_PROVIDER_MAP;
}

export function getPresetByProviderId(providerId: string): PresetProvider | undefined {
  return PRESET_PROVIDER_MAP[providerId];
}
