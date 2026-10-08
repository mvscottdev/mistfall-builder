import { useEffect, useState } from 'react';

/** The two looks offered while the maintainer picks one (see index.css). */
export type Design = 'forge' | 'mist';

const STORAGE_KEY = 'mistfall-builder.design';

function isDesign(value: unknown): value is Design {
  return value === 'forge' || value === 'mist';
}

/** `?design=` in the URL, else the saved choice, else Forge. */
function initialDesign(): Design {
  const fromUrl = new URLSearchParams(location.search).get('design');
  if (isDesign(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isDesign(saved)) return saved;
  } catch {
    // storage blocked: fall through
  }
  return 'forge';
}

/** The chosen look, applied to <html data-design> and remembered. */
export function useDesign(): [Design, (design: Design) => void] {
  const [design, setDesign] = useState(initialDesign);
  useEffect(() => {
    document.documentElement.dataset.design = design;
    try {
      localStorage.setItem(STORAGE_KEY, design);
    } catch {
      // not saved; the choice holds until the page closes
    }
  }, [design]);
  return [design, setDesign];
}
