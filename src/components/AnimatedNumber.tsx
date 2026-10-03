import { useEffect, useRef, useState } from 'react';

function useAnimatedNumber(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      setValue(v);
      fromRef.current = v;
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  className?: string;
}

/** Smoothly tweens between values when they change. */
export default function AnimatedNumber({ value, format, className = '' }: AnimatedNumberProps) {
  const animated = useAnimatedNumber(value);
  return <span className={className}>{format(animated)}</span>;
}
