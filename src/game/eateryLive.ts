/**
 * The running eatery: a mutable sim singleton (like cookViz) ticked by
 * <EateryController>, with a tiny external-store bridge so the 2D serve tray
 * re-renders only when something meaningful changes. The 3D floor reads the
 * singleton directly every frame.
 *
 * Pause rule (Ali's): only a PRACTICE cook stops the world. Service cooks,
 * menus and the market all run live — that pressure is the game.
 */
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import {
  createEatery,
  tickEatery,
  serveCustomer,
  tipFor,
  repDelta,
  type EateryState,
} from "./eatery";
import { haptic } from "./haptics";

export const eatery: EateryState = createEatery();

if ((import.meta as any).env?.DEV && typeof window !== "undefined") {
  (window as any).eatery = eatery;
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
  emitIfChanged();
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
