/**
 * The pantry — real ingredient stock behind every cook. Pure logic, tested.
 * Cooking consumes the cookbook amounts; the souq market refills the shelves;
 * shelf upgrades raise capacity. The neighbour rule keeps the game from
 * softlocking: if you're broke AND can't cook anything, Umm Khalid lends you
 * the classic basics for free.
 */
import type { DishId } from "../data/dishes";
import {
  CONSUMPTION,
  INGREDIENTS,
  INGREDIENT_ORDER,
  type IngredientId,
} from "../data/ingredients";

export type Stock = Record<IngredientId, number>;

/** A fresh pantry: enough on the shelf for the first few classic batches. */
export function starterStock(): Stock {
  return {
    sugar: 3,
    starch: 3,
    ghee: 3,
    cardamom: 3,
    saffron: 0,
    rose: 0,
    nuts: 0,
  };
}

/** Pantry capacity for an ingredient at a shelf level (0..2). */
export function capacityFor(id: IngredientId, shelfLevel: number): number {
  return INGREDIENTS[id].baseCap * (1 + shelfLevel);
}

/** Which ingredients (and how many) a cook of this dish is missing. */
export function missingFor(stock: Stock, dish: DishId, half = false): Partial<Record<IngredientId, number>> {
  const out: Partial<Record<IngredientId, number>> = {};
  for (const [id, amt] of Object.entries(CONSUMPTION[dish]) as [IngredientId, number][]) {
    const need = half ? Math.ceil(amt / 2) : amt;
    if ((stock[id] ?? 0) < need) out[id] = need - (stock[id] ?? 0);
  }
  return out;
}

export function canCook(stock: Stock, dish: DishId, half = false): boolean {
  return Object.keys(missingFor(stock, dish, half)).length === 0;
}

/** Consume a cook's ingredients (throws if the shelf can't cover it). */
export function consume(stock: Stock, dish: DishId, half = false): Stock {
  if (!canCook(stock, dish, half)) {
    throw new Error(`pantry cannot cover a ${half ? "practice " : ""}${dish} cook`);
  }
  const next = { ...stock };
  for (const [id, amt] of Object.entries(CONSUMPTION[dish]) as [IngredientId, number][]) {
    next[id] -= half ? Math.ceil(amt / 2) : amt;
  }
  return next;
}

/** Buying 5+ at once earns the souq's bulk rate. */
export const BULK_QTY = 5;
export const BULK_OFF = 0.15;

/**
 * Today's unit price — the souq moves ±20% day to day (deterministic per
 * ingredient+day, so a reload can't reroll the market).
 */
export function unitPrice(id: IngredientId, day: number): number {
  const base = INGREDIENTS[id].price;
  // cheap seeded hash → stable wobble in [-0.2, +0.2]
  let h = day * 31 + id.length * 7;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) % 1000003;
  const wobble = ((h % 41) / 40 - 0.5) * 0.4;
  return Math.max(1, Math.round(base * (1 + wobble)));
}

/** Cost of buying `qty` units at today's price, bulk discount included. */
export function priceOf(id: IngredientId, qty: number, day = 0): number {
  const unit = day > 0 ? unitPrice(id, day) : INGREDIENTS[id].price;
  const raw = unit * qty;
  return qty >= BULK_QTY ? Math.max(1, Math.round(raw * (1 - BULK_OFF))) : raw;
}

/**
 * Buy up to `qty` units, limited by coins and shelf space.
 * Returns what actually happened.
 */
export function buy(
  stock: Stock,
  id: IngredientId,
  qty: number,
  coins: number,
  shelfLevel: number,
  day = 0
): { stock: Stock; coins: number; bought: number } {
  const cap = capacityFor(id, shelfLevel);
  const room = Math.max(0, cap - stock[id]);
  // largest affordable count ≤ min(qty, room) — bulk pricing makes this
  // non-linear, so walk down from the ask
  let bought = Math.max(0, Math.min(qty, room));
  while (bought > 0 && priceOf(id, bought, day) > coins) bought--;
  if (bought === 0) return { stock, coins, bought: 0 };
  return {
    stock: { ...stock, [id]: stock[id] + bought },
    coins: coins - priceOf(id, bought, day),
    bought,
  };
}

/** Total coins needed to top up the classic basics for one batch. */
export function classicRestockCost(stock: Stock): number {
  let cost = 0;
  for (const [id, short] of Object.entries(missingFor(stock, "classic")) as [IngredientId, number][]) {
    cost += priceOf(id, short);
  }
  return cost;
}

/**
 * The neighbour rule: broke AND unable to cook any unlocked dish → the
 * classic basics appear on the shelf, free. Softlock is not Khaliji.
 */
export function ummKhalidLends(
  stock: Stock,
  coins: number,
  unlocked: Partial<Record<DishId, boolean>>
): Stock | null {
  const dishes = (Object.keys(CONSUMPTION) as DishId[]).filter((d) => unlocked[d]);
  if (dishes.some((d) => canCook(stock, d))) return null;
  if (coins >= classicRestockCost(stock)) return null;
  const next = { ...stock };
  for (const [id, amt] of Object.entries(CONSUMPTION.classic) as [IngredientId, number][]) {
    next[id] = Math.max(next[id], amt);
  }
  return next;
}

export { INGREDIENTS, INGREDIENT_ORDER, CONSUMPTION };
export type { IngredientId };
