import { useEffect } from 'react';
import { useChoice } from './choice';

/** The two looks offered while the maintainer picks one (see index.css). */
export const DESIGNS = ['forge', 'mist'] as const;
export type Design = (typeof DESIGNS)[number];

/** The chosen look, applied to <html data-design>. */
export function useDesign(): [Design, (design: Design) => void] {
  const [design, setDesign] = useChoice('design', DESIGNS);
  useEffect(() => {
    document.documentElement.dataset.design = design;
  }, [design]);
  return [design, setDesign];
}
