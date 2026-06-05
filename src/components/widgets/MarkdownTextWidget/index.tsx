import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { WidgetComponentProps, MarkdownTextOptions } from '@/types/widget.ts';

/**
 * Sanitizes URLs to prevent XSS via javascript:, vbscript:, and data: schemes.
 * Returns empty string for dangerous URLs, original URL otherwise.
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:')
  ) {
    return '';
  }
  return url;
}

export default function MarkdownTextWidget({ widgetId: _widgetId, options, isEditMode: _isEditMode, width: _width, height: _height }: WidgetComponentProps) {
  const opts = options as unknown as MarkdownTextOptions;
  const hasContent = opts.content && opts.content.trim().length > 0;

  if (!hasContent) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-4 text-center"
        style={{ color: 'var(--text-muted)' }}
        data-widget-type="markdown-text"
      >
        <p className="text-sm italic">Empty markdown. Click settings to edit.</p>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full overflow-auto p-4"
      data-widget-type="markdown-text"
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      <div
        className="prose prose-sm max-w-none"
        style={{
          color: 'var(--text-primary)',
          lineHeight: '1.7',
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={sanitizeUrl}
        >
          {opts.content}
        </ReactMarkdown>
      </div>
      <style>{`
        .prose > *:first-child { margin-top: 0; }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: var(--text-primary);
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .prose h1 { font-size: 1.5em; }
        .prose h2 { font-size: 1.3em; border-bottom: 1px solid var(--border-default); padding-bottom: 0.3em; }
        .prose h3 { font-size: 1.15em; }
        .prose p { margin-bottom: 0.8em; color: var(--text-primary); }
        .prose a { color: var(--text-accent); text-decoration: underline; }
        .prose a:hover { opacity: 0.8; }
        .prose code {
          background-color: var(--bg-input);
          color: var(--text-primary);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          border: 1px solid var(--border-default);
        }
        .prose pre {
          background-color: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 1em;
          overflow-x: auto;
        }
        .prose pre code {
          background: none;
          border: none;
          padding: 0;
        }
        .prose blockquote {
          border-left: 3px solid var(--accent-primary);
          padding-left: 1em;
          margin-left: 0;
          color: var(--text-secondary);
        }
        .prose ul, .prose ol {
          padding-left: 1.5em;
          color: var(--text-primary);
        }
        .prose li { margin-bottom: 0.3em; }
        .prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .prose th, .prose td {
          border: 1px solid var(--border-default);
          padding: 0.5em 0.8em;
          text-align: left;
        }
        .prose th {
          background-color: var(--bg-input);
          font-weight: 600;
        }
        .prose hr {
          border: none;
          border-top: 1px solid var(--border-default);
          margin: 1.5em 0;
        }
        .prose strong { color: var(--text-primary); }
        .prose del { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
