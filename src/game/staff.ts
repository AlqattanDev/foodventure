/**
 * Staff brains — pure decisions for the hired server and chef, unit-tested.
 * The runtime (eateryLive) walks them around and applies the outcomes.
 * Staff cost real per-day wages, paid at the day's close-out (game/ledger.ts).
 */
import type { DishId } from "../data/dishes";
import { DISH_ORDER, DISHES } from "../data/dishes";
import type { MasteryState } from "./mastery";
import type { Batch } from "../state/game";
import type { Customer } from "./eatery";
import { canCook, type Stock } from "./pantry";

export const HIRE_COST = { server: 120, chef: 300 };
export const CHEF_COOK_SECONDS = 30;

/** What the hired chef cooks at: your best hand result, minus a star. */
export function chefStars(bestStars: number): number {
  return Math.max(1, Math.min(5, bestStars - 1));
}

/**
 * Which dish the chef should put a pot on for — the most valuable mastered
 * dish whose counter batch is empty and whose ingredients are on the shelf.
 */
export function pickChefDish(
  mastery: Record<DishId, MasteryState>,
  batches: Record<DishId, Batch | null>,
  stock: Stock
): DishId | null {
  const candidates = [...DISH_ORDER]
    .filter((d) => mastery[d].mastered && !batches[d] && canCook(stock, d))
    .sort((a, b) => DISHES[b].basePrice - DISHES[a].basePrice);
  return candidates[0] ?? null;
}

/**
 * Which waiting customer the server should walk a plate to — the one whose
 * patience is closest to dying, among those with food on the counter.
 */
export function pickServeTarget(
  customers: Customer[],
  batches: Record<DishId, Batch | null>
): Customer | null {
  let best: Customer | null = null;
  for (const c of customers) {
    if (c.phase !== "waiting") continue;
    const b = batches[c.dish];
    if (!b || b.servings <= 0) continue;
    if (!best || c.patience < best.patience) best = c;
  }
  return best;
}
