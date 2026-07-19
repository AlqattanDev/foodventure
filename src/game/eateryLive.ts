/**
 * The running eatery: a mutable sim singleton (like cookViz) ticked by
 * <EateryController>, with a tiny external-store bridge so the 2D serve tray
 * re-renders only when something meaningful changes. The 3D floor reads the
 * singleton directly every frame.
 *
 * Pause rule (Ali's): only a PRACTICE cook stops the world. Service cooks,
 * menus and the market all run live — that pressure is the game.
 */
import { DISHES, type DishId } from "../data/dishes";
import { useGame } from "../state/game";
import {
  createEatery,
  tickEatery,
  serveCustomer,
  tipFor,
  repDelta,
  type EateryState,
} from "./eatery";
import {
  pickChefDish,
  pickServeTarget,
  chefStars,
  SERVER_TIP_CUT,
  CHEF_FEE,
  CHEF_COOK_SECONDS,
} from "./staff";
import { haptic } from "./haptics";

export const eatery: EateryState = createEatery();

/** The hired hands' live bodies — positions/pots the 3D floor draws. */
export const staffLive = {
  server: {
    x: 0.8,
    z: 1.7,
    phase: "idle" as "idle" | "toTable" | "returning",
    targetId: 0,
    carrying: null as DishId | null,
  },
  chef: { cooking: null as DishId | null, t: 0 },
};

const SERVER_HOME = { x: 0.8, z: 1.7 };
const SERVER_SPEED = 1.9;

if ((import.meta as any).env?.DEV && typeof window !== "undefined") {
  (window as any).eatery = eatery;
  (window as any).staffLive = staffLive;
}

/* ---- external-store bridge for React ---- */
let version = 0;
const listeners = new Set<() => void>();
let lastSig = "";

export function subscribeEatery(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function eaterySnapshot(): number {
  return version;
}

/** Bump React only when the tray-relevant picture changed. */
export function emitIfChanged() {
  const sig = eatery.customers
    .map((c) => `${c.id}:${c.phase}:${c.table}:${Math.round(c.patience * 20)}`)
    .join("|");
  if (sig !== lastSig) {
    lastSig = sig;
    version++;
    listeners.forEach((l) => l());
  }
}

/** Should the world be running right now? */
export function eateryRunning(): boolean {
  const g = useGame.getState();
  if (!g.opened) return false;
  return !(g.phase === "cook" && g.cookPurpose === "practice");
}

/** One controller tick: advance the sim and apply its events to the store. */
export function runEatery(dt: number) {
  const g = useGame.getState();
  const events = tickEatery(eatery, dt, {
    reputation: g.reputation,
    tables: g.tables,
    unlocked: (Object.keys(g.unlocked) as (keyof typeof g.unlocked)[]).filter((d) => g.unlocked[d]),
    rand: Math.random,
  });
  for (const ev of events) g.applyRep(repDelta(ev));
  if (g.staff.server) runServer(dt);
  if (g.staff.chef) runChef(dt);
  emitIfChanged();
}

/* ---- the hired server: walks plates from the counter to the tables ---- */

function walkServer(tx: number, tz: number, dt: number): boolean {
  const s = staffLive.server;
  const dx = tx - s.x;
  const dz = tz - s.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.08) return true;
  const step = Math.min(d, SERVER_SPEED * dt);
  s.x += (dx / d) * step;
  s.z += (dz / d) * step;
  return d - step < 0.08;
}

function runServer(dt: number) {
  const g = useGame.getState();
  const s = staffLive.server;
  switch (s.phase) {
    case "idle": {
      const target = pickServeTarget(eatery.customers, g.batches);
      if (target) {
        s.phase = "toTable";
        s.targetId = target.id;
        s.carrying = target.dish;
      }
      break;
    }
    case "toTable": {
      const c = eatery.customers.find((c) => c.id === s.targetId);
      if (!c || c.phase !== "waiting") {
        // they left or the player already served them — walk the plate back
        s.phase = "returning";
        break;
      }
      if (walkServer(c.x, c.z, dt)) {
        const batch = g.batches[c.dish];
        if (batch && batch.servings > 0) {
          serveCustomer(eatery, c.id, batch.stars);
          const tip = tipFor(DISHES[c.dish].basePrice, batch.stars, c.servedAtPatience);
          // the server keeps their cut
          g.applyServe(c.dish, Math.max(1, Math.round(tip * (1 - SERVER_TIP_CUT))));
        }
        s.phase = "returning";
        s.carrying = null;
      }
      break;
    }
    case "returning": {
      s.carrying = null;
      if (walkServer(SERVER_HOME.x, SERVER_HOME.z, dt)) s.phase = "idle";
      break;
    }
  }
}

/* ---- the hired chef: keeps mastered dishes stocked from the back pot ---- */

function runChef(dt: number) {
  const g = useGame.getState();
  const chef = staffLive.chef;
  if (!chef.cooking) {
    const dish = pickChefDish(g.mastery, g.batches, g.stock);
    if (dish) {
      g.chefConsume(dish);
      chef.cooking = dish;
      chef.t = 0;
    }
    return;
  }
  chef.t += dt;
  if (chef.t >= CHEF_COOK_SECONDS) {
    g.applyChefBatch(chef.cooking, chefStars(g.bestStars[chef.cooking]), CHEF_FEE);
    chef.cooking = null;
    chef.t = 0;
  }
}

/** Serve a waiting customer from the counter. */
export function tryServe(customerId: number): boolean {
  const g = useGame.getState();
  const c = eatery.customers.find((c) => c.id === customerId);
  if (!c || c.phase !== "waiting") return false;
  const batch = g.batches[c.dish];
  if (!batch || batch.servings <= 0) {
    haptic("error");
    return false;
  }
  serveCustomer(eatery, customerId, batch.stars);
  g.applyServe(c.dish, tipFor(DISHES[c.dish].basePrice, batch.stars, c.servedAtPatience));
  haptic("success");
  emitIfChanged();
  return true;
}
