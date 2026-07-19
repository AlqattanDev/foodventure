import { describe, it, expect } from "vitest";
import {
  createEatery,
  tickEatery,
  serveCustomer,
  spawnInterval,
  repDelta,
  tableBonus,
  TABLE_SPOTS,
  type TickCtx,
  type EateryEvent,
} from "./eatery";

const DT = 1 / 30;

const ctx = (over: Partial<TickCtx> = {}): TickCtx => ({
  reputation: 0,
  tables: 2,
  menu: [{ dish: "classic", weight: 1 }],
  rand: () => 0.5,
  ...over,
});

function run(s: ReturnType<typeof createEatery>, seconds: number, c = ctx()): EateryEvent[] {
  const events: EateryEvent[] = [];
  for (let t = 0; t < seconds; t += DT) events.push(...tickEatery(s, DT, c));
  return events;
}

describe("walk-ins & seating", () => {
  it("customers appear, walk to the queue, and get seated at free tables", () => {
    const s = createEatery();
    run(s, 8); // first spawn at 5s, then walking
    expect(s.customers.length).toBe(1);
    const c = s.customers[0];
    expect(["toTable", "waiting"]).toContain(c.phase);
    expect(c.table).toBe(0);
    run(s, 6);
    expect(s.customers[0].phase).toBe("waiting");
    // they physically stand at their table
    expect(Math.hypot(c.x - TABLE_SPOTS[0].x, c.z - TABLE_SPOTS[0].z)).toBeLessThan(0.1);
  });

  it("higher reputation brings people faster", () => {
    expect(spawnInterval(5, () => 0.5)).toBeLessThan(spawnInterval(0, () => 0.5));
  });

  it("with no free table the queue holds, and it never grows past 4", () => {
    const s = createEatery();
    run(s, 120, ctx({ tables: 0, reputation: 5 }));
    const inQueue = s.customers.filter((c) => c.phase === "arriving" || c.phase === "queueing");
    expect(inQueue.length).toBeLessThanOrEqual(4);
    expect(s.customers.every((c) => c.table === -1)).toBe(true);
  });
});

describe("patience", () => {
  it("an unserved customer eventually walks out and it costs reputation", () => {
    const s = createEatery();
    const events = run(s, 70); // queue 30s / table 45s patience both fit in 70
    const walkouts = events.filter((e) => e.type === "walked-out");
    expect(walkouts.length).toBeGreaterThan(0);
    expect(repDelta(walkouts[0])).toBeLessThan(0);
  });
});

describe("serving", () => {
  it("a served customer eats, leaves happy, and frees the table", () => {
    const s = createEatery();
    run(s, 12); // seated by now
    const c = s.customers[0];
    expect(c.phase).toBe("waiting");
    expect(serveCustomer(s, c.id, 4)).toBe(true);
    expect(c.phase).toBe("eating");
    const events = run(s, 8);
    const fin = events.find((e) => e.type === "finished");
    expect(fin && fin.type === "finished" && fin.happy).toBe(true);
    expect(repDelta(fin!)).toBeGreaterThan(0);
    run(s, 6); // walks out the door and despawns (others may have arrived since)
    expect(s.customers.find((x) => x.id === c.id)).toBeUndefined();
  });

  it("bad food or a long wait leaves them unimpressed", () => {
    const s = createEatery();
    run(s, 12);
    const c = s.customers[0];
    serveCustomer(s, c.id, 2); // 2★ food
    expect(c.happy).toBe(false);
  });

  it("you can only serve someone who is seated and waiting", () => {
    const s = createEatery();
    run(s, 2);
    expect(serveCustomer(s, 999, 5)).toBe(false);
    const c = s.customers[0];
    if (c) expect(serveCustomer(s, c.id, 5)).toBe(c.phase === "waiting");
  });
});

describe("explicit happiness override", () => {
  it("the caller's value verdict wins over the default", () => {
    const s = createEatery();
    run(s, 12);
    const c = s.customers[0];
    // 5★ food served fresh, but the caller says they felt ripped off
    expect(serveCustomer(s, c.id, 5, false)).toBe(true);
    expect(c.happy).toBe(false);
  });
});

describe("the majlis premium", () => {
  it("wing tables (6+) pay a premium; terrace tables don't", () => {
    expect(tableBonus(0)).toBe(1);
    expect(tableBonus(5)).toBe(1);
    expect(tableBonus(6)).toBeGreaterThan(1);
    expect(tableBonus(9)).toBeGreaterThan(1);
  });
});
