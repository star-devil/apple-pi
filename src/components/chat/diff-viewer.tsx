import { useMemo } from 'react';
import type { Extension } from '@codemirror/state';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { unifiedMergeView } from '@codemirror/merge';
import { javascript } from '@codemirror/lang-javascript';
import { rust } from '@codemirror/lang-rust';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

export type DiffLanguage = 'javascript' | 'rust' | 'python' | 'json' | 'text';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  language?: DiffLanguage;
  title?: string;
}

function getLanguageExtension(lang: DiffLanguage): Extension[] {
  switch (lang) {
    case 'javascript':
      return [javascript()];
    case 'rust':
      return [rust()];
    case 'python':
      return [python()];
    case 'json':
      return [json()];
    default:
      return [];
  }
}

const baseTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    backgroundColor: 'transparent'
  },
  '.cm-scroller': {
    fontFamily: 'JetBrains Mono, monospace'
  },
  '.cm-gutters': {
    borderRight: '1px solid var(--outline-variant)',
    backgroundColor: 'transparent'
  }
});

export function DiffViewer({ oldCode, newCode, language = 'text', title }: DiffViewerProps) {
  const extensions = useMemo(() => {
    const langExt = getLanguageExtension(language);
    return [
      ...langExt,
      oneDark,
      baseTheme,
      EditorView.lineWrapping,
      unifiedMergeView({
        original: oldCode,
        mergeControls: true
      })
    ];
  }, [oldCode, language]);

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-lowest">
      {title && (
        <div className="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container-low px-3 py-1.5">
          <span className="font-mono text-label-sm text-on-surface-variant">{title}</span>
          <span className="rounded-full bg-primary-container/60 px-2 py-0.5 text-label-sm text-on-primary-container">
            差异对比
          </span>
        </div>
      )}
      <CodeMirror
        value={newCode}
        extensions={extensions}
        editable={false}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          foldGutter: false
        }}
        style={{ backgroundColor: 'transparent' }}
      />
    </div>
  );
}
