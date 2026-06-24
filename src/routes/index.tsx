import { createFileRoute } from '@tanstack/react-router';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Welcome } from '@/components/chat/welcome';
import { MessageBubble, type ChatMessage } from '@/components/chat/message-bubble';
import { InputBar } from '@/components/chat/input-bar';

export const Route = createFileRoute('/')({
  component: ChatPage
});

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content:
      '请帮我为一个新的 Tauri 桌面应用规划架构。它需要一个高性能的 Rust 后端和一个带有玻璃拟态效果的极简 React 前端。',
    timestamp: '上午 10:42'
  },
  {
    id: '2',
    role: 'agent',
    content: `当然可以。构建一个拥有高性能 Rust 后端搭配 React 前端的 Tauri 应用是一种强大的组合。以下是一个专注于性能和现代 macOS 美学的建议架构方案：

## 架构提案

\`\`\`markdown
1. 状态管理：使用 Zustand 管理本地 UI 状态，通过 Tauri 的 invoke 桥接 Rust。
2. 样式设计：使用 Tailwind CSS 自定义配置，实现 macOS 原生模糊效果和 Inter 字体。
3. 后端实现：在 Rust 中使用 tokio 进行异步操作的命令处理器。
\`\`\`

关于玻璃拟态效果，您需要利用 Tauri 的窗口 vibrancy 插件。需要我为您生成一个 \`main.rs\` 启动模板吗？`,
    timestamp: '上午 10:42'
  }
];

function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      {/* 消息区域 */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-[800px] py-window-padding">
          {/* 欢迎区 */}
          <Welcome />

          {/* 消息列表 */}
          <div className="flex flex-col gap-lg pt-lg">
            {mockMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* 底部输入栏 */}
      <div className="shrink-0">
        <div className="mx-auto max-w-[800px]">
          <InputBar />
        </div>
      </div>
    </div>
  );
}
