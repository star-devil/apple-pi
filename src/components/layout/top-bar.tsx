import { Search, RefreshCw, Sun, MoreVertical, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface TopBarProps {
  breadcrumb?: string;
}

export function TopBar({ breadcrumb }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-md border-b border-outline-variant/40 bg-ivory/70 px-window-padding glass">
      {/* 面包屑 */}
      {breadcrumb && (
        <div className="flex items-center gap-2 text-body">
          <span className="text-stone">ChatShell</span>
          <span className="text-stone">/</span>
          <span className="font-medium text-on-surface">{breadcrumb}</span>
        </div>
      )}

      {/* 搜索框 */}
      <div className="relative ml-auto w-64">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone" strokeWidth={2} />
        <Input
          placeholder="搜索…"
          className="h-8 border-transparent bg-surface-container-high/50 pl-9 text-body-dense placeholder:text-stone"
        />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* 工具栏按钮 */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-ink-blue" title="同步">
          <RefreshCw className="h-4 w-4" strokeWidth={2} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-ink-blue" title="通知">
          <Bell className="h-4 w-4" strokeWidth={2} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-ink-blue" title="切换主题">
          <Sun className="h-4 w-4" strokeWidth={2} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-ink-blue" title="更多选项">
          <MoreVertical className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </header>
  );
}
