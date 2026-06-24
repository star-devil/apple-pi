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
    <aside className="flex h-full w-sidebar-width shrink-0 flex-col border-r border-outline-variant/40 bg-ivory/70 glass">
      {/* 品牌区 */}
      <div className="flex items-center gap-3 px-window-padding pt-window-padding pb-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-blue">
          <Bot className="h-5 w-5 text-ivory" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="font-serif-title text-item font-medium text-on-surface">ChatShell</span>
          <span className="text-label-sm text-olive">DeepSeek v3</span>
        </div>
      </div>

      {/* 状态徽章 */}
      <div className="px-window-padding pb-md">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-tag-tint-2 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-blue" />
          <span className="text-label-sm font-medium text-ink-blue">专业智能体已激活</span>
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
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body transition-all duration-150',
                isActive
                  ? 'bg-[hsl(var(--ink-blue)/0.08)] font-medium text-ink-blue'
                  : 'text-stone hover:bg-[hsl(var(--ink-blue)/0.05)] hover:text-on-surface active:bg-[hsl(var(--ink-blue)/0.08)]'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-ink-blue" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-ink-blue' : 'text-stone group-hover:text-on-surface'
                )}
                strokeWidth={2}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 历史记录区 */}
      <div className="mt-lg flex-1 overflow-hidden px-md">
        <div className="flex items-center gap-2 px-3 pb-sm">
          <History className="h-3.5 w-3.5 text-stone" strokeWidth={2} />
          <span className="text-label-sm font-semibold uppercase tracking-wider text-stone">
            历史记录
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {recentConversations.map((conv) => (
            <button
              key={conv}
              className="flex items-center rounded-lg px-3 py-1.5 text-body text-stone transition-all duration-150 hover:bg-[hsl(var(--ink-blue)/0.05)] hover:text-on-surface active:bg-[hsl(var(--ink-blue)/0.08)]"
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
          <AvatarFallback className="bg-warm-sand text-label-sm text-on-surface">AR</AvatarFallback>
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
