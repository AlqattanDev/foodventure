/**
 * The live eatery — customers walk in from the souq, queue, take a table,
 * order, wait with draining patience, eat, pay, and leave. Pure simulation:
 * no React, no Three. The controller ticks it, applies the events it emits
 * (coins/reputation live in the game store), and the 3D floor just draws
 * whatever positions are in here.
 *
 * World coordinates match the diorama: the counter sits near z≈1, the
 * terrace with tables spans z≈3..5.6, the souq door is off to the right.
 */
import type { DishId } from "../data/dishes";

export interface Spot {
  x: number;
  z: number;
}

/** Where each owned table stands — 0-5 on the terrace, 6-9 in the majlis wing. */
export const TABLE_SPOTS: Spot[] = [
  { x: -1.7, z: 3.3 },
  { x: 1.5, z: 3.4 },
  { x: -0.1, z: 4.35 },
  { x: 2.9, z: 4.5 },
  { x: -2.2, z: 4.5 },
  { x: 1.0, z: 5.4 },
  // the majlis wing (left side, under the roof)
  { x: -3.55, z: 3.5 },
  { x: -2.85, z: 4.45 },
  { x: -3.65, z: 5.3 },
  { x: -2.8, z: 5.95 },
];

/** First table index that sits inside the majlis wing. */
export const MAJLIS_TABLE_START = 6;

/** Majlis guests pay a premium for the room. */
export function tableBonus(tableIdx: number): number {
  return tableIdx >= MAJLIS_TABLE_START ? 1.35 : 1;
}

export const DOOR: Spot = { x: 4.3, z: 5.1 };
/** Front of the queue, near the counter; the line snakes toward the door. */
export const QUEUE_HEAD: Spot = { x: 1.7, z: 2.2 };

const WALK_SPEED = 1.35; // units/sec
const EAT_SECONDS = 7;
const QUEUE_PATIENCE_S = 30; // full drain while standing in line
const TABLE_PATIENCE_S = 45; // full drain while seated unserved
const MAX_QUEUE = 4;

export type CustomerPhase =
  | "arriving" // walking from the door to the queue
  | "queueing"
  | "toTable"
  | "waiting" // seated, hungry — serve them!
  | "eating"
  | "leaving"
  | "gone";

export interface Customer {
  id: number;
  dish: DishId;
  phase: CustomerPhase;
  /** 1 → 0; hits 0 = walks out angry */
  patience: number;
  table: number; // -1 = none
  x: number;
  z: number;
  eatT: number;
  /** decided at serve time: quality + how long they waited */
  happy: boolean | null;
  /** captured at serve for the tip */
  servedAtPatience: number;
  starsServed: number;
}

export interface EateryState {
  customers: Customer[];
  nextId: number;
  /** seconds until the next walk-in */
  spawnT: number;
}

export type EateryEvent =
  | { type: "finished"; happy: boolean } // ate and left
  | { type: "walked-out" }; // patience died — reputation hit

export interface MenuOffer {
  dish: DishId;
  /** relative order likelihood (appetite × price appeal) */
  weight: number;
}

export interface TickCtx {
  /** 0..5 — drives how often people show up */
  reputation: number;
  /** how many tables are owned (indexes into TABLE_SPOTS) */
  tables: number;
  /** what's on the board today, with demand weights */
  menu: MenuOffer[];
  rand: () => number;
}

export function createEatery(): EateryState {
  return { customers: [], nextId: 1, spawnT: 5 };
}

export function spawnInterval(reputation: number, rand: () => number): number {
  const base = 16 - reputation * 2.2; // rep 0 → 16s, rep 5 → 5s
  return base * (0.75 + rand() * 0.5);
}

function pickDish(menu: MenuOffer[], rand: () => number): DishId {
  const total = menu.reduce((a, m) => a + m.weight, 0);
  let r = rand() * total;
  for (const m of menu) {
    r -= m.weight;
    if (r <= 0) return m.dish;
  }
  return menu[menu.length - 1].dish;
}

function walkToward(c: Customer, target: Spot, dt: number): boolean {
  const dx = target.x - c.x;
  const dz = target.z - c.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.06) return true;
  const step = Math.min(d, WALK_SPEED * dt);
  c.x += (dx / d) * step;
  c.z += (dz / d) * step;
  return d - step < 0.06;
}

