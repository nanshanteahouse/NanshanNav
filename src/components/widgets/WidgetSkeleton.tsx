function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function WidgetSkeleton() {
  return (
    <div
      className={cn(
        'w-full h-full min-h-[80px] rounded-[var(--radius-default)]',
        'bg-[var(--bg-input)] animate-pulse',
      )}
      style={{
        background: `linear-gradient(110deg, var(--bg-input) 30%, var(--bg-widget-hover) 50%, var(--bg-input) 70%)`,
        backgroundSize: '200% 100%',
      }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-widget)] opacity-50" />
      </div>
    </div>
  );
}
