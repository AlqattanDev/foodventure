/**
 * The progression ladder: three real Bahraini halwa variations, each harder
 * to cook and worth more. The actual cooking process lives in recipes.ts;
 * this is the menu/econ card per dish.
 */

export type DishId = "classic" | "saffron" | "royal";

export interface Dish {
  id: DishId;
  name: string;
  arabic: string;
  /** menu/serving glyph */
  emoji: string;
  blurb: string;
  /** base sell price at 3 stars */
  basePrice: number;
  /** cook difficulty 1..3 — shown as 🌶️ on the dish card */
  difficulty: number;
  /** raw dough tint and finished glossy tint for the 3D halwa */
  rawColor: string;
  cookedColor: string;
  /** best stars required on the previous dish to unlock this one */
  unlockStars: number;
  /** coins to buy the unlock */
  unlockCost: number;
}

export const DISHES: Record<DishId, Dish> = {
  classic: {
    id: "classic",
    name: "Classic Halwa",
    arabic: "حلوى",
    emoji: "🍯",
    blurb: "Cornflour, sugar, ghee & cardamom, stirred to a glossy amber.",
    basePrice: 30,
    difficulty: 1,
    rawColor: "#e7d3a8",
    cookedColor: "#b5561f",
    unlockStars: 0,
    unlockCost: 0,
  },
  saffron: {
    id: "saffron",
    name: "Saffron Halwa",
    arabic: "حلوى بالزعفران",
    emoji: "🌸",
    blurb: "The classic laced with real saffron threads bloomed in rose water.",
    basePrice: 55,
    difficulty: 2,
    rawColor: "#ecdcb0",
    cookedColor: "#d0781a",
    unlockStars: 3,
    unlockCost: 150,
  },
  royal: {
    id: "royal",
    name: "Royal Halwa",
    arabic: "حلوى ملكية",
    emoji: "👑",
    blurb: "Saffron, rose water and toasted nuts folded through — the feast-day halwa.",
    basePrice: 95,
    difficulty: 3,
    rawColor: "#e8d6a6",
    cookedColor: "#a83c14",
    unlockStars: 3,
    unlockCost: 400,
  },
};

export const DISH_ORDER: DishId[] = ["classic", "saffron", "royal"];
