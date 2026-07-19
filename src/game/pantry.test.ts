import { describe, it, expect } from "vitest";
import {
  starterStock,
  capacityFor,
  missingFor,
  canCook,
  consume,
  buy,
  priceOf,
  unitPrice,
  classicRestockCost,
  ummKhalidLends,
  INGREDIENTS,
  BULK_QTY,
  BULK_OFF,
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

describe("market depth", () => {
  it("bulk buys earn the discount", () => {
    const unit = INGREDIENTS.sugar.price;
    expect(priceOf("sugar", 4)).toBe(unit * 4);
    expect(priceOf("sugar", BULK_QTY)).toBe(Math.round(unit * BULK_QTY * (1 - BULK_OFF)));
  });

  it("daily prices wobble but stay deterministic and bounded", () => {
    for (const id of ["sugar", "saffron", "ghee"] as const) {
      for (let day = 1; day <= 30; day++) {
        const p = unitPrice(id, day);
        expect(p).toBe(unitPrice(id, day)); // stable per day
        expect(p).toBeGreaterThanOrEqual(Math.max(1, Math.floor(INGREDIENTS[id].price * 0.8)));
        expect(p).toBeLessThanOrEqual(Math.ceil(INGREDIENTS[id].price * 1.2));
      }
    }
    // and it actually moves across days
    const prices = new Set(Array.from({ length: 15 }, (_, d) => unitPrice("sugar", d + 1)));
    expect(prices.size).toBeGreaterThan(1);
  });

  it("buy() charges the bulk price, not the linear one", () => {
    const s = { ...starterStock(), sugar: 0 };
    const cost5 = priceOf("sugar", 5);
    const r = buy(s, "sugar", 5, cost5, 0);
    expect(r.bought).toBe(5);
    expect(r.coins).toBe(0);
  });
});
