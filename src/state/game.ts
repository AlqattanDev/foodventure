import { create } from "zustand";
import { DISHES, DISH_ORDER, type DishId } from "../data/dishes";
import { priceFor } from "../game/scoring";
import type { RunRating } from "../game/recipe";
import {
  FRESH_MASTERY,
  advanceMastery,
  memoryUnlocked,
  type CookMode,
  type MasteryState,
} from "../game/mastery";
import {
  starterStock,
  canCook,
  consume,
  buy,
  ummKhalidLends,
  type Stock,
  type IngredientId,
} from "../game/pantry";
import {
  closeOutDay,
  LEDGER_HISTORY,
  type DayLedger,
  type DayTallies,
} from "../game/ledger";

export type Phase = "idle" | "select" | "book" | "cook" | "rating" | "shop" | "market" | "ledger";

/** Why the pot went on: a batch for the counter, or a paused practice run. */
export type CookPurpose = "service" | "practice";

export interface Batch {
  stars: number;
  servings: number;
}

/** Cost of the 3rd..6th table. */
export const TABLE_COST = [80, 150, 240, 360];
export const SERVINGS_PER_BATCH = 5;

export interface Staff {
  server: boolean;
  chef: boolean;
}

export interface Upgrades {
  /** 0..2 — slower burn (a thicker pot forgives) */
  pot: number;
  /** 0..2 — finer heat, more forgiving cook */
  stove: number;
  /** 0..2 — pantry shelf capacity ×2, ×3 */
  shelf: number;
}

export const UPGRADE_COST = {
  pot: [120, 260],
  stove: [140, 300],
  shelf: [100, 220],
};

export interface CookResult {
  dish: DishId;
  rating: RunRating;
  stars: number;
  burnt: boolean;
  price: number;
  mode: CookMode;
  /** this run is the one that mastered the dish */
  justMastered: boolean;
}

interface GameState {
  phase: Phase;
  coins: number;
  selected: DishId;
  unlocked: Record<DishId, boolean>;
  bestStars: Record<DishId, number>;
  mastery: Record<DishId, MasteryState>;
  /** how the current/next cook runs — guided (book + hints) or from memory */
  cookMode: CookMode;
  /** service = batch for the counter (world keeps running); practice = paused, half ingredients */
  cookPurpose: CookPurpose;
  upgrades: Upgrades;
  /** the pantry — every cook consumes real stock */
  stock: Stock;
  /** the counter — one batch per dish, what customers are served from */
  batches: Record<DishId, Batch | null>;
  /** 0..5 — how the souq talks about the place; drives walk-ins */
  reputation: number;
  /** owned tables (2..6) */
  tables: number;
  /** the eatery goes live once the first batch reaches the counter */
  opened: boolean;
  /** hired hands — the server carries plates, the chef cooks mastered dishes */
  staff: Staff;
  /** the business: numbered service days with close-out books */
  day: number;
  dayOpen: boolean;
  dayTallies: DayTallies;
  /** market spend while closed — attributed to the next opened day */
  pendingSpend: number;
  repStart: number;
  ledgers: DayLedger[];
  result: CookResult | null;

  // derived helpers
  burnResist: () => number; // burn slowdown from upgrades
  sellBonus: () => number; // price bump from... (reserved, currently 0)
  canUnlock: (id: DishId) => boolean;
  canCookSelected: () => boolean;
  memoryAvailable: (id: DishId) => boolean;
  setCookMode: (m: CookMode) => void;
  setCookPurpose: (p: CookPurpose) => void;

  // flow
  openSelect: () => void;
  select: (id: DishId) => void;
  openBook: () => void;
  startCook: () => void;
  finishRun: (rating: RunRating) => void;
  /** the finished batch goes to the counter; the eatery is live from then on */
  stockBatch: () => void;
  /** a serving leaves the counter, the tip comes in (called by the eatery runtime) */
  applyServe: (dish: DishId, tip: number) => void;
  applyRep: (delta: number) => void;
  /** a customer walked out unserved — the day's books remember */
  applyLost: () => void;
  buyTable: () => void;
  hireStaff: (kind: keyof Staff, cost: number) => void;
  /** chef pot-on: consume the pantry for a dish (runtime already validated) */
  chefConsume: (dish: DishId) => void;
  /** chef batch lands on the counter (the chef's wage is paid at close-out) */
  applyChefBatch: (dish: DishId, stars: number) => void;
  /** the tycoon day */
  openDay: () => void;
  closeDay: () => void;
  openShop: () => void;
  openMarket: () => void;
  buyIngredient: (id: IngredientId, qty: number) => void;
  buyUpgrade: (kind: keyof Upgrades) => void;
  buyUnlock: (id: DishId) => void;
  toIdle: () => void;
}

