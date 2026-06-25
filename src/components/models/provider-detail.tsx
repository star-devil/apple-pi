import { useEffect, useState } from 'react';
import { Loader2, Save, Trash2, ExternalLink, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useModelsStore } from '@/store/models';
import { PRESET_PROVIDER_MAP } from '@/lib/presets';
import type { CustomModelDef } from '@/lib/types';
import { TestModelDialog } from './test-model-dialog';

export function ProviderDetail() {
  const selectedId = useModelsStore((s) => s.selectedProviderId);
  const getProviderView = useModelsStore((s) => s.getProviderView);
  const loading = useModelsStore((s) => s.loading);
  const fetchingModels = useModelsStore((s) => s.fetchingModels);
  const saveProvider = useModelsStore((s) => s.saveProvider);
  const disableProvider = useModelsStore((s) => s.disableProvider);
  const enableProvider = useModelsStore((s) => s.enableProvider);
  const removeProvider = useModelsStore((s) => s.removeProvider);
  const fetchRemoteModels = useModelsStore((s) => s.fetchRemoteModels);

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [models, setModels] = useState<CustomModelDef[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const view = selectedId ? getProviderView(selectedId) : undefined;

  useEffect(() => {
    if (view) {
      setApiKey(view.apiKey);
      setBaseUrl(view.baseUrl);
      setModels(view.models);
    }
  }, [view?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!view) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        请从左侧选择一个供应商
      </div>
    );
  }

  const preset = PRESET_PROVIDER_MAP[view.id];
  const isPreset = view.isPreset;
  const hasChanges =
    apiKey !== view.apiKey ||
    baseUrl !== view.baseUrl ||
    JSON.stringify(models) !== JSON.stringify(view.models);

  const handleSave = async () => {
    await saveProvider(view.id, apiKey, baseUrl, models);
  };

  const handleToggleEnabled = async () => {
    if (view.enabled) {
      await disableProvider(view.id);
    } else {
      await enableProvider(view.id, apiKey);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`确认删除自定义供应商 ${view.name}?此操作不可撤销。`)) return;
    await removeProvider(view.id);
  };

  const handleFetchModels = async () => {
    const fetched = await fetchRemoteModels(view.id, apiKey, baseUrl);
    if (fetched.length > 0) {
      if (apiKey || view.keyOptional) {
        await saveProvider(view.id, apiKey, baseUrl, fetched);
      }
      setModels(fetched);
    }
  };

  const showModelsEditor = !isPreset || view.fetchable || !!view.presetModels;
  const canEnable = !view.enabled && (apiKey || view.keyOptional);

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-title text-display font-medium text-on-surface">
                  {view.name}
                </h1>
                {view.enabled ? (
                  <Badge variant="secondary" className="text-xs">已启用</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">未启用</Badge>
                )}
                {isPreset && <Badge variant="outline" className="text-xs">预置</Badge>}
              </div>
              {view.description && (
                <p className="mt-1 text-body-md text-muted-foreground">{view.description}</p>
              )}
            </div>
            {!isPreset && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
                aria-label="删除供应商"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </header>

          <div className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface p-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-body-sm font-medium">API Key</Label>
                {preset?.keyUrl && (
                  <a
                    href={preset.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    获取密钥 <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={view.keyPlaceholder || 'sk-...'}
                autoComplete="off"
                spellCheck={false}
              />
              {view.keyOptional && (
                <p className="text-xs text-muted-foreground">该供应商无需 API Key,可留空。</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-body-sm font-medium">Base URL</Label>
              <Input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                autoComplete="off"
                spellCheck={false}
              />
              {isPreset && (
                <p className="text-xs text-muted-foreground">
                  默认:{preset?.baseUrl}。如使用代理可修改此地址。
                </p>
              )}
            </div>

            {showModelsEditor && (
              <ModelsEditor
                models={models}
                onChange={setModels}
                fetchable={view.fetchable}
                hasPresetModels={!!view.presetModels}
                onFetch={handleFetchModels}
                fetching={fetchingModels}
              />
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={loading || !hasChanges}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                保存
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTestDialog(true)}
                disabled={loading || !view.enabled}
              >
                <Zap className="mr-2 h-4 w-4" />
                测试
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Switch
                  checked={view.enabled}
                  onCheckedChange={handleToggleEnabled}
                  disabled={loading || (!view.enabled && !canEnable)}
                />
                <Label className="text-body-sm text-muted-foreground">
                  {view.enabled ? '已启用' : '启用'}
                </Label>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {showTestDialog && (
        <TestModelDialog providerId={view.id} onClose={() => setShowTestDialog(false)} />
      )}
    </div>
  );
}

function ModelsEditor({
  models,
  onChange,
  fetchable,
  hasPresetModels,
  onFetch,
  fetching,
}: {
  models: CustomModelDef[];
  onChange: (models: CustomModelDef[]) => void;
  fetchable: boolean;
  hasPresetModels: boolean;
  onFetch: () => void;
  fetching: boolean;
}) {
  const [newModelId, setNewModelId] = useState('');

  const addModel = () => {
    const id = newModelId.trim();
    if (!id || models.some((m) => m.id === id)) return;
    onChange([...models, { id, name: id, reasoning: false, input: ['text'] }]);
    setNewModelId('');
  };

  const removeModel = (id: string) => {
    onChange(models.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-2 border-t border-outline-variant/30 pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-body-sm font-medium">模型列表</Label>
        {fetchable && (
          <Button variant="ghost" size="sm" onClick={onFetch} disabled={fetching} className="h-7 text-xs">
            {fetching ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            从服务端拉取
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {hasPresetModels
          ? '已预置常用模型,可增删。点击"从服务端拉取"可替换为实际可用模型。'
          : '手动添加模型 ID(如 gpt-4o、llama3.2),或点击"从服务端拉取"自动获取。'}
      </p>
      {models.length > 0 && (
        <div className="space-y-1">
          {models.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md bg-surface-container-low px-3 py-1.5">
              <span className="font-mono text-xs">{m.id}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeModel(m.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Input
          value={newModelId}
          onChange={(e) => setNewModelId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addModel();
            }
          }}
          placeholder="模型 ID(如 gpt-4o)"
          className="text-xs"
          spellCheck={false}
        />
        <Button variant="outline" size="sm" onClick={addModel} disabled={!newModelId.trim()}>
          添加
        </Button>
      </div>
    </div>
  );
}
