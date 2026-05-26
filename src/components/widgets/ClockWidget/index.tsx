import { useMemo } from 'react';
import type { WidgetComponentProps, ClockOptions } from '@/types/widget.ts';
import { useCurrentTime } from './useCurrentTime.ts';
import AnalogClock from './AnalogClock.tsx';
import DigitalClock from './DigitalClock.tsx';

export default function ClockWidget({ widgetId: _widgetId, options, isEditMode: _isEditMode, width, height }: WidgetComponentProps) {
  const opts = options as unknown as ClockOptions;
  const now = useCurrentTime(opts.showSeconds);

  const size = useMemo(() => Math.min(width, height), [width, height]);

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden p-2"
      data-widget-type="clock"
    >
      {opts.displayMode === 'analog' ? (
        <AnalogClock time={now} options={opts} size={Math.max(80, size - 16)} />
      ) : (
        <DigitalClock time={now} options={opts} />
      )}
    </div>
  );
}
