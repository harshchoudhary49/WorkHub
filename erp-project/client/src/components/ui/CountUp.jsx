import { useEffect, useRef, useState } from 'react';

/**
 * CountUp — animates a number from 0 to `end` over `duration` ms.
 *
 * Usage:
 *   <CountUp end={overview.totalEmployees} suffix=" people" />
 *   <CountUp end={42} suffix="%" duration={1200} />
 */
export default function CountUp({ end = 0, suffix = '', prefix = '', duration = 900, className = '' }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (typeof end !== 'number' || isNaN(end)) return;

    const startValue = 0;
    const range = end - startValue;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(startValue + range * easeOut(progress)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration]);

  return (
    <span className={className}>
      {prefix}{value}{suffix}
    </span>
  );
}
