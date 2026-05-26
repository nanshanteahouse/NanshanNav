import { useMemo } from 'react';
import type { ClockOptions } from '@/types/widget.ts';

interface DigitalClockProps {
  time: Date;
  options: ClockOptions;
}

export default function DigitalClock({ time, options }: DigitalClockProps) {
  const formatted = useMemo(() => {
    const timeStr = new Intl.DateTimeFormat(options.timezone === 'Asia/Shanghai' ? 'zh-CN' : 'en-US', {
      timeZone: options.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: options.showSeconds ? '2-digit' : undefined,
      hour12: !options.is24Hour,
    }).format(time);

    let dateStr = '';
    if (options.showDate) {
      const weekDay = new Intl.DateTimeFormat('en-US', {
        timeZone: options.timezone,
        weekday: 'long',
      }).format(time);
      const yyyymmdd = new Intl.DateTimeFormat('en-CA', {
        timeZone: options.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(time);

      dateStr = `${yyyymmdd} ${weekDay}`;
    }

    return { timeStr, dateStr };
  }, [time, options]);

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <span
        className="font-mono leading-none tracking-tight"
        style={{
          fontSize: 'clamp(1.2rem, 8cqw, 3rem)',
          color: 'var(--text-primary)',
          fontWeight: 700,
        }}
      >
        {formatted.timeStr}
      </span>
      {options.showDate && (
        <span
          className="leading-none"
          style={{
            fontSize: 'clamp(0.6rem, 3cqw, 1.1rem)',
            color: 'var(--text-secondary)',
          }}
        >
          {formatted.dateStr}
        </span>
      )}
    </div>
  );
}
