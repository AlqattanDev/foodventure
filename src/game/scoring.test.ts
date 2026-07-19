import { describe, it, expect } from "vitest";
import { scorePour, priceFor } from "./scoring";
import { DISHES } from "../data/dishes";

const classic = DISHES.classic;
const ing = classic.ingredients[0]; // cornflour, target 0.6 tol 0.14

describe("scorePour", () => {
  it("gives ~1 dead on target", () => {
    expect(scorePour(ing, ing.target)).toBeGreaterThan(0.99);
  });
  it("stays high inside the band, lower at the edge", () => {
    const edge = scorePour(ing, ing.target + ing.tolerance);
    expect(edge).toBeGreaterThan(0.78);
    expect(edge).toBeLessThan(0.82);
  });
  it("falls off outside the band and floors at 0 for a wild miss", () => {
    expect(scorePour(ing, ing.target + ing.tolerance * 2)).toBeLessThan(0.6);
    // cardamom (target 0.25, tol 0.1) poured to the brim is a total miss → 0
    const cardamom = classic.ingredients[3];
    expect(scorePour(cardamom, 1)).toBe(0);
    expect(scorePour(ing, 0)).toBeGreaterThanOrEqual(0);
  });
});

describe("priceFor", () => {
  it("burnt (0 stars) earns nothing", () => {
    expect(priceFor(classic, 0)).toBe(0);
  });
  it("more stars → more coins, royal worth more than classic", () => {
    expect(priceFor(classic, 5)).toBeGreaterThan(priceFor(classic, 3));
    expect(priceFor(DISHES.royal, 5)).toBeGreaterThan(priceFor(classic, 5));
  });
  it("5-star classic uses the 1.8x multiplier", () => {
    expect(priceFor(classic, 5)).toBe(Math.round(classic.basePrice * 1.8));
  });
});
