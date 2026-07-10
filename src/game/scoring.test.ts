import { describe, it, expect } from "vitest";
import {
  scorePour,
  scorePrep,
  tempoQuality,
  idealTempo,
  scoreCook,
  starsFor,
  priceFor,
} from "./scoring";
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

describe("scorePrep", () => {
  it("perfect amounts → ~1", () => {
    const amts = Object.fromEntries(classic.ingredients.map((i) => [i.key, i.target]));
    expect(scorePrep(classic, amts)).toBeGreaterThan(0.99);
  });
  it("empty plate scores poorly", () => {
    expect(scorePrep(classic, {})).toBeLessThan(0.5);
  });
});

describe("tempoQuality", () => {
  it("peaks at the ideal tempo center", () => {
    const { center } = idealTempo(classic);
    expect(tempoQuality(classic, center)).toBeGreaterThan(0.99);
  });
  it("a bandBonus widens the forgiving zone", () => {
    const { center, band } = idealTempo(classic);
    const off = center + band + 0.5; // just outside the base band
    expect(tempoQuality(classic, off, 0)).toBeLessThan(tempoQuality(classic, off, 1.5));
  });
  it("harder dishes have a tighter band", () => {
    expect(idealTempo(DISHES.royal).band).toBeLessThan(idealTempo(classic).band);
  });
});

describe("scoreCook", () => {
  it("burn drags the score down hard", () => {
    const clean = scoreCook({ smoothness: 0.9, timing: 1, burn: 0 });
    const scorched = scoreCook({ smoothness: 0.9, timing: 1, burn: 0.8 });
    expect(clean).toBeGreaterThan(0.85);
    expect(scorched).toBeLessThan(clean * 0.5);
  });
});

describe("starsFor", () => {
  it("burnt is always 0 stars", () => {
    expect(starsFor(1, 1, true)).toBe(0);
  });
  it("great prep + cook → 5 stars", () => {
    expect(starsFor(1, 1, false)).toBe(5);
  });
  it("scales down with worse execution", () => {
    expect(starsFor(0.3, 0.3, false)).toBeLessThanOrEqual(2);
    expect(starsFor(0.6, 0.6, false)).toBe(3);
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
