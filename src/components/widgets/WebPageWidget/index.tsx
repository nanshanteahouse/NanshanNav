import type { WidgetComponentProps, WebPageOptions } from '@/types/widget.ts';

export default function WebPageWidget({ widgetId: _widgetId, options, isEditMode: _isEditMode, width: _width, height: _height }: WidgetComponentProps) {
  const opts = options as unknown as WebPageOptions;
  const url = opts.url?.trim() || '';

  if (!url) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-4 text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        <p className="text-sm italic">No URL configured. Click settings to set a URL.</p>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title="Web page widget"
      className="h-full w-full border-none"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      referrerPolicy="no-referrer"
    />
  );
}