/* ---------------- persistence ---------------- */

const SAVE_KEY = "foodventure-save-v3";

interface SaveBlob {
  coins: number;
  unlocked: Record<DishId, boolean>;
  bestStars: Record<DishId, number>;
  mastery: Record<DishId, MasteryState>;
  upgrades: Upgrades;
  stock: Stock;
  batches: Record<DishId, Batch | null>;
  reputation: number;
  tables: number;
  opened: boolean;
  staff: Staff;
  day: number;
  ledgers: DayLedger[];
  pendingSpend: number;
}

function loadSave(): Partial<SaveBlob> {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SaveBlob;
  } catch {
    return {};
  }
}

function persist(s: GameState) {
  try {
    const blob: SaveBlob = {
      coins: s.coins,
      unlocked: s.unlocked,
      bestStars: s.bestStars,
      mastery: s.mastery,
      upgrades: s.upgrades,
      stock: s.stock,
      batches: s.batches,
      reputation: s.reputation,
      tables: s.tables,
      opened: s.opened,
      staff: s.staff,
      day: s.day,
      ledgers: s.ledgers,
      pendingSpend: s.pendingSpend,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
  } catch {
    /* storage full/blocked — the game still plays */
  }
}

const saved = typeof window !== "undefined" ? loadSave() : {};

export const useGame = create<GameState>((set, get) => ({
  phase: "idle",
  coins: saved.coins ?? 60,
  selected: "classic",
  unlocked: saved.unlocked ?? { classic: true, saffron: false, royal: false },
  bestStars: saved.bestStars ?? { classic: 0, saffron: 0, royal: 0 },
  mastery: saved.mastery ?? { classic: FRESH_MASTERY, saffron: FRESH_MASTERY, royal: FRESH_MASTERY },
  cookMode: "guided",
  cookPurpose: "service",
  upgrades: saved.upgrades ?? { pot: 0, stove: 0, shelf: 0 },
  stock: saved.stock ?? starterStock(),
  batches: saved.batches ?? { classic: null, saffron: null, royal: null },
  reputation: saved.reputation ?? 0,
  tables: saved.tables ?? 2,
  opened: saved.opened ?? false,
  staff: saved.staff ?? { server: false, chef: false },
  day: saved.day ?? 1,
  dayOpen: false,
  dayTallies: { revenue: 0, ingredientSpend: 0, served: 0, lost: 0 },
  pendingSpend: saved.pendingSpend ?? 0,
  repStart: 0,
  ledgers: saved.ledgers ?? [],
  result: null,

  burnResist: () => get().upgrades.pot * 0.12 + get().upgrades.stove * 0.14,
  sellBonus: () => 0,

  canUnlock: (id) => {
    const dish = DISHES[id];
    const idx = DISH_ORDER.indexOf(id);
    if (idx <= 0) return true;
    const prev = DISH_ORDER[idx - 1];
    return (
      !get().unlocked[id] &&
      get().bestStars[prev] >= dish.unlockStars &&
      get().coins >= dish.unlockCost
    );
  },

  canCookSelected: () => canCook(get().stock, get().selected, get().cookPurpose === "practice"),

  openSelect: () => {
    // the neighbour rule: never let the game softlock on an empty shelf
    const lent = ummKhalidLends(get().stock, get().coins, get().unlocked);
    set({ phase: "select", ...(lent ? { stock: lent } : {}) });
  },
  select: (id) => {
    if (!get().unlocked[id]) return;
    set({ selected: id, phase: "select" });
  },
  memoryAvailable: (id) => memoryUnlocked(get().mastery[id]),
  setCookMode: (m) => set({ cookMode: m }),
  setCookPurpose: (p) => set({ cookPurpose: p }),

  openBook: () => set({ phase: "book", result: null, cookMode: "guided", cookPurpose: "service" }),

  startCook: () => {
    // pot-on consumes the shelf — a burnt batch still cost real ingredients
    const half = get().cookPurpose === "practice";
    if (!canCook(get().stock, get().selected, half)) return;
    set((s) => ({ phase: "cook", result: null, stock: consume(s.stock, s.selected, half) }));
  },

  finishRun: (rating) => {
    const dish = get().selected;
    const mode = get().cookMode;
    const price = priceFor(DISHES[dish], rating.stars, get().sellBonus());
    const before = get().mastery[dish];
    const after = advanceMastery(before, mode, rating.stars);
    set((s) => ({
      phase: "rating",
      result: {
        dish,
        rating,
        stars: rating.stars,
        burnt: rating.burnt,
        price,
        mode,
        justMastered: after.mastered && !before.mastered,
      },
      mastery: { ...s.mastery, [dish]: after },
      bestStars: {
        ...s.bestStars,
        [dish]: Math.max(s.bestStars[dish], rating.stars),
      },
    }));
  },

  stockBatch: () => {
    const r = get().result;
    if (!r || r.burnt || r.stars === 0 || get().cookPurpose === "practice") {
      return set({ phase: "idle" });
    }
    set((s) => ({
      phase: "idle",
      opened: true,
      batches: { ...s.batches, [r.dish]: { stars: r.stars, servings: SERVINGS_PER_BATCH } },
    }));
  },

  applyServe: (dish, tip) => {
    const b = get().batches[dish];
    if (!b || b.servings <= 0) return;
    const left = b.servings - 1;
    set((s) => ({
      coins: s.coins + tip,
      batches: { ...s.batches, [dish]: left > 0 ? { ...b, servings: left } : null },
      dayTallies: {
        ...s.dayTallies,
        revenue: s.dayTallies.revenue + tip,
        served: s.dayTallies.served + 1,
      },
    }));
  },

  applyRep: (delta) =>
    set((s) => ({ reputation: Math.max(0, Math.min(5, s.reputation + delta)) })),

  applyLost: () =>
    set((s) => ({ dayTallies: { ...s.dayTallies, lost: s.dayTallies.lost + 1 } })),

  buyTable: () => {
    const t = get().tables;
    if (t >= 6) return;
    const cost = TABLE_COST[t - 2];
    if (get().coins < cost) return;
    set((s) => ({ coins: s.coins - cost, tables: t + 1 }));
  },

  hireStaff: (kind, cost) => {
    if (get().staff[kind] || get().coins < cost) return;
    set((s) => ({ coins: s.coins - cost, staff: { ...s.staff, [kind]: true } }));
  },

  chefConsume: (dish) => set((s) => ({ stock: consume(s.stock, dish) })),

  applyChefBatch: (dish, stars) =>
    set((s) => ({
      batches: { ...s.batches, [dish]: { stars, servings: SERVINGS_PER_BATCH } },
    })),

  openDay: () => {
    if (!get().opened || get().dayOpen) return;
    set((s) => ({
      dayOpen: true,
      repStart: s.reputation,
      // prep-time market runs belong to the day they feed
      dayTallies: { revenue: 0, ingredientSpend: s.pendingSpend, served: 0, lost: 0 },
      pendingSpend: 0,
      phase: "idle",
    }));
  },

  closeDay: () => {
    if (!get().dayOpen) return;
    const s = get();
    const { ledger, coinsAfter } = closeOutDay(
      s.day,
      s.dayTallies,
      { servers: s.staff.server ? 1 : 0, chefs: s.staff.chef ? 1 : 0 },
      0,
      s.repStart,
      s.reputation,
      s.coins
    );
    set((st) => ({
      dayOpen: false,
      day: st.day + 1,
      coins: coinsAfter,
      ledgers: [...st.ledgers, ledger].slice(-LEDGER_HISTORY),
      dayTallies: { revenue: 0, ingredientSpend: 0, served: 0, lost: 0 },
      phase: "ledger",
    }));
  },

  openShop: () => set({ phase: "shop" }),
  openMarket: () => set({ phase: "market" }),

  buyIngredient: (id, qty) => {
    const r = buy(get().stock, id, qty, get().coins, get().upgrades.shelf);
    if (r.bought === 0) return;
    const spent = get().coins - r.coins;
    set((s) => ({
      stock: r.stock,
      coins: r.coins,
      // spend while open hits today's books; prep buys roll into the next day
      ...(s.dayOpen
        ? { dayTallies: { ...s.dayTallies, ingredientSpend: s.dayTallies.ingredientSpend + spent } }
        : { pendingSpend: s.pendingSpend + spent }),
    }));
  },

  buyUpgrade: (kind) => {
    const lvl = get().upgrades[kind];
    if (lvl >= 2) return;
    const cost = UPGRADE_COST[kind][lvl];
    if (get().coins < cost) return;
    set((s) => ({
      coins: s.coins - cost,
      upgrades: { ...s.upgrades, [kind]: lvl + 1 },
    }));
  },

  buyUnlock: (id) => {
    if (!get().canUnlock(id)) return;
    const cost = DISHES[id].unlockCost;
    set((s) => ({
      coins: s.coins - cost,
      unlocked: { ...s.unlocked, [id]: true },
      selected: id,
    }));
  },

  toIdle: () => set({ phase: "idle" }),
}));

if (typeof window !== "undefined") {
  useGame.subscribe((s) => persist(s));
}

// dev-only handle for quick manual/automated verification in the browser
if ((import.meta as any).env?.DEV && typeof window !== "undefined") {
  (window as any).useGame = useGame;
}
