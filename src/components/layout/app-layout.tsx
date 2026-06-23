import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

interface AppLayoutProps {
  breadcrumb?: string;
  children?: ReactNode;
}

export function AppLayout({ breadcrumb, children }: AppLayoutProps) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar breadcrumb={breadcrumb} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
