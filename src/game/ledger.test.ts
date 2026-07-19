import { describe, it, expect } from "vitest";
import { closeOutDay, wagesFor, rentFor, WAGE, RENT } from "./ledger";

describe("payroll & rent", () => {
  it("wages sum the roster", () => {
    expect(wagesFor({ servers: 0, chefs: 0 })).toBe(0);
    expect(wagesFor({ servers: 2, chefs: 1 })).toBe(2 * WAGE.server + WAGE.chef);
  });

  it("rent rises with the floor tier and clamps to known tiers", () => {
    expect(rentFor(0)).toBe(RENT[0]);
    expect(rentFor(1)).toBe(RENT[1]);
    expect(rentFor(99)).toBe(RENT[RENT.length - 1]);
  });
});

describe("closeOutDay", () => {
  const tallies = { revenue: 120, ingredientSpend: 30, served: 9, lost: 2 };

  it("net = revenue − ingredients − wages − rent", () => {
    const { ledger } = closeOutDay(3, tallies, { servers: 1, chefs: 1 }, 0, 1.0, 1.4, 500);
    expect(ledger.wages).toBe(WAGE.server + WAGE.chef);
    expect(ledger.rent).toBe(RENT[0]);
    expect(ledger.net).toBe(120 - 30 - ledger.wages - ledger.rent);
    expect(ledger.day).toBe(3);
    expect(ledger.repEnd).toBe(1.4);
  });

  it("only fixed costs come off the till at close (revenue was paid live)", () => {
    const { coinsAfter, ledger } = closeOutDay(1, tallies, { servers: 1, chefs: 0 }, 0, 0, 0, 100);
    expect(coinsAfter).toBe(100 - ledger.wages - ledger.rent);
  });

  it("a broke till floors at zero but the ledger still shows the red", () => {
    const broke = { revenue: 0, ingredientSpend: 40, served: 0, lost: 5 };
    const { coinsAfter, ledger } = closeOutDay(2, broke, { servers: 3, chefs: 2 }, 1, 2, 1.2, 10);
    expect(coinsAfter).toBe(0);
    expect(ledger.net).toBeLessThan(0);
  });
});
