/**
 * The scorch grid — V3 stirring. No rhythm, no circles: the pot bottom is a
 * grid of cells; wherever the paddle doesn't pass, the halwa sticks, darkens,
 * then scorches — exactly where you neglected it. Stir any way you like
 * (figure-8, edge scraping, back-and-forth); what matters is coverage and
 * keeping the mass moving.
 *
 * Coordinates: normalized pot space, x/y in [-1, 1], the pot is the unit circle.
 * Pure logic, unit-tested; the cook UI feeds paddle positions every frame and
 * the 3D halwa paints `stick`/`scorch` as visible dark patches.
 */
import { clamp01 } from "./scoring";

/** Cells the paddle cleans around itself (normalized radius). */
export const SWEEP_RADIUS = 0.3;
/** Stick past this starts to visibly darken, then scorch. */
export const DARK_THRESHOLD = 0.45;

export interface StirGrid {
  /** grid is n×n over [-1,1]²; only cells inside the circle are live */
  n: number;
  /** 0..1 per cell — how stuck/darkening the halwa is right now */
  stick: Float32Array;
  /** 0..1 per cell — permanent scorch this cook (never heals) */
  scorch: Float32Array;
  /** 1 = cell is inside the pot circle */
  inside: Uint8Array;
  liveCells: number;
  /** last paddle position, null when the finger is off */
  px: number | null;
  py: number | null;
  /** normalized paddle speed (pot-widths/sec, smoothed) */
  speed: number;
  /** seconds since the paddle last moved meaningfully */
  idleFor: number;
}

export function createStir(n = 10): StirGrid {
  const stick = new Float32Array(n * n);
  const scorch = new Float32Array(n * n);
  const inside = new Uint8Array(n * n);
  let live = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * 2 - 1;
      const y = ((j + 0.5) / n) * 2 - 1;
      if (x * x + y * y <= 1.02) {
        inside[j * n + i] = 1;
        live++;
      }
    }
  }
  return { n, stick, scorch, inside, liveCells: live, px: null, py: null, speed: 0, idleFor: 10 };
}

function cellCenter(g: StirGrid, idx: number): [number, number] {
  const i = idx % g.n;
  const j = Math.floor(idx / g.n);
  return [((i + 0.5) / g.n) * 2 - 1, ((j + 0.5) / g.n) * 2 - 1];
}

function sweepAt(g: StirGrid, x: number, y: number) {
  const r2 = SWEEP_RADIUS * SWEEP_RADIUS;
  for (let idx = 0; idx < g.stick.length; idx++) {
    if (!g.inside[idx]) continue;
    const [cx, cy] = cellCenter(g, idx);
    const dx = cx - x;
    const dy = cy - y;
    if (dx * dx + dy * dy <= r2) g.stick[idx] = 0;
  }
}

/**
 * Advance one frame.
 * `paddle` — finger position in pot space, or null when lifted.
 * `heat` 0..1 — how hard the fire pushes the sticking.
 */
export function stepStir(
  g: StirGrid,
  paddle: { x: number; y: number } | null,
  heat: number,
  dt: number
): StirGrid {
  // --- paddle motion & sweeping (along the segment, so fast strokes count) ---
  if (paddle) {
    if (g.px !== null && g.py !== null) {
      const dx = paddle.x - g.px;
      const dy = paddle.y - g.py;
      const dist = Math.hypot(dx, dy);
      const inst = dist / Math.max(0.008, dt);
      g.speed += (inst - g.speed) * Math.min(1, dt * 8);
      if (dist > 0.01) g.idleFor = 0;
      else g.idleFor += dt;
      const steps = Math.max(1, Math.ceil(dist / (SWEEP_RADIUS * 0.5)));
      for (let k = 1; k <= steps; k++) {
        sweepAt(g, g.px + (dx * k) / steps, g.py + (dy * k) / steps);
      }
    } else {
      sweepAt(g, paddle.x, paddle.y);
      g.idleFor = 0;
    }
    g.px = paddle.x;
    g.py = paddle.y;
  } else {
    g.px = null;
    g.py = null;
    g.speed += (0 - g.speed) * Math.min(1, dt * 8);
    g.idleFor += dt;
  }

  // --- sticking & scorching ---
  // at full heat an untouched cell starts visibly darkening after ~4.5s and
  // burns in earnest past ~7s of neglect
  const stickRate = 0.1 * heat;
  for (let idx = 0; idx < g.stick.length; idx++) {
    if (!g.inside[idx]) continue;
    g.stick[idx] = clamp01(g.stick[idx] + stickRate * dt);
    const over = g.stick[idx] - DARK_THRESHOLD;
    if (over > 0) {
      g.scorch[idx] = clamp01(g.scorch[idx] + (over / (1 - DARK_THRESHOLD)) * 0.3 * dt);
    }
  }
  return g;
}

/** How well-tended the pot is right now, 0..1 (fraction of calm cells). */
export function coverageQuality(g: StirGrid): number {
  let ok = 0;
  for (let idx = 0; idx < g.stick.length; idx++) {
    if (g.inside[idx] && g.stick[idx] < 0.35) ok++;
  }
  return g.liveCells ? ok / g.liveCells : 1;
}

/** Total scorch 0..1 — localized burning counts hard (it ruins the batch). */
export function scorchTotal(g: StirGrid): number {
  let sum = 0;
  for (let idx = 0; idx < g.scorch.length; idx++) {
    if (g.inside[idx]) sum += g.scorch[idx];
  }
  return clamp01((sum / g.liveCells) * 3);
}

/** Worst cell's pot-space position — smoke rises from here. Null when clean. */
export function worstSpot(g: StirGrid): { x: number; y: number; scorch: number } | null {
  let worst = -1;
  let at = -1;
  for (let idx = 0; idx < g.scorch.length; idx++) {
    if (g.inside[idx] && g.scorch[idx] > worst) {
      worst = g.scorch[idx];
      at = idx;
    }
  }
  if (at < 0 || worst < 0.05) return null;
  const [x, y] = cellCenter(g, at);
  return { x, y, scorch: worst };
}

/** True while the paddle is actively working the pot. */
export function isStirring(g: StirGrid): boolean {
  return g.px !== null && g.idleFor < 0.18;
}
