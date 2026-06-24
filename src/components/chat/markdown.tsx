import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { CodeBlock } from './code-block';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-sm max-w-none text-body-md leading-relaxed text-on-surface-variant">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            const lang = match ? match[1] : undefined;

            // 多行代码使用 CodeBlock 组件
            if (code.includes('\n') || lang) {
              return <CodeBlock language={lang} code={code} />;
            }
            // 行内代码
            return (
              <code
                className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[0.85em] text-primary-container"
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ children, ...props }) {
            return (
              <a
                className="font-medium text-primary underline underline-offset-2 hover:text-primary-container"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-2 border-l-2 border-ink-blue pl-3 italic text-olive">
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            return <h1 className="font-serif-title mb-2 mt-3 text-section font-medium text-on-surface">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="font-serif-title mb-2 mt-3 text-subsection font-medium text-on-surface">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="font-serif-title mb-1 mt-2 text-item font-medium text-on-surface">{children}</h3>;
          },
          p({ children }) {
            return <p className="my-2 leading-relaxed">{children}</p>;
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto">
                <table className="w-full border-collapse text-body-md">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-outline-variant/40 px-3 py-1.5 text-left font-semibold text-on-surface">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="border-b border-outline-variant/30 px-3 py-1.5">{children}</td>;
          },
          hr() {
            return <hr className="my-3 border-outline-variant/40" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
