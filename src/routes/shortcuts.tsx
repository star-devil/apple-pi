import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/shortcuts')({
  component: ShortcutsPage
});

function ShortcutsPage() {
  return (
    <div className="flex h-full items-center justify-center p-window-padding">
      <div className="text-center">
        <h1 className="font-serif-title text-display font-medium text-on-surface">快捷键设置</h1>
        <p className="mt-2 text-body-lg text-olive">快捷键设置页面（待实现）</p>
      </div>
    </div>
  );
}
