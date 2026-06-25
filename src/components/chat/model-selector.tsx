import { useEffect, useMemo } from 'react';
import { Check, ChevronDown, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useModelsStore } from '@/store/models';
import { getPresetByProviderId } from '@/lib/presets';
import type { PiModel } from '@/lib/types';

export function ModelSelector() {
  const models = useModelsStore((s) => s.models);
  const currentModelId = useModelsStore((s) => s.currentModelId);
  const currentProvider = useModelsStore((s) => s.currentProvider);
  const switchModel = useModelsStore((s) => s.switchModel);
  const load = useModelsStore((s) => s.load);
  const modelsConfig = useModelsStore((s) => s.modelsConfig);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => groupByProvider(models, modelsConfig), [models, modelsConfig]);

  const currentModel = models.find(
    (m) => m.id === currentModelId && m.provider === currentProvider
  );
  const currentLabel = currentModel?.name ?? currentModelId ?? '选择模型';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-outline-variant/40 bg-surface/80 text-body-dense font-medium"
        >
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[180px] truncate">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {models.length === 0 ? (
          <div className="px-3 py-4 text-center text-body-sm text-muted-foreground">
            暂无可用模型。请先在模型配置中添加供应商。
          </div>
        ) : (
          grouped.map((group, idx) => (
            <div key={group.provider}>
              {idx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {group.label}
              </DropdownMenuLabel>
              {group.models.map((m) => {
                const active = m.id === currentModelId && m.provider === currentProvider;
                return (
                  <DropdownMenuItem
                    key={`${m.provider}/${m.id}`}
                    onClick={() => switchModel(m.provider, m.id)}
                    className="gap-2"
                  >
                    <Check
                      className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-transparent')}
                    />
                    <span className={cn('truncate', active && 'font-medium text-primary')}>
                      {m.name}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ModelGroup {
  provider: string;
  label: string;
  models: PiModel[];
}

function groupByProvider(
  models: PiModel[],
  modelsConfig: { providers: Record<string, { name?: string }> }
): ModelGroup[] {
  const map = new Map<string, PiModel[]>();
  for (const m of models) {
    (map.get(m.provider) ?? map.set(m.provider, []).get(m.provider)!).push(m);
  }

  const groups: ModelGroup[] = [];
  for (const [provider, providerModels] of map) {
    const preset = getPresetByProviderId(provider);
    const label = preset?.name ?? modelsConfig.providers[provider]?.name ?? provider;
    groups.push({ provider, label, models: providerModels });
  }

  groups.sort((a, b) => a.label.localeCompare(b.label));
  return groups;
}
