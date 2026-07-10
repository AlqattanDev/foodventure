/**
 * A mutable singleton the cook simulation writes every frame and the 3D halwa
 * reads every frame. Kept OUT of React/Zustand on purpose: 60fps visual state
 * should never trigger re-renders.
 */
export interface CookViz {
  /** 0 = raw pale dough, 1 = fully cooked glossy */
  progress: number;
  /** 0 = pristine, 1 = scorched */
  burn: number;
  /** 0..1 glossy sheen / wetness */
  sheen: number;
  /** 0..1 how vigorously it's bubbling right now (tracks stir energy) */
  bubble: number;
  /** heat 0..1 drives steam + flame intensity */
  heat: number;
  /** raw & cooked tints for the current dish (hex) */
  rawColor: string;
  cookedColor: string;
  /** bumped each time a perfect timed-add lands, for a sparkle burst */
  sparkAt: number;
  /** whether we're currently in the cook phase (halwa idles otherwise) */
  active: boolean;
}

// At rest (idle stall) the hero pot shows a finished, glossy amber halwa —
// appetising, not raw dough. resetCookViz() drops it back to pale starch when
// a fresh cook actually begins.
export const cookViz: CookViz = {
  progress: 0.92,
  burn: 0,
  sheen: 0.82,
  bubble: 0,
  heat: 0.5,
  rawColor: "#e7d3a8",
  cookedColor: "#b5561f",
  sparkAt: 0,
  active: false,
};

if ((import.meta as any).env?.DEV && typeof window !== "undefined") {
  (window as any).cookViz = cookViz;
}

export function resetCookViz(rawColor: string, cookedColor: string) {
  cookViz.progress = 0;
  cookViz.burn = 0;
  cookViz.sheen = 0.35;
  cookViz.bubble = 0;
  cookViz.heat = 0.5;
  cookViz.rawColor = rawColor;
  cookViz.cookedColor = cookedColor;
  cookViz.sparkAt = 0;
  cookViz.active = true;
}
