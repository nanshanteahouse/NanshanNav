import { useState, useRef, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ImageUploaderProps {
  /** Current image URL from parent */
  value: string;
  /** Called when URL changes (manual input or upload complete) */
  onChange: (url: string) => void;
}

type UploadState = 'idle' | 'file-selected' | 'uploading' | 'success' | 'error';

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      setUploadState('error');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setUploadState('file-selected');

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
        // Reset input value to allow re-selecting the same file
        e.target.value = '';
      }
    },
    [handleFileSelect],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const data = (await response.json()) as { url: string };
      onChange(data.url);
      setUploadState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
      setUploadState('error');
    }
  }, [selectedFile, onChange]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadState('idle');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const openFilePicker = useCallback(() => {
    if (uploadState === 'uploading') return;
    fileInputRef.current?.click();
  }, [uploadState]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        className="rounded-md border px-4 py-2.5 text-sm"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-primary)',
        }}
        placeholder="Enter image URL or upload..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-default)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          OR
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-default)' }} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer"
        style={{
          borderColor:
            uploadState === 'success'
              ? 'var(--status-online)'
              : isDragging
                ? 'var(--accent-primary)'
                : 'var(--border-default)',
          backgroundColor: isDragging ? 'var(--bg-widget-hover)' : 'transparent',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFilePicker}
      >
        {uploadState === 'success' ? (
          <>
            <CheckCircle className="h-8 w-8" style={{ color: 'var(--status-online)' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Upload successful!
            </span>
            <button
              type="button"
              className="text-xs underline cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Upload another
            </button>
          </>
        ) : uploadState === 'error' && !selectedFile ? (
          <>
            <AlertCircle className="h-8 w-8" style={{ color: 'var(--status-offline)' }} />
            <span className="text-sm" style={{ color: 'var(--status-offline)' }}>
              {errorMessage || 'An error occurred'}
            </span>
            <button
              type="button"
              className="text-xs underline cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Supports: JPG, PNG, GIF, WebP, SVG
            </span>
          </>
        )}
      </div>

      {uploadState === 'file-selected' && selectedFile && previewUrl && (
        <div
          className="flex items-center gap-3 rounded-md border p-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="h-14 w-14 rounded object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {selectedFile.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
          >
            Upload to Server
          </Button>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div
          className="flex items-center justify-center gap-2 rounded-md border p-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Uploading...
          </span>
        </div>
      )}

      {uploadState === 'error' && selectedFile && (
        <div
          className="flex items-center gap-2 rounded-md border p-3"
          style={{
            borderColor: 'var(--status-offline)',
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--status-offline)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ color: 'var(--status-offline)' }}>
              {errorMessage || 'Upload failed'}
            </p>
          </div>
          <button
            type="button"
            className="text-xs underline cursor-pointer shrink-0"
            style={{ color: 'var(--text-muted)' }}
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
