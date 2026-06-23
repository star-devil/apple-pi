import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: ChatPage
});

function ChatPage() {
  return (
    <div className="flex h-full items-center justify-center p-window-padding">
      <div className="text-center">
        <h1 className="text-headline-lg font-semibold text-on-surface">聊天界面</h1>
        <p className="mt-2 text-body-md text-muted-foreground">主聊天界面页面（待实现）</p>
      </div>
    </div>
  );
}
