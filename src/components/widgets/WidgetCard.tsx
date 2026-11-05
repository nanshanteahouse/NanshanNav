import { Suspense, Component, lazy, useState } from "react";
import type { ReactNode } from "react";
import type { WidgetConfig, WidgetType } from "@/types/widget";
import { WidgetShell } from "@/components/widgets/WidgetShell";
import { WidgetError } from "@/components/widgets/WidgetError";
import { WidgetSkeleton } from "@/components/widgets/WidgetSkeleton";
import { loadWidgetComponent } from "@/registry/loaders";
import { useDashboardStore } from "@/store/index";
import { useElementSize } from "@/hooks/useElementSize";

function createWidgetComponent(type: WidgetType) {
  return lazy(() =>
    loadWidgetComponent(type).then((mod) => ({
      default: mod.default as unknown as React.ComponentType<
        Record<string, unknown>
      >,
    })),
  );
}
const widgetComponentCache = Object.fromEntries(
  (
    [
      "title-header",
      "markdown-text",
      "web-link",
      "web-page",
      "pve-status",
      "search-box",
      "clock",
      "image",
    ] as WidgetType[]
  ).map((type) => [type, createWidgetComponent(type)]),
);

class ErrorBoundaryClass extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export interface WidgetCardProps {
  widget: WidgetConfig;
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const isEditMode = useDashboardStore((s) => s.editMode);
  const [retry, setRetry] = useState(() => ({
    attempt: 0,
    type: widget.type,
    Component: widgetComponentCache[widget.type],
  }));
  const [contentRef, size] = useElementSize<HTMLDivElement>();
  const WidgetComponent =
    retry.type === widget.type
      ? retry.Component
      : widgetComponentCache[widget.type];
  return (
    <WidgetShell widget={widget}>
      <div ref={contentRef} className="h-full w-full min-h-0">
        <ErrorBoundaryClass
          key={`${widget.type}:${retry.attempt}`}
          fallback={
            <WidgetError
              widgetId={widget.id}
              onRetry={() =>
                setRetry((value) => ({
                  attempt: value.attempt + 1,
                  type: widget.type,
                  Component: createWidgetComponent(widget.type),
                }))
              }
            />
          }
        >
          <Suspense fallback={<WidgetSkeleton />}>
            <WidgetComponent
              widgetId={widget.id}
              options={widget.options}
              isEditMode={isEditMode}
              width={size.width}
              height={size.height}
            />
          </Suspense>
        </ErrorBoundaryClass>
      </div>
    </WidgetShell>
  );
}
