import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { WidgetSettingsProps, MarkdownTextOptions } from '@/types/widget.ts';
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

export default function MarkdownTextSettings({ widgetId: _widgetId, options, onChange }: WidgetSettingsProps) {
  const opts = options as unknown as MarkdownTextOptions;
  const [content, setContent] = useState(() => opts.content);
  const [contentKey, setContentKey] = useState(() => opts.content);
  const [showPreview, setShowPreview] = useState(false);

  if (opts.content !== contentKey) {
    setContentKey(opts.content);
    setContent(opts.content);
  }

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    onChange({ ...opts, content: value });
  }, [opts, onChange]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Content
        </span>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={showPreview}
            onChange={(e) => setShowPreview(e.target.checked)}
          />
          Preview
        </label>
      </div>

      {showPreview ? (
        <div
          className="min-h-[150px] rounded-md border p-4 text-sm"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {content.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={sanitizeUrl}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Nothing to preview.</span>
          )}
        </div>
      ) : (
        <textarea
          className="w-full resize-y rounded-md border px-4 py-2.5 font-mono text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            minHeight: '150px',
          }}
          rows={8}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Write your markdown here..."
        />
      )}
    </div>
  );
}
