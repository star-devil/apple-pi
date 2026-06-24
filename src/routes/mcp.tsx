import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/mcp')({
  component: McpPage
});

function McpPage() {
  return (
    <div className="flex h-full items-center justify-center p-window-padding">
      <div className="text-center">
        <h1 className="font-serif-title text-display font-medium text-on-surface">MCP 配置</h1>
        <p className="mt-2 text-body-lg text-olive">MCP 配置页面（待实现）</p>
      </div>
    </div>
  );
}
