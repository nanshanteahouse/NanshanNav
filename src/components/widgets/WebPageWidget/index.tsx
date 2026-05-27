import { ExternalLink } from 'lucide-react';
import type { WidgetComponentProps, WebPageOptions, WebPageDisplayMode } from '@/types/widget.ts';

const IMAGE_EXTENSIONS = /\.(svg|png|jpg|jpeg|gif|webp|bmp|ico)(\?.*)?$/i;

function detectDisplayMode(url: string): 'iframe' | 'image' {
  if (IMAGE_EXTENSIONS.test(url)) return 'image';
  return 'iframe';
}

function resolveDisplayMode(mode: WebPageDisplayMode, url: string): 'iframe' | 'image' {
  if (mode === 'auto') return detectDisplayMode(url);
  return mode;
}

export default function WebPageWidget({ widgetId: _widgetId, options, isEditMode, width: _width, height: _height }: WidgetComponentProps) {
  const opts = options as unknown as WebPageOptions;
  const url = opts.url?.trim() || '';
  const displayMode = resolveDisplayMode(opts.displayMode || 'auto', url);

  if (!url) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-4 text-center"
        style={{ color: 'var(--text-muted)' }}
        data-widget-type="web-page"
      >
        <p className="text-sm italic">No URL configured. Click settings to set a URL.</p>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${displayMode === 'image' && opts.imageAlign === 'center' && opts.imageSize === 'original' ? 'flex items-center justify-center' : ''}`}
      data-widget-type="web-page"
    >
      {!isEditMode && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-md transition-opacity opacity-0 hover:opacity-100"
          style={{
            backgroundColor: 'var(--bg-widget-hover)',
            border: '1px solid var(--border-default)',
          }}
          title="Open in new tab"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
        </a>
      )}

      {displayMode === 'image' ? (
        <img
          src={url}
          alt="Web page widget"
          className={
            opts.imageSize === 'original'
              ? 'max-w-full max-h-full p-2'
              : 'h-full w-full object-contain p-2'
          }
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('[data-fallback]')) {
              const fallback = document.createElement('div');
              fallback.setAttribute('data-fallback', 'true');
              fallback.className = 'flex h-full w-full items-center justify-center gap-2';
              fallback.style.color = 'var(--text-muted)';
              fallback.innerHTML = '<span class="text-sm italic">Failed to load image</span>';
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <iframe
          src={url}
          title="Web page widget"
          className="h-full w-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
