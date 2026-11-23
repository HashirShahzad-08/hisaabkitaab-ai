// Counts a number up (or to a new value) in 800ms. Change restartKey to count again from 0.
import { useEffect, useRef, useState } from 'react';

export default function useAnimatedNumber(target, { duration = 800, restartKey = 0 } = {}) {
  const [value, setValue] = useState(0);
  const current = useRef(0);
  const lastRestart = useRef(restartKey);

  useEffect(() => {
    let from = current.current;
    if (lastRestart.current !== restartKey) {
      from = 0;
      lastRestart.current = restartKey;
    }
    const start = Date.now();
    let frame;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // slows down at the end
      current.current = from + (target - from) * eased;
      setValue(current.current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [target, restartKey, duration]);

  return value;
}
