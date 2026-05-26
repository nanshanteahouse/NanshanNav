import { useState, useEffect } from 'react';

export function useCurrentTime(showSeconds: boolean): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const msToNextSecond = 1000 - Date.now() % 1000;

    const timeout = setTimeout(() => {
      setNow(new Date());

      if (!showSeconds) {
        return;
      }

      const interval = setInterval(() => {
        setNow(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }, msToNextSecond);

    return () => clearTimeout(timeout);
  }, [showSeconds]);

  useEffect(() => {
    if (showSeconds) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [showSeconds]);

  return now;
}
