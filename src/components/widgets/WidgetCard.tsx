import { Suspense, Component, lazy } from 'react';
import type { ReactNode } from 'react';
import type { WidgetConfig, WidgetType } from '@/types/widget';
import { WidgetShell } from '@/components/widgets/WidgetShell';
import { WidgetError } from '@/components/widgets/WidgetError';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import { loadWidgetComponent } from '@/registry/loaders';
import { useDashboardStore } from '@/store/index';

const WIDGET_TYPE_VALUES: WidgetType[] = ['title-header', 'markdown-text', 'web-link', 'web-page', 'pve-status', 'search-box', 'clock'];

const widgetComponentCache: Record<string, React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>> = Object.fromEntries(
  WIDGET_TYPE_VALUES.map((type) => [
    type,
    lazy(() =>
      loadWidgetComponent(type).then((mod) => ({
        default: mod.default as unknown as React.ComponentType<Record<string, unknown>>,
      })),
    ),
  ]),
);

class ErrorBoundaryClass extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export interface WidgetCardProps {
  widget: WidgetConfig;
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const isEditMode = useDashboardStore((s) => s.editMode);
  const WidgetComponent = widgetComponentCache[widget.type];

  return (
    <WidgetShell widget={widget}>
      <ErrorBoundaryClass fallback={<WidgetError widgetId={widget.id} />}>
        <Suspense fallback={<WidgetSkeleton />}>
          {WidgetComponent ? (
            <WidgetComponent
              widgetId={widget.id}
              options={widget.options}
              isEditMode={isEditMode}
              width={0}
              height={0}
            />
          ) : (
            <WidgetError widgetId={widget.id} />
          )}
        </Suspense>
      </ErrorBoundaryClass>
    </WidgetShell>
  );
}
