import { describe, it, expect } from "vitest";
import {
  defaultMenu,
  clampPrice,
  payFor,
  orderAppeal,
  valueVerdict,
  valueRep,
  PRICE_MIN,
  PRICE_MAX,
} from "./menu";

describe("price control", () => {
  it("clamps and steps the multiplier", () => {
    expect(clampPrice(0.1)).toBe(PRICE_MIN);
    expect(clampPrice(9)).toBe(PRICE_MAX);
    expect(clampPrice(1.04)).toBe(1);
    expect(clampPrice(1.06)).toBe(1.1);
  });

  it("defaults every dish to on at 1.0x", () => {
    const m = defaultMenu();
    expect(m.classic.on && m.saffron.on && m.royal.on).toBe(true);
    expect(m.royal.priceMult).toBe(1);
  });
});

describe("payFor", () => {
  it("price scales with stars and the multiplier; the tip rewards freshness", () => {
    const cheap = payFor(30, 3, 0.6, 1);
    const listed = payFor(30, 3, 1, 1);
    const premium = payFor(30, 3, 1.6, 1);
    expect(cheap.price).toBeLessThan(listed.price);
    expect(premium.price).toBeGreaterThan(listed.price);
    expect(payFor(30, 5, 1, 1).price).toBeGreaterThan(listed.price);
    expect(payFor(30, 3, 1, 0).tip).toBe(0);
    expect(payFor(30, 3, 1, 1).tip).toBeGreaterThan(0);
    expect(listed.total).toBe(listed.price + listed.tip);
  });
});

describe("demand & the value verdict", () => {
  it("pricier dishes get ordered less", () => {
    expect(orderAppeal(0.6)).toBeGreaterThan(orderAppeal(1));
    expect(orderAppeal(1)).toBeGreaterThan(orderAppeal(1.6));
    expect(orderAppeal(1.6)).toBeGreaterThan(0);
  });

  it("overpricing low-star food reads as a rip-off; a deal delights", () => {
    expect(valueVerdict(2, 1.3)).toBe("ripped"); // 2★ at premium price
    expect(valueVerdict(5, 1.4)).toBe("fair"); // 5★ carries a premium
    expect(valueVerdict(5, 1.2)).toBe("bargain"); // 5★ under-priced
    expect(valueVerdict(3, 1)).toBe("fair");
    expect(valueVerdict(3, 0.6)).toBe("bargain");
  });

  it("the verdict moves reputation the right way", () => {
    expect(valueRep("ripped")).toBeLessThan(0);
    expect(valueRep("bargain")).toBeGreaterThan(0);
    expect(valueRep("fair")).toBe(0);
  });
});
