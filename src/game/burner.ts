/**
 * The gas burner — V3 heat. No heat gauge: you drag a gas knob and read the
 * pot's rim bubbles. The pot has thermal inertia, so the knob leads the heat
 * and a cook has to anticipate, exactly like a real stove.
 *
 * Pure logic, unit-tested.
 */
import { clamp01 } from "./scoring";

export interface BurnerState {
  /** where the knob is set 0..1 */
  knob: number;
  /** actual pot heat 0..1 — chases the knob with lag */
  heat: number;
}

export function createBurner(knob = 0.15): BurnerState {
  return { knob, heat: 0.05 };
}

/** Heating is quicker than cooling — a pot holds its heat. */
export function stepBurner(s: BurnerState, knobInput: number, dt: number): BurnerState {
  s.knob = clamp01(knobInput);
  const rate = s.knob > s.heat ? 0.35 : 0.18;
  s.heat = clamp01(s.heat + (s.knob - s.heat) * Math.min(1, dt * rate * 3));
  return s;
}

export type BubbleStage = "still" | "beads" | "simmer" | "rolling";

/**
 * What the surface is doing at this heat, relative to the recipe's simmer
 * band — this IS the player's thermometer.
 */
export function bubbleStage(heat: number, band: [number, number]): BubbleStage {
  const [lo, hi] = band;
  if (heat < lo - 0.12) return "still";
  if (heat < lo) return "beads";
  if (heat <= hi) return "simmer";
  return "rolling";
}
