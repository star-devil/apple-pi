import { useRef, useState } from 'react';
import { Paperclip, Send, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InputBar() {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setIsThinking(true);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setTimeout(() => setIsThinking(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-window-padding pb-window-padding">
      {/* 思考状态 */}
      {isThinking && (
        <div className="mb-2 flex items-center gap-2 px-2 text-label-md text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>思考中…</span>
        </div>
      )}

        {/* 输入框容器 */}
      <div className="flex items-end gap-2 rounded-xl border border-outline-variant/50 bg-ivory p-2 shadow-ring transition-colors focus-within:border-ink-blue/50">
        {/* 附件按钮 */}
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="添加附件">
          <Paperclip className="h-4 w-4" strokeWidth={2} />
        </Button>

        {/* 文本输入区 */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，⌘K 命令面板，⌘J 切换模型…"
          rows={1}
          className="flex-1 resize-none bg-transparent py-2 text-body text-on-surface placeholder:text-stone focus:outline-none"
          style={{ maxHeight: '160px' }}
        />

        {/* 模型标识 */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-warm-sand/60 px-2.5 py-1.5">
          <Zap className="h-3.5 w-3.5 text-ink-blue" strokeWidth={2} />
          <span className="text-label font-medium text-on-surface">DeepSeek v3</span>
        </div>

        {/* 发送按钮 */}
        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleSend}
          disabled={!input.trim()}
          title="发送"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>

      {/* 免责声明 */}
      <p className="mt-2 text-center text-label-sm text-muted-foreground">
        ChatShell 可能会出错，请核实重要信息。
      </p>
    </div>
  );
}
