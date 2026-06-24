import { Zap, Code2 } from 'lucide-react';

interface WelcomeProps {
  onQuickAction?: (action: string) => void;
}

const quickActions = [
  {
    id: 'architecture',
    icon: Zap,
    title: '架构方案',
    description: '使用 Rust 和 Axum 规划微服务后端…'
  },
  {
    id: 'code-fix',
    icon: Code2,
    title: '代码修复',
    description: '调试我的 React useEffect 无限循环…'
  }
];

export function Welcome({ onQuickAction }: WelcomeProps) {
  return (
    <div className="flex flex-col items-center px-window-padding py-xl">
      {/* 模型就绪标题 */}
      <div className="text-center">
        <h2 className="font-serif-title text-display font-medium tracking-tight text-on-surface">
          DeepSeek V3 已就绪
        </h2>
        <p className="mt-2 max-w-md text-body-lg text-olive">
          今天我能为您做些什么？我可以协助代码架构、写作或复杂推理任务。
        </p>
      </div>

      {/* 快捷操作卡片 */}
      <div className="mt-lg grid w-full max-w-2xl grid-cols-2 gap-md">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onQuickAction?.(action.id)}
              className="group flex flex-col gap-2 rounded-2xl border border-outline-variant/40 bg-ivory p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-ink-blue/30 hover:shadow-whisper active:translate-y-0 active:shadow-ring"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-container/60 transition-colors group-hover:bg-primary-container/60">
                <Icon className="h-4 w-4 text-on-secondary-container group-hover:text-on-primary-container" strokeWidth={2} />
              </div>
              <div>
                <p className="font-serif-title text-subsection font-medium text-on-surface">{action.title}</p>
                <p className="mt-0.5 text-caption text-stone">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
