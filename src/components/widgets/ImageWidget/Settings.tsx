import type { WidgetSettingsProps } from '@/types/widget.ts';
import { Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from './components/ImageUploader';

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

const SCALE_MODE_OPTIONS: { value: ImageOptions['scaleMode']; label: string; description: string }[] =
  [
    { value: 'contain', label: '适配卡片', description: '按比例缩放以适配卡片' },
    { value: 'cover', label: '填满裁剪', description: '填满区域并裁剪超出部分' },
    { value: 'fill', label: '拉伸填满', description: '拉伸以填满整个区域' },
    { value: 'original', label: '原图大小', description: '显示原始像素尺寸' },
  ];

const ALIGN_X_OPTIONS: { value: NonNullable<ImageOptions['alignX']>; label: string }[] = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
];

const ALIGN_Y_OPTIONS: { value: NonNullable<ImageOptions['alignY']>; label: string }[] = [
  { value: 'top', label: '顶部' },
  { value: 'center', label: '居中' },
  { value: 'bottom', label: '底部' },
];

const CLICK_ACTION_OPTIONS: {
  value: NonNullable<ImageOptions['onClick']>;
  label: string;
  description: string;
}[] = [
  { value: 'none', label: '无', description: '点击图片无反应' },
  { value: 'preview', label: '预览放大', description: '点击打开全尺寸预览' },
  { value: 'link', label: '打开链接', description: '点击跳转到指定 URL' },
];

export default function ImageSettings({
  widgetId: _widgetId,
  options,
  onChange,
  onDelete,
}: WidgetSettingsProps) {
  const opts = options as unknown as ImageOptions;

  const update = (patch: Partial<ImageOptions>) => {
    onChange({ ...opts, ...patch });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Image Source
        </span>
        <div className="flex gap-2">
          {(['url', 'upload'] as const).map((src) => (
            <label
              key={src}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.sourceType || 'url') === src
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                backgroundColor:
                  (opts.sourceType || 'url') === src
                    ? 'var(--bg-widget-hover)'
                    : 'transparent',
              }}
            >
              <input
                type="radio"
                name="sourceType"
                className="h-4 w-4"
                style={{ accentColor: 'var(--accent-primary)' }}
                checked={(opts.sourceType || 'url') === src}
                onChange={() => update({ sourceType: src })}
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {src === 'url' ? 'URL' : 'Upload'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {opts.sourceType !== 'upload' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Image URL
          </span>
          <input
            type="text"
            className="rounded-md border px-4 py-2.5 text-sm"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            placeholder="https://example.com/image.jpg"
            value={opts.url || ''}
            onChange={(e) => update({ url: e.target.value })}
          />
        </label>
      )}

      {opts.sourceType === 'upload' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Upload Image
          </span>
          <ImageUploader
            value={opts.url || ''}
            onChange={(url) => update({ url })}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Scale Mode
        </span>
        <div className="flex flex-col gap-1.5">
          {SCALE_MODE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.scaleMode || 'contain') === opt.value
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                backgroundColor:
                  (opts.scaleMode || 'contain') === opt.value
                    ? 'var(--bg-widget-hover)'
                    : 'transparent',
              }}
            >
              <input
                type="radio"
                name="scaleMode"
                className="mt-0.5 h-4 w-4"
                style={{ accentColor: 'var(--accent-primary)' }}
                checked={(opts.scaleMode || 'contain') === opt.value}
                onChange={() => update({ scaleMode: opt.value })}
              />
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {opt.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {opt.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Alignment X
        </span>
        <div className="flex gap-2">
          {ALIGN_X_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.alignX || 'center') === opt.value
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                backgroundColor:
                  (opts.alignX || 'center') === opt.value
                    ? 'var(--bg-widget-hover)'
                    : 'transparent',
              }}
            >
              <input
                type="radio"
                name="alignX"
                className="h-4 w-4"
                style={{ accentColor: 'var(--accent-primary)' }}
                checked={(opts.alignX || 'center') === opt.value}
                onChange={() => update({ alignX: opt.value })}
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Alignment Y
        </span>
        <div className="flex gap-2">
          {ALIGN_Y_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.alignY || 'center') === opt.value
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                backgroundColor:
                  (opts.alignY || 'center') === opt.value
                    ? 'var(--bg-widget-hover)'
                    : 'transparent',
              }}
            >
              <input
                type="radio"
                name="alignY"
                className="h-4 w-4"
                style={{ accentColor: 'var(--accent-primary)' }}
                checked={(opts.alignY || 'center') === opt.value}
                onChange={() => update({ alignY: opt.value })}
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Border Radius: {opts.borderRadius ?? 0}px
        </span>
        <Slider
          value={opts.borderRadius ?? 0}
          min={0}
          max={24}
          step={1}
          onChange={(value) => update({ borderRadius: value })}
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Shadow
        </span>
        <Switch
          checked={opts.shadow ?? false}
          onCheckedChange={(checked) => update({ shadow: checked })}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Caption
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          placeholder="Image caption"
          value={opts.caption || ''}
          onChange={(e) => update({ caption: e.target.value })}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Click Action
        </span>
        <div className="flex flex-col gap-1.5">
          {CLICK_ACTION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              style={{
                borderColor:
                  (opts.onClick || 'none') === opt.value
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                backgroundColor:
                  (opts.onClick || 'none') === opt.value
                    ? 'var(--bg-widget-hover)'
                    : 'transparent',
              }}
            >
              <input
                type="radio"
                name="onClick"
                className="mt-0.5 h-4 w-4"
                style={{ accentColor: 'var(--accent-primary)' }}
                checked={(opts.onClick || 'none') === opt.value}
                onChange={() => update({ onClick: opt.value })}
              />
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {opt.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {opt.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {opts.onClick === 'link' && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Link URL
            </span>
            <input
              type="text"
              className="rounded-md border px-4 py-2.5 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              placeholder="https://example.com"
              value={opts.linkUrl || ''}
              onChange={(e) => update({ linkUrl: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              style={{ accentColor: 'var(--accent-primary)' }}
              checked={opts.openInNewTab ?? false}
              onChange={(e) => update({ openInNewTab: e.target.checked })}
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Open in new tab
            </span>
          </label>
        </>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Alt Text
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          placeholder="Descriptive text for accessibility"
          value={opts.altText || ''}
          onChange={(e) => update({ altText: e.target.value })}
        />
      </label>

      <div className="mt-2 border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--status-offline)',
            color: '#fff',
          }}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete Widget
        </button>
      </div>
    </div>
  );
}
