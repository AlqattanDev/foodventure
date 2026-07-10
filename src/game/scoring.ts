/**
 * Pure scoring logic for the cooking mini-game. No React, no Three — just math,
 * so it can be unit-tested against the real production code paths.
 */
import type { Dish, Ingredient } from "../data/dishes";

/** Score a single poured ingredient 0..1 by how close it landed to target. */
export function scorePour(ing: Ingredient, amount: number): number {
  const d = Math.abs(amount - ing.target);
  if (d <= ing.tolerance) {
    // inside the perfect band — near 1, tapering to ~0.8 at the edge
    return 1 - (d / ing.tolerance) * 0.2;
  }
  // outside the band — falls off over roughly the same width again, then 0
  const over = (d - ing.tolerance) / (ing.tolerance * 2.2);
  return Math.max(0, 0.8 - over * 0.8);
}

/** Average pour accuracy across every ingredient → the Phase-1 prep score 0..1. */
export function scorePrep(dish: Dish, amounts: Record<string, number>): number {
  if (dish.ingredients.length === 0) return 1;
  const sum = dish.ingredients.reduce(
    (acc, ing) => acc + scorePour(ing, amounts[ing.key] ?? 0),
    0
  );
  return sum / dish.ingredients.length;
}

/** Ideal stir tempo (radians/sec of wrist circling) for a dish's difficulty. */
export function idealTempo(dish: Dish): { center: number; band: number } {
  // harder dishes want a faster, tighter rhythm
  const center = 5.5 + dish.difficulty * 0.6;
  const band = 3.4 - dish.difficulty * 0.5; // tighter band when harder
  return { center, band };
}

/**
 * How "on-rhythm" an instantaneous stir speed is, 0..1.
 * `bandBonus` widens the forgiving band (the "better pot" upgrade).
 */
export function tempoQuality(dish: Dish, speed: number, bandBonus = 0): number {
  const { center } = idealTempo(dish);
  const band = idealTempo(dish).band + bandBonus;
  const d = Math.abs(speed - center);
  if (d <= band) return 1 - (d / band) * 0.4; // 1.0 dead-center → 0.6 at edge
  const over = (d - band) / band;
  return Math.max(0, 0.6 - over * 0.6);
}

/**
 * Combine the raw cook signals into a final cook score 0..1.
 * - smoothness: avg tempo quality while actively stirring
 * - timing: fraction of scripted add-events nailed
 * - burn: how scorched it got (0 = pristine, 1 = ruined)
 */
export function scoreCook(opts: {
  smoothness: number;
  timing: number;
  burn: number;
}): number {
  const { smoothness, timing, burn } = opts;
  const base = smoothness * 0.6 + timing * 0.4;
  return clamp01(base * (1 - burn * 0.85));
}

/** Map prep + cook (each 0..1) to a 1..5 star rating. Burnt short-circuits to 0. */
export function starsFor(prep: number, cook: number, burnt: boolean): number {
  if (burnt) return 0;
  const combined = prep * 0.4 + cook * 0.6;
  // generous-ish curve: you have to try to get 1★, 5★ needs real execution
  if (combined >= 0.9) return 5;
  if (combined >= 0.75) return 4;
  if (combined >= 0.58) return 3;
  if (combined >= 0.4) return 2;
  return 1;
}

/** Coins earned selling a dish at a given star count, with upgrade bonuses. */
export function priceFor(dish: Dish, stars: number, sellBonus = 0): number {
  if (stars <= 0) return 0; // burnt batch = waste, no sale
  const starMult = [0, 0.5, 0.75, 1, 1.35, 1.8][stars] ?? 1;
  return Math.round(dish.basePrice * starMult * (1 + sellBonus));
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
