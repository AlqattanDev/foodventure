import { create } from "zustand";
import { DISHES, DISH_ORDER, type DishId } from "../data/dishes";
import { priceFor, starsFor } from "../game/scoring";

export type Phase = "idle" | "select" | "prep" | "cook" | "rating" | "sell" | "shop";

export interface Upgrades {
  /** 0..2 — wider stir tolerance, slower burn */
  pot: number;
  /** 0..2 — finer heat, more forgiving cook */
  stove: number;
}

export const UPGRADE_COST = {
  pot: [120, 260],
  stove: [140, 300],
};

export interface CookResult {
  dish: DishId;
  prep: number;
  cook: number;
  stars: number;
  burnt: boolean;
  price: number;
}

interface GameState {
  phase: Phase;
  coins: number;
  selected: DishId;
  unlocked: Record<DishId, boolean>;
  bestStars: Record<DishId, number>;
  upgrades: Upgrades;
  prepAmounts: Record<string, number>;
  prepScore: number;
  result: CookResult | null;

  // derived helpers
  potTolerance: () => number; // extra stir band from pot upgrade
  burnResist: () => number; // burn slowdown from upgrades
  sellBonus: () => number; // price bump from... (reserved, currently 0)
  canUnlock: (id: DishId) => boolean;

  // flow
  openSelect: () => void;
  select: (id: DishId) => void;
  startPrep: () => void;
  finishPrep: (prepScore: number, amounts: Record<string, number>) => void;
  finishCook: (prep: number, cook: number, burnt: boolean) => void;
  sell: () => void;
  openShop: () => void;
  buyUpgrade: (kind: "pot" | "stove") => void;
  buyUnlock: (id: DishId) => void;
  toIdle: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "idle",
  coins: 60,
  selected: "classic",
  unlocked: { classic: true, saffron: false, royal: false },
  bestStars: { classic: 0, saffron: 0, royal: 0 },
  upgrades: { pot: 0, stove: 0 },
  prepAmounts: {},
  prepScore: 1,
  result: null,

  potTolerance: () => get().upgrades.pot * 0.05,
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

  openSelect: () => set({ phase: "select" }),
  select: (id) => {
    if (!get().unlocked[id]) return;
    set({ selected: id, phase: "select" });
  },
  startPrep: () => set({ phase: "prep", prepAmounts: {}, result: null }),
  finishPrep: (prepScore, amounts) =>
    set({ prepScore, prepAmounts: amounts, phase: "cook" }),

  finishCook: (prep, cook, burnt) => {
    const dish = get().selected;
    const stars = starsFor(prep, cook, burnt);
    const price = priceFor(DISHES[dish], stars, get().sellBonus());
    set((s) => ({
      phase: "rating",
      result: { dish, prep, cook, stars, burnt, price },
      bestStars: {
        ...s.bestStars,
        [dish]: Math.max(s.bestStars[dish], stars),
      },
    }));
  },

  sell: () => {
    const r = get().result;
    if (!r) return set({ phase: "idle" });
    set((s) => ({ coins: s.coins + r.price, phase: "sell" }));
  },

  openShop: () => set({ phase: "shop" }),

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

// dev-only handle for quick manual/automated verification in the browser
if ((import.meta as any).env?.DEV && typeof window !== "undefined") {
  (window as any).useGame = useGame;
}
