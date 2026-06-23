import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';

const breadcrumbMap: Record<string, string> = {
  '/': '对话',
  '/models': '模型',
  '/mcp': 'MCP 配置',
  '/skills': '技能与工具',
  '/shortcuts': '快捷键'
};

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const breadcrumb = breadcrumbMap[pathname];

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <Outlet />
    </AppLayout>
  );
}
