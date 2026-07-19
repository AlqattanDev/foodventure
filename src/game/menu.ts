/**
 * The menu board — pricing power and its consequences. Pure logic, tested.
 *
 * You set a price multiplier per dish (0.6x cheap … 1.6x premium). Price
 * moves three things:
 *   1. what a serving pays (price + a patience-fresh tip),
 *   2. how often customers order the dish (demand),
 *   3. whether they leave feeling ripped off (quality vs price).
 */
import type { DishId } from "../data/dishes";

export const PRICE_MIN = 0.6;
export const PRICE_MAX = 1.6;
export const PRICE_STEP = 0.1;

export interface MenuEntry {
  on: boolean;
  priceMult: number;
}

export type Menu = Record<DishId, MenuEntry>;

export function defaultMenu(): Menu {
  return {
    classic: { on: true, priceMult: 1 },
    saffron: { on: true, priceMult: 1 },
    royal: { on: true, priceMult: 1 },
  };
}

export function clampPrice(mult: number): number {
  const stepped = Math.round(mult / PRICE_STEP) * PRICE_STEP;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, Number(stepped.toFixed(1))));
}

const STAR_MULT = [0, 0.5, 0.75, 1, 1.35, 1.8];

/** What one serving pays: listed price + a tip that rewards fast service. */
export function payFor(
  basePrice: number,
  stars: number,
  priceMult: number,
  patience: number
): { price: number; tip: number; total: number } {
  const price = Math.max(1, Math.round(basePrice * 0.28 * (STAR_MULT[stars] ?? 1) * priceMult));
  const tip = Math.round(price * 0.45 * Math.max(0, patience));
  return { price, tip, total: price + tip };
}

/**
 * How likely a customer is to order this dish, relative to base appetite.
 * Pricey dishes get ordered less; a bargain pulls orders in.
 */
export function orderAppeal(priceMult: number): number {
  return Math.max(0.2, 1.6 - 0.75 * priceMult);
}

/**
 * The value verdict at the table: quality must justify the price.
 *  - "ripped"  → overpriced for the stars; unhappy AND an extra rep sting
 *  - "fair"    → price matches quality
 *  - "bargain" → underpriced; delight (slightly better rep)
 */
export type ValueVerdict = "bargain" | "fair" | "ripped";

export function valueVerdict(stars: number, priceMult: number): ValueVerdict {
  // 3★ food feels fairly priced at 1.0x; each star shifts the anchor
  const fairValue = stars / 3;
  if (priceMult > fairValue * 1.15) return "ripped";
  if (priceMult < fairValue * 0.8) return "bargain";
  return "fair";
}

/** Reputation nudge for the value verdict, applied on top of service rep. */
export function valueRep(verdict: ValueVerdict): number {
  return verdict === "ripped" ? -0.1 : verdict === "bargain" ? 0.03 : 0;
}
