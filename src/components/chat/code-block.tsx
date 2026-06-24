import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language?: string;
  code: string;
  title?: string;
}

export function CodeBlock({ language, code, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-code border border-outline-variant/40 bg-ivory">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low px-3 py-1.5">
        <span className="font-mono text-label-sm text-on-surface-variant">
          {title || language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-label-sm text-muted-foreground transition-colors hover:bg-accent hover:text-on-surface"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> 已复制
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> 复制
            </>
          )}
        </button>
      </div>
      {/* 代码内容 */}
      <pre className="overflow-x-auto p-3 text-label-md leading-relaxed">
        <code className={cn('font-mono', language && `language-${language}`)}>{code}</code>
      </pre>
    </div>
  );
}
