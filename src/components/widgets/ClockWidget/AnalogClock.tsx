import { useMemo } from 'react';
import type { ClockOptions } from '@/types/widget.ts';

interface AnalogClockProps {
  time: Date;
  options: ClockOptions;
  size: number;
}

function polarToCartesian(centerX: number, centerY: number, angle: number, length: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: centerX + length * Math.cos(rad),
    y: centerY + length * Math.sin(rad),
  };
}

export default function AnalogClock({ time, options, size }: AnalogClockProps) {
  const center = size / 2;
  const radius = center - 4;
  const strokeWidth = Math.max(1.2, size / 50);

  const angles = useMemo(() => {
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const milliseconds = time.getMilliseconds();

    const secondAngle = ((seconds + milliseconds / 1000) / 60) * 360 - 90;
    const minuteAngle = ((minutes + seconds / 60) / 60) * 360 - 90;
    const hourAngle = ((hours + minutes / 60) / 12) * 360 - 90;

    return { secondAngle, minuteAngle, hourAngle };
  }, [time]);

  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let i = 0; i < 12; i++) {
      const angle = ((i / 12) * 360 - 90) * (Math.PI / 180);
      const outerX = center + (radius - 6) * Math.cos(angle);
      const outerY = center + (radius - 6) * Math.sin(angle);
      const innerX = center + (radius - 14) * Math.cos(angle);
      const innerY = center + (radius - 14) * Math.sin(angle);
      markers.push(
        <line
          key={i}
          x1={innerX}
          y1={innerY}
          x2={outerX}
          y2={outerY}
          stroke="var(--text-muted)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />,
      );
    }
    return markers;
  }, [center, radius, strokeWidth]);

  const secondHand = useMemo(() => {
    const tip = polarToCartesian(center, center, angles.secondAngle, radius - 10);
    const back = polarToCartesian(center, center, angles.secondAngle + 180, radius * 0.12);
    return (
      <line
        x1={back.x}
        y1={back.y}
        x2={tip.x}
        y2={tip.y}
        stroke="var(--status-offline)"
        strokeWidth={strokeWidth * 0.6}
        strokeLinecap="round"
      />
    );
  }, [angles.secondAngle, center, radius, strokeWidth]);

  const minuteHand = useMemo(() => {
    const tip = polarToCartesian(center, center, angles.minuteAngle, radius - 16);
    return (
      <line
        x1={center}
        y1={center}
        x2={tip.x}
        y2={tip.y}
        stroke="var(--text-primary)"
        strokeWidth={strokeWidth * 1.8}
        strokeLinecap="round"
      />
    );
  }, [angles.minuteAngle, center, radius, strokeWidth]);

  const hourHand = useMemo(() => {
    const tip = polarToCartesian(center, center, angles.hourAngle, radius - 28);
    return (
      <line
        x1={center}
        y1={center}
        x2={tip.x}
        y2={tip.y}
        stroke="var(--text-primary)"
        strokeWidth={strokeWidth * 2.5}
        strokeLinecap="round"
      />
    );
  }, [angles.hourAngle, center, radius, strokeWidth]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={strokeWidth}
      />

      {hourMarkers}

      <circle
        cx={center}
        cy={center}
        r={strokeWidth * 1.5}
        fill="var(--accent-primary)"
      />

      {hourHand}
      {minuteHand}
      {options.showSeconds && secondHand}
    </svg>
  );
}
