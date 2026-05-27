import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Use onMouseDown instead of onClick to avoid closing when the user
  // drags a text selection outside the modal boundary.
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === overlayRef.current) onClose();
  };

  // Prevent mouse events from bubbling to document-level listeners
  // (e.g. react-grid-layout's drag system) to avoid dragging
  // underlying widgets during text selection inside the modal.
  const blockPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={handleOverlayMouseDown}
      onMouseMove={blockPropagation}
      onMouseUp={blockPropagation}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-lg p-8 shadow-lg modal-body"
        style={{
          backgroundColor: 'var(--bg-widget)',
          border: '1px solid var(--border-default)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {title ?? ''}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
