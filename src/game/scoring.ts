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

/** Coins earned selling a dish at a given star count, with upgrade bonuses. */
export function priceFor(dish: Dish, stars: number, sellBonus = 0): number {
  if (stars <= 0) return 0; // burnt batch = waste, no sale
  const starMult = [0, 0.5, 0.75, 1, 1.35, 1.8][stars] ?? 1;
  return Math.round(dish.basePrice * starMult * (1 + sellBonus));
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
