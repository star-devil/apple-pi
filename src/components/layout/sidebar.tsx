import { Link, useRouterState } from '@tanstack/react-router';
import {
  Plus,
  MessageSquare,
  Bot,
  TerminalSquare,
  Blocks,
  Keyboard,
  Settings,
  History,
  type LucideIcon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

const navItems: NavItem[] = [
  { label: '对话', icon: MessageSquare, to: '/' },
  { label: '模型', icon: Bot, to: '/models' },
  { label: 'MCP 配置', icon: TerminalSquare, to: '/mcp' },
  { label: '技能与工具', icon: Blocks, to: '/skills' },
  { label: '快捷键', icon: Keyboard, to: '/shortcuts' }
];

const recentConversations = [
  '项目讨论记录',
  'Rust 后端调试',
  '架构方案设计'
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-sidebar-width shrink-0 flex-col border-r border-outline-variant/40 bg-surface-container-low/60 glass">
      {/* 品牌区 */}
      <div className="flex items-center gap-3 px-window-padding pt-window-padding pb-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
          <Bot className="h-5 w-5 text-on-primary-container" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="text-body-md font-semibold text-on-surface">ChatShell</span>
          <span className="text-label-sm text-muted-foreground">DeepSeek v3</span>
        </div>
      </div>

      {/* 状态徽章 */}
      <div className="px-window-padding pb-md">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container/60 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-label-sm font-medium text-on-secondary-container">专业智能体已激活</span>
        </div>
      </div>

      {/* 新建对话按钮 */}
      <div className="px-window-padding pb-md">
        <Button variant="default" className="w-full justify-start gap-2" size="default">
          <Plus className="h-4 w-4" />
          新建对话
        </Button>
      </div>

      {/* 导航菜单 */}
      <nav className="px-md">
        {navItems.map((item) => {
          const isActive = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body-md transition-colors',
                isActive
                  ? 'bg-secondary-container/70 font-medium text-on-surface'
                  : 'text-on-surface-variant hover:bg-accent/50 hover:text-on-surface'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 历史记录区 */}
      <div className="mt-lg flex-1 overflow-hidden px-md">
        <div className="flex items-center gap-2 px-3 pb-sm">
          <History className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
            历史记录
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {recentConversations.map((conv) => (
            <button
              key={conv}
              className="flex items-center rounded-lg px-3 py-1.5 text-body-md text-on-surface-variant transition-colors hover:bg-accent/50 hover:text-on-surface"
            >
              <span className="truncate">{conv}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-0" />

      {/* 底部账户区 */}
      <div className="flex items-center gap-3 px-window-padding py-md">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary-container text-label-sm">AR</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col">
          <span className="text-label-md font-medium text-on-surface">Alex Rivera</span>
          <span className="text-label-sm text-muted-foreground">专业版账户</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </aside>
  );
}
