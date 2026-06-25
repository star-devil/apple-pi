import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProviderView } from '@/store/models';

interface ProviderListProps {
  views: ProviderView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddCustom: () => void;
}

export function ProviderList({ views, selectedId, onSelect, onAddCustom }: ProviderListProps) {
  const presetViews = views.filter((v) => v.isPreset);
  const customViews = views.filter((v) => !v.isPreset);

  return (
    <div className="flex h-full flex-col border-r border-outline-variant/30 bg-surface-container-lowest/50">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-headline-sm font-medium text-on-surface">供应商</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2">
          <SectionLabel>预置</SectionLabel>
          {presetViews.map((v) => (
            <ProviderItem
              key={v.id}
              view={v}
              active={v.id === selectedId}
              onClick={() => onSelect(v.id)}
            />
          ))}

          <SectionLabel className="mt-4">自定义</SectionLabel>
          {customViews.map((v) => (
            <ProviderItem
              key={v.id}
              view={v}
              active={v.id === selectedId}
              onClick={() => onSelect(v.id)}
            />
          ))}
          {customViews.length === 0 && (
            <p className="px-3 py-1 text-xs text-muted-foreground">暂无自定义供应商</p>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground"
            onClick={onAddCustom}
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> 添加供应商
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70', className)}>
      {children}
    </div>
  );
}

function ProviderItem({
  view,
  active,
  onClick,
}: {
  view: ProviderView;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors',
        active
          ? 'bg-primary/10 text-on-surface'
          : 'hover:bg-surface-container-low text-on-surface-variant'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body-md font-medium">{view.name}</span>
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              view.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            title={view.enabled ? '已启用' : '未启用'}
          />
        </div>
        {view.description && (
          <p className="truncate text-xs text-muted-foreground">{view.description}</p>
        )}
      </div>
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}
