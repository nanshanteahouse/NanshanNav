import { useState } from 'react';
import type { WidgetComponentProps } from '@/types/widget.ts';
import { Modal } from '@/components/ui/modal';
import { normalizeUrl } from '@/lib/utils/url.ts';

// ── Local options type (not yet in @/types/widget) ──

interface ImageOptions {
  sourceType?: 'url' | 'upload';
  url?: string;
  imageData?: string;
  scaleMode?: 'contain' | 'cover' | 'fill' | 'original';
  alignX?: 'left' | 'center' | 'right';
  alignY?: 'top' | 'center' | 'bottom';
  borderRadius?: number;
  shadow?: boolean;
  caption?: string;
  onClick?: 'none' | 'link' | 'preview';
  linkUrl?: string;
  openInNewTab?: boolean;
  altText?: string;
}

const justifyMap: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

const alignMap: Record<string, string> = {
  top: 'items-start',
  center: 'items-center',
  bottom: 'items-end',
};

const objectFitMap: Record<string, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  original: 'object-none',
};

export default function ImageWidget({
  widgetId: _widgetId,
  options,
  isEditMode,
  width: _width,
  height: _height,
}: WidgetComponentProps) {
  const opts = options as unknown as ImageOptions;
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Determine image source
  const src =
    opts.sourceType === 'upload' && opts.imageData ? opts.imageData : opts.url || '';
  const hasImage = !!src;

  if (!hasImage) {
    if (isEditMode) {
      return (
        <div
          className="flex h-full w-full items-center justify-center p-4 text-center"
          style={{ color: 'var(--text-muted)' }}
          data-widget-type="image"
        >
          <p className="text-sm italic">Click settings to add an image</p>
        </div>
      );
    }
    return null;
  }

  if (loadError) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-4 text-center"
        style={{ color: 'var(--text-muted)' }}
        data-widget-type="image"
      >
        <p className="text-sm italic">Failed to load image</p>
      </div>
    );
  }

  const scaleMode = opts.scaleMode || 'contain';
  const alignX = opts.alignX || 'center';
  const alignY = opts.alignY || 'center';
  const isOriginal = scaleMode === 'original';

  const imgElement = (
    <div className={`flex h-full w-full ${justifyMap[alignX]} ${alignMap[alignY]}`}>
      <img
        src={src}
        alt={opts.altText || ''}
        className={[
          isOriginal ? 'max-w-none max-h-none' : 'w-full h-full',
          objectFitMap[scaleMode],
          'transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          opts.onClick === 'preview' ? 'cursor-pointer' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          borderRadius: opts.borderRadius ? `${opts.borderRadius}px` : undefined,
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoadError(true)}
        onClick={!isEditMode && opts.onClick === 'preview' ? () => setPreviewOpen(true) : undefined}
      />
    </div>
  );

  const wrappedContent =
    !isEditMode && opts.onClick === 'link' && opts.linkUrl ? (
      <a
        href={normalizeUrl(opts.linkUrl)}
        target={opts.openInNewTab ? '_blank' : undefined}
        rel={opts.openInNewTab ? 'noopener noreferrer' : undefined}
        className="block h-full w-full"
      >
        {imgElement}
      </a>
    ) : (
      imgElement
    );

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        boxShadow: opts.shadow ? 'var(--shadow-widget)' : undefined,
      }}
      data-widget-type="image"
    >
      {wrappedContent}

      {opts.caption && (
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-sm"
          style={{
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            color: '#fff',
          }}
        >
          {opts.caption}
        </div>
      )}

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <div className="flex items-center justify-center">
          <img
            src={src}
            alt={opts.altText || ''}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </Modal>
    </div>
  );
}
