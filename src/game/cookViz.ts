/**
 * A mutable singleton the cook simulation writes every frame and the 3D halwa
 * reads every frame. Kept OUT of React/Zustand on purpose: 60fps visual state
 * should never trigger re-renders.
 *
 * V3: the pot IS the UI — this carries everything the player reads instead of
 * meters: scorch patches, rim bubbles, the paddle, pour streams, ghee pools.
 */
export const SCORCH_N = 10;

export interface CookViz {
  /** 0 = raw pale dough, 1 = fully cooked glossy */
  progress: number;
  /** 0 = pristine, 1 = scorched (overall — drives color + smoke density) */
  burn: number;
  /** 0..1 glossy sheen / wetness — dulling sheen is the ghee cue */
  sheen: number;
  /** 0..1 how vigorously it's bubbling right now */
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

  /* ---- V3 channels ---- */
  /** per-cell stick/darkening 0..1, SCORCH_N×SCORCH_N over the pot circle */
  stick: Float32Array;
  /** per-cell permanent scorch 0..1 (drawn as burnt patches) */
  scorch: Float32Array;
  /** paddle position in pot space [-1,1]; active while the finger stirs */
  paddleX: number;
  paddleY: number;
  paddleActive: boolean;
  /** a stream falling into the pot: rate 0..1, tinted `streamColor` */
  streamRate: number;
  streamColor: string;
  /** fresh ghee floating on top, 0..1 — melts outward then absorbs */
  gheePool: number;
  /** where the worst scorch sits in pot space (smoke rises here) */
  smokeX: number;
  smokeY: number;
  smokeAmount: number;
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

  stick: new Float32Array(SCORCH_N * SCORCH_N),
  scorch: new Float32Array(SCORCH_N * SCORCH_N),
  paddleX: 0,
  paddleY: 0,
  paddleActive: false,
  streamRate: 0,
  streamColor: "#ffffff",
  gheePool: 0,
  smokeX: 0,
  smokeY: 0,
  smokeAmount: 0,
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

  cookViz.stick.fill(0);
  cookViz.scorch.fill(0);
  cookViz.paddleActive = false;
  cookViz.streamRate = 0;
  cookViz.gheePool = 0;
  cookViz.smokeAmount = 0;
}
