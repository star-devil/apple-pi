import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Check, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useModelsStore } from '@/store/models';
import { cn } from '@/lib/utils';
import type { AuthConfig } from '@/lib/types';

export const Route = createFileRoute('/models')({
  component: ModelsPage,
});

function ModelsPage() {
  const {
    models,
    currentModelId,
    currentProvider,
    auth,
    loading,
    error,
    load,
    saveAuth,
    switchModel,
  } = useModelsStore();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-full overflow-hidden p-window-padding">
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-4xl space-y-6 pb-8">
          <header>
            <h1 className="font-serif-title text-display font-medium text-on-surface">
              模型配置
            </h1>
            <p className="mt-1 text-body-md text-muted-foreground">
              管理 API 密钥与默认模型,改动后即时生效
            </p>
          </header>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
              {error}
            </div>
          )}

          <ProviderCard
            auth={auth}
            loading={loading}
            onSave={saveAuth}
          />

          <ModelsCard
            models={models}
            currentModelId={currentModelId}
            currentProvider={currentProvider}
            loading={loading}
            onSwitch={switchModel}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------- Provider + API key card ----------

interface ProviderCardProps {
  auth: AuthConfig;
  loading: boolean;
  onSave: (auth: AuthConfig) => Promise<void>;
}

function ProviderCard({ auth, loading, onSave }: ProviderCardProps) {
  const [draft, setDraft] = useState<AuthConfig>(auth);
  const [newProvider, setNewProvider] = useState('');

  // Re-sync draft when the store finishes loading.
  useEffect(() => {
    setDraft(auth);
  }, [auth]);

  const providers = Object.keys(draft);

  const updateKey = (provider: string, key: string) =>
    setDraft((d) => ({ ...d, [provider]: { ...d[provider], type: 'api_key', key } }));

  const removeProvider = (provider: string) =>
    setDraft((d) => {
      const next = { ...d };
      delete next[provider];
      return next;
    });

  const addProvider = () => {
    const name = newProvider.trim();
    if (!name || draft[name]) return;
    setDraft((d) => ({ ...d, [name]: { type: 'api_key', key: '' } }));
    setNewProvider('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider 与 API 密钥</CardTitle>
        <CardDescription>
          写入 auth.json(权限 0600)。支持字面量 key、`!command`、`$ENV` 语法。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {providers.length === 0 && (
          <p className="text-body-sm text-muted-foreground">
            尚未配置任何 provider。在下方添加(如 deepseek、openai、anthropic)。
          </p>
        )}

        {providers.map((p) => (
          <div key={p} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-body-sm font-medium">{p}</Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeProvider(p)}
                aria-label={`删除 ${p}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input
              type="password"
              value={draft[p]?.key ?? ''}
              onChange={(e) => updateKey(p, e.target.value)}
              placeholder="sk-... 或 !command 或 $ENV_VAR"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ))}

        <div className="flex items-end gap-2 pt-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-body-sm">新增 Provider</Label>
            <Input
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addProvider();
                }
              }}
              placeholder="provider 名称"
              spellCheck={false}
            />
          </div>
          <Button variant="outline" size="sm" onClick={addProvider} disabled={!newProvider.trim()}>
            <Plus className="mr-1 h-3.5 w-3.5" /> 添加
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onSave(draft)} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存密钥
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Available models card ----------

interface ModelsCardProps {
  models: ReturnType<typeof useModelsStore.getState>['models'];
  currentModelId: string | null;
  currentProvider: string | null;
  loading: boolean;
  onSwitch: (provider: string, modelId: string) => Promise<void>;
}

function ModelsCard({
  models,
  currentModelId,
  currentProvider,
  loading,
  onSwitch,
}: ModelsCardProps) {
  // Group models by provider.
  const byProvider = models.reduce<Record<string, typeof models>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});
  const providerNames = Object.keys(byProvider).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>可用模型</CardTitle>
        <CardDescription>
          点击切换当前模型(RPC set_model 热生效,并写入 settings.json 默认)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {models.length === 0 && !loading && (
          <p className="text-body-sm text-muted-foreground">
            未获取到模型。请先在上方配置 provider 与密钥并保存,然后刷新。
          </p>
        )}
        {loading && models.length === 0 && (
          <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> 加载中…
          </div>
        )}

        {providerNames.map((p) => (
          <div key={p} className="space-y-2">
            <h3 className="text-headline-sm font-medium text-on-surface">{p}</h3>
            <div className="grid gap-2">
              {byProvider[p].map((m) => {
                const active =
                  m.id === currentModelId && m.provider === currentProvider;
                return (
                  <button
                    key={`${m.provider}/${m.id}`}
                    onClick={() => onSwitch(m.provider, m.id)}
                    disabled={loading}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                      'border-outline-variant/40 bg-surface hover:bg-surface-container-low',
                      active && 'border-primary/60 bg-primary/5',
                      loading && 'opacity-60'
                    )}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-body-md font-medium text-on-surface">
                          {m.name}
                        </span>
                        {m.reasoning && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            reasoning
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{m.id}</span>
                        {m.contextWindow && (
                          <span>{(m.contextWindow / 1000).toFixed(0)}k ctx</span>
                        )}
                        {m.cost && (
                          <span>
                            ${m.cost.input.toFixed(2)}/${m.cost.output.toFixed(2)} per M
                          </span>
                        )}
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
