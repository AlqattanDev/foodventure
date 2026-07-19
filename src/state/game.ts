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

export type Phase = "idle" | "select" | "book" | "cook" | "rating" | "sell" | "shop" | "market";

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
  upgrades: Upgrades;
  /** the pantry — every cook consumes real stock */
  stock: Stock;
  result: CookResult | null;

  // derived helpers
  burnResist: () => number; // burn slowdown from upgrades
  sellBonus: () => number; // price bump from... (reserved, currently 0)
  canUnlock: (id: DishId) => boolean;
  canCookSelected: () => boolean;
  memoryAvailable: (id: DishId) => boolean;
  setCookMode: (m: CookMode) => void;

  // flow
  openSelect: () => void;
  select: (id: DishId) => void;
  openBook: () => void;
  startCook: () => void;
  finishRun: (rating: RunRating) => void;
  sell: () => void;
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
  upgrades: saved.upgrades ?? { pot: 0, stove: 0, shelf: 0 },
  stock: saved.stock ?? starterStock(),
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

  canCookSelected: () => canCook(get().stock, get().selected),

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

  openBook: () => set({ phase: "book", result: null, cookMode: "guided" }),

  startCook: () => {
    // pot-on consumes the shelf — a burnt batch still cost real ingredients
    if (!canCook(get().stock, get().selected)) return;
    set((s) => ({ phase: "cook", result: null, stock: consume(s.stock, s.selected) }));
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

  sell: () => {
    const r = get().result;
    if (!r) return set({ phase: "idle" });
    set((s) => ({ coins: s.coins + r.price, phase: "sell" }));
  },

  openShop: () => set({ phase: "shop" }),
  openMarket: () => set({ phase: "market" }),

  buyIngredient: (id, qty) => {
    const r = buy(get().stock, id, qty, get().coins, get().upgrades.shelf);
    if (r.bought === 0) return;
    set({ stock: r.stock, coins: r.coins });
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