function queueSpot(idx: number): Spot {
  // the line snakes from the counter toward the door
  const t = idx / 3;
  return {
    x: QUEUE_HEAD.x + (DOOR.x - QUEUE_HEAD.x) * t * 0.55,
    z: QUEUE_HEAD.z + (DOOR.z - QUEUE_HEAD.z) * t * 0.55,
  };
}

/** Is this table taken by someone who hasn't left yet? */
function tableTaken(s: EateryState, table: number): boolean {
  return s.customers.some(
    (c) => c.table === table && (c.phase === "toTable" || c.phase === "waiting" || c.phase === "eating")
  );
}

/** Advance the floor by dt. Mutates state; returns events for the store. */
export function tickEatery(s: EateryState, dt: number, ctx: TickCtx): EateryEvent[] {
  const events: EateryEvent[] = [];

  // ---- walk-ins ----
  const queueLen = s.customers.filter((c) => c.phase === "arriving" || c.phase === "queueing").length;
  s.spawnT -= dt;
  if (s.spawnT <= 0) {
    if (queueLen < MAX_QUEUE && ctx.menu.length > 0) {
      s.customers.push({
        id: s.nextId++,
        dish: pickDish(ctx.menu, ctx.rand),
        phase: "arriving",
        patience: 1,
        table: -1,
        x: DOOR.x,
        z: DOOR.z,
        eatT: 0,
        happy: null,
        servedAtPatience: 0,
        starsServed: 0,
      });
    }
    s.spawnT = spawnInterval(ctx.reputation, ctx.rand);
  }

  // ---- seat the front of the queue at any free table ----
  for (const c of s.customers) {
    if (c.phase !== "queueing") continue;
    let free = -1;
    for (let t = 0; t < ctx.tables; t++) {
      if (!tableTaken(s, t)) {
        free = t;
        break;
      }
    }
    if (free >= 0) {
      c.table = free;
      c.phase = "toTable";
    }
  }

  // ---- move + age everyone ----
  const queue = s.customers.filter((c) => c.phase === "arriving" || c.phase === "queueing");
  for (const c of s.customers) {
    switch (c.phase) {
      case "arriving": {
        const idx = queue.indexOf(c);
        if (walkToward(c, queueSpot(Math.max(0, idx)), dt)) c.phase = "queueing";
        break;
      }
      case "queueing": {
        const idx = queue.indexOf(c);
        walkToward(c, queueSpot(Math.max(0, idx)), dt);
        c.patience -= dt / QUEUE_PATIENCE_S;
        break;
      }
      case "toTable": {
        if (walkToward(c, TABLE_SPOTS[c.table], dt)) c.phase = "waiting";
        break;
      }
      case "waiting": {
        c.patience -= dt / TABLE_PATIENCE_S;
        break;
      }
      case "eating": {
        c.eatT += dt;
        if (c.eatT >= EAT_SECONDS) {
          events.push({ type: "finished", happy: !!c.happy });
          c.phase = "leaving";
        }
        break;
      }
      case "leaving": {
        if (walkToward(c, DOOR, dt)) c.phase = "gone";
        break;
      }
    }
    if ((c.phase === "queueing" || c.phase === "waiting") && c.patience <= 0) {
      events.push({ type: "walked-out" });
      c.phase = "leaving";
    }
  }

  // ---- sweep the departed ----
  for (let i = s.customers.length - 1; i >= 0; i--) {
    if (s.customers[i].phase === "gone") s.customers.splice(i, 1);
  }

  return events;
}

/**
 * Serve a seated customer from the counter. Pure on the sim side — the
 * caller checks + decrements the batch and pays out the tip.
 * Returns false if they can't be served right now.
 */
export function serveCustomer(
  s: EateryState,
  id: number,
  stars: number,
  happy?: boolean
): boolean {
  const c = s.customers.find((c) => c.id === id);
  if (!c || c.phase !== "waiting") return false;
  c.phase = "eating";
  c.eatT = 0;
  c.servedAtPatience = Math.max(0, c.patience);
  c.starsServed = stars;
  // caller may fold in the value-for-money verdict (menu.ts); default is
  // quality + a reasonably fresh wait
  c.happy = happy ?? (stars >= 3 && c.patience > 0.25);
  return true;
}

/** Reputation nudge when a customer resolves. */
export function repDelta(ev: EateryEvent): number {
  if (ev.type === "walked-out") return -0.15;
  return ev.happy ? 0.07 : -0.05;
}
