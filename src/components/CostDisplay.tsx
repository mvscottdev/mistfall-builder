import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { formatGold } from './item-name';
import type { Language } from '../i18n/language';

/** Gold that counts up or down to a new value (≤ 300 ms; instant with reduced motion). */
export function CostDisplay({ cost, language }: { cost: number; language: Language }) {
  const reduce = useReducedMotion();
  const node = useRef<HTMLSpanElement>(null);
  const shown = useRef(cost);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const write = (value: number) => {
      shown.current = value;
      element.textContent = formatGold(Math.round(value), language);
    };
    if (reduce || shown.current === cost) return write(cost);
    const controls = animate(shown.current, cost, {
      duration: 0.3,
      ease: 'easeOut',
      onUpdate: write,
    });
    return () => controls.stop();
  }, [cost, language, reduce]);

  return (
    <span ref={node} className="tabular-nums">
      {formatGold(cost, language)}
    </span>
  );
}
