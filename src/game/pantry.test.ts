import { describe, it, expect } from "vitest";
import {
  starterStock,
  capacityFor,
  missingFor,
  canCook,
  consume,
  buy,
  classicRestockCost,
  ummKhalidLends,
  INGREDIENTS,
} from "./pantry";

describe("stock & consumption", () => {
  it("the starter shelf covers a classic batch but not a saffron one", () => {
    const s = starterStock();
    expect(canCook(s, "classic")).toBe(true);
    expect(canCook(s, "saffron")).toBe(false);
    expect(missingFor(s, "saffron")).toEqual({ saffron: 1, rose: 1 });
  });

  it("cooking consumes the cookbook amounts", () => {
    const s = consume(starterStock(), "classic");
    expect(s.sugar).toBe(2);
    expect(s.ghee).toBe(2);
    expect(s.cardamom).toBe(2);
  });

  it("a practice cook consumes half (rounded up)", () => {
    const s = consume(starterStock(), "classic", true);
    expect(s.sugar).toBe(2); // ceil(1/2) = 1 consumed
    expect(canCook(starterStock(), "royal", true)).toBe(false); // still needs saffron
  });

  it("consume throws when the shelf can't cover it", () => {
    expect(() => consume(starterStock(), "royal")).toThrow();
  });
});

describe("the souq market", () => {
  it("buys limited by coins", () => {
    const r = buy(starterStock(), "saffron", 3, 20, 0);
    expect(r.bought).toBe(1); // saffron is 12/unit, 20 coins buys one
    expect(r.coins).toBe(8);
    expect(r.stock.saffron).toBe(1);
  });

  it("buys limited by shelf space, and shelves upgrade capacity", () => {
    const s = { ...starterStock(), sugar: 11 };
    expect(buy(s, "sugar", 5, 999, 0).bought).toBe(1); // cap 12
    expect(buy(s, "sugar", 5, 999, 1).bought).toBe(5); // cap 24
    expect(capacityFor("sugar", 2)).toBe(INGREDIENTS.sugar.baseCap * 3);
  });

  it("buying nothing changes nothing", () => {
    const s = starterStock();
    const r = buy(s, "ghee", 0, 999, 0);
    expect(r.stock).toBe(s);
  });
});

describe("the neighbour rule (no softlock)", () => {
  const empty = { sugar: 0, starch: 0, ghee: 0, cardamom: 0, saffron: 0, rose: 0, nuts: 0 };

  it("broke + empty shelf → Umm Khalid lends the classic basics", () => {
    const lent = ummKhalidLends(empty, 2, { classic: true });
    expect(lent).not.toBeNull();
    expect(canCook(lent!, "classic")).toBe(true);
  });

  it("no lending while you can still cook something", () => {
    expect(ummKhalidLends(starterStock(), 0, { classic: true })).toBeNull();
  });

  it("no lending while you can afford the restock", () => {
    expect(ummKhalidLends(empty, classicRestockCost(empty), { classic: true })).toBeNull();
  });
});
