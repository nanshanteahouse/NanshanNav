import { useState, useEffect } from 'react';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const weekday = time.toLocaleDateString('zh-CN', { weekday: 'short' });

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      <span>{timeStr}</span>
      <span>{weekday}</span>
    </div>
  );
}
