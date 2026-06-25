import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useModelsStore } from '@/store/models';
import { cn } from '@/lib/utils';
import type { PiModel } from '@/lib/types';

interface ModelGridProps {
  providerId: string;
}

export function ModelGrid({ providerId }: ModelGridProps) {
  const getModelsForProvider = useModelsStore((s) => s.getModelsForProvider);
  const currentModelId = useModelsStore((s) => s.currentModelId);
  const currentProvider = useModelsStore((s) => s.currentProvider);
  const loading = useModelsStore((s) => s.loading);
  const switchModel = useModelsStore((s) => s.switchModel);

  const models = getModelsForProvider(providerId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm font-medium text-on-surface">
          当前可用模型
          {models.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({models.length})
            </span>
          )}
        </h2>
      </div>

      {models.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant/40 px-4 py-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> 加载中…
              </span>
            ) : (
              '暂无可用模型。请先保存配置并确保密钥有效。'
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {models.map((m) => (
            <ModelItem
              key={`${m.provider}/${m.id}`}
              model={m}
              active={m.id === currentModelId && m.provider === currentProvider}
              loading={loading}
              onClick={() => switchModel(m.provider, m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModelItem({
  model,
  active,
  loading,
  onClick,
}: {
  model: PiModel;
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
          <span className="truncate text-body-md font-medium text-on-surface">{model.name}</span>
          {model.reasoning && (
            <Badge variant="secondary" className="shrink-0 text-xs">reasoning</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="font-mono">{model.id}</span>
          {model.contextWindow && (
            <span>{(model.contextWindow / 1000).toFixed(0)}k ctx</span>
          )}
          {model.cost && (model.cost.input > 0 || model.cost.output > 0) && (
            <span>
              ${model.cost.input.toFixed(2)}/${model.cost.output.toFixed(2)} per M
            </span>
          )}
        </div>
      </div>
      {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}
