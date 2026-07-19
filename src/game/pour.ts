/**
 * Vessel pour physics — the V3 measurement mechanic. No bars: you tilt the
 * vessel, the stream flows, the bowl's level rises toward an etched line, and
 * you read the vessel to know when to right it.
 *
 * Realism hooks the gameplay hangs on:
 *  - flow only starts past a threshold tilt (a barely-tipped sack pours nothing)
 *  - righting the vessel doesn't cut the stream instantly — it dribbles off,
 *    so a good cook anticipates the cut
 *  - overshoot is recoverable by scooping back out, slowly (costs time)
 *
 * Pure logic, unit-tested; the cook UI drives it every frame.
 */
import { clamp01 } from "./scoring";

/** Tilt below this pours nothing. */
export const TILT_THRESHOLD = 0.22;
/** Bowl-fractions per second at full tilt. */
export const MAX_FLOW = 0.85;
/** Flow past this reads as a "glug" — too fast for a feathered stream. */
export const GLUG_FLOW = 0.28;
/** Scoop-back speed, bowl-fractions per second (slow on purpose). */
export const SCOOP_RATE = 0.1;

export interface PourState {
  /** bowl fill 0..1 (1 = brimming) */
  fill: number;
  /** actual vessel tilt 0..1 — follows the input with a small lag */
  tilt: number;
  /** current stream rate, bowl-fractions/sec — has its own inertia (dribble) */
  flow: number;
  /** total poured overboard past a full bowl */
  spilled: number;
}

export function createPour(): PourState {
  return { fill: 0, tilt: 0, flow: 0, spilled: 0 };
}

/** Steady-state flow for a held tilt. */
export function flowFor(tilt: number): number {
  if (tilt <= TILT_THRESHOLD) return 0;
  const t = (tilt - TILT_THRESHOLD) / (1 - TILT_THRESHOLD);
  return Math.pow(t, 1.7) * MAX_FLOW;
}

/**
 * Advance one frame. `tiltInput` is where the player holds the vessel;
 * `scooping` removes from the bowl instead (only meaningful when not tilted).
 */
export function stepPour(
  s: PourState,
  tiltInput: number,
  scooping: boolean,
  dt: number
): PourState {
  // vessel follows the hand quickly
  s.tilt += (clamp01(tiltInput) - s.tilt) * Math.min(1, dt * 14);

  // the stream has inertia: it opens fast and dies off over ~a quarter second
  // (the dribble) — you cut the pour by anticipating, not on the dot
  const target = flowFor(s.tilt);
  const rate = target > s.flow ? 10 : 8;
  s.flow += (target - s.flow) * Math.min(1, dt * rate);
  if (s.flow < 0.01 && target === 0) s.flow = 0;

  const added = s.flow * dt;
  const room = 1 - s.fill;
  s.fill = clamp01(s.fill + added);
  if (added > room) s.spilled += added - room;

  if (scooping && s.flow === 0) {
    s.fill = Math.max(0, s.fill - SCOOP_RATE * dt);
  }
  return s;
}

/** Classify the current stream — the combine stage's lump risk reads this. */
export function streamKind(flow: number): "none" | "thin" | "glug" {
  if (flow <= 0.004) return "none";
  return flow > GLUG_FLOW ? "glug" : "thin";
}
