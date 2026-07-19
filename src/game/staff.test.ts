import { describe, it, expect } from "vitest";
import { pickChefDish, pickServeTarget, chefStars } from "./staff";
import { FRESH_MASTERY, type MasteryState } from "./mastery";
import { starterStock } from "./pantry";
import type { Customer } from "./eatery";
import type { DishId } from "../data/dishes";

const MASTERED: MasteryState = { guidedGood: 2, memoryGood: 2, mastered: true };

const mastery = (over: Partial<Record<DishId, MasteryState>> = {}) => ({
  classic: FRESH_MASTERY,
  saffron: FRESH_MASTERY,
  royal: FRESH_MASTERY,
  ...over,
});

const noBatches = { classic: null, saffron: null, royal: null };

describe("pickChefDish", () => {
  it("only cooks mastered dishes with an empty counter and a stocked shelf", () => {
    expect(pickChefDish(mastery(), noBatches, starterStock())).toBeNull();
    expect(pickChefDish(mastery({ classic: MASTERED }), noBatches, starterStock())).toBe("classic");
    // counter already has classic → nothing to do
    expect(
      pickChefDish(
        mastery({ classic: MASTERED }),
        { ...noBatches, classic: { stars: 4, servings: 3 } },
        starterStock()
      )
    ).toBeNull();
    // mastered but shelf can't cover it (saffron needs saffron threads)
    expect(pickChefDish(mastery({ saffron: MASTERED }), noBatches, starterStock())).toBeNull();
  });

  it("prefers the most valuable dish it can make", () => {
    const stock = { ...starterStock(), saffron: 2, rose: 2 };
    const m = mastery({ classic: MASTERED, saffron: MASTERED });
    expect(pickChefDish(m, noBatches, stock)).toBe("saffron");
  });
});

describe("pickServeTarget", () => {
  const cust = (id: number, phase: Customer["phase"], patience: number, dish: DishId = "classic"): Customer => ({
    id, dish, phase, patience, table: 0, x: 0, z: 0, eatT: 0, happy: null, servedAtPatience: 0, starsServed: 0,
  });

  it("serves the most desperate customer whose dish is on the counter", () => {
    const batches = { ...noBatches, classic: { stars: 4, servings: 2 } };
    const target = pickServeTarget(
      [cust(1, "waiting", 0.8), cust(2, "waiting", 0.3), cust(3, "queueing", 0.1)],
      batches
    );
    expect(target?.id).toBe(2);
  });

  it("skips customers whose dish isn't cooked", () => {
    const batches = { ...noBatches, classic: { stars: 4, servings: 1 } };
    const target = pickServeTarget(
      [cust(1, "waiting", 0.2, "saffron"), cust(2, "waiting", 0.9, "classic")],
      batches
    );
    expect(target?.id).toBe(2);
    expect(pickServeTarget([cust(1, "waiting", 0.5, "royal")], batches)).toBeNull();
  });
});

describe("chefStars", () => {
  it("cooks a star below your best, floored at 1", () => {
    expect(chefStars(5)).toBe(4);
    expect(chefStars(3)).toBe(2);
    expect(chefStars(1)).toBe(1);
    expect(chefStars(0)).toBe(1);
  });
});
