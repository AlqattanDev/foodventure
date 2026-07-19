/**
 * The progression ladder: three real Bahraini halwa variations.
 * Method & ingredients are authentic (cornflour/starch, sugar, ghee, saffron,
 * cardamom, rose water, nuts). Each harder to cook and worth more.
 */

export type DishId = "classic" | "saffron" | "royal";

export interface Ingredient {
  key: string;
  label: string;
  emoji: string;
  color: string;
  /** target pour amount, 0..1 of the gauge */
  target: number;
  /** half-width of the "perfect" band around target */
  tolerance: number;
}

/** A scripted moment during the cook where the player taps to add something. */
export interface CookEvent {
  /** cook progress 0..1 at which the cue appears */
  at: number;
  label: string;
  emoji: string;
  color: string;
}

export interface Dish {
  id: DishId;
  name: string;
  arabic: string;
  blurb: string;
  /** base sell price at 3 stars */
  basePrice: number;
  /** cook difficulty 1..3 — shown as 🌶️ on the dish card */
  difficulty: number;
  /** raw dough tint and finished glossy tint for the 3D halwa */
  rawColor: string;
  cookedColor: string;
  ingredients: Ingredient[];
  events: CookEvent[];
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
    blurb: "Cornflour, sugar, ghee & cardamom, stirred to a glossy amber.",
    basePrice: 30,
    difficulty: 1,
    rawColor: "#e7d3a8",
    cookedColor: "#b5561f",
    ingredients: [
      { key: "starch", label: "Cornflour", emoji: "🌾", color: "#efe0b8", target: 0.6, tolerance: 0.14 },
      { key: "sugar", label: "Sugar", emoji: "🍬", color: "#fdf6e8", target: 0.7, tolerance: 0.14 },
      { key: "ghee", label: "Ghee", emoji: "🧈", color: "#f3c65a", target: 0.4, tolerance: 0.12 },
      { key: "cardamom", label: "Cardamom", emoji: "🫛", color: "#6f8f5a", target: 0.25, tolerance: 0.1 },
    ],
    events: [{ at: 0.55, label: "Cardamom", emoji: "🫛", color: "#8bb06a" }],
    unlockStars: 0,
    unlockCost: 0,
  },
  saffron: {
    id: "saffron",
    name: "Saffron Halwa",
    arabic: "حلوى بالزعفران",
    blurb: "The classic laced with real saffron threads bloomed in rose water.",
    basePrice: 55,
    difficulty: 2,
    rawColor: "#ecdcb0",
    cookedColor: "#d0781a",
    ingredients: [
      { key: "starch", label: "Cornflour", emoji: "🌾", color: "#efe0b8", target: 0.6, tolerance: 0.12 },
      { key: "sugar", label: "Sugar", emoji: "🍬", color: "#fdf6e8", target: 0.72, tolerance: 0.12 },
      { key: "ghee", label: "Ghee", emoji: "🧈", color: "#f3c65a", target: 0.45, tolerance: 0.11 },
      { key: "saffron", label: "Saffron", emoji: "🌸", color: "#e8a33d", target: 0.3, tolerance: 0.09 },
      { key: "cardamom", label: "Cardamom", emoji: "🫛", color: "#6f8f5a", target: 0.25, tolerance: 0.09 },
    ],
    events: [
      { at: 0.42, label: "Saffron", emoji: "🌸", color: "#f0b24a" },
      { at: 0.7, label: "Cardamom", emoji: "🫛", color: "#8bb06a" },
    ],
    unlockStars: 3,
    unlockCost: 150,
  },
  royal: {
    id: "royal",
    name: "Royal Halwa",
    arabic: "حلوى ملكية",
    blurb: "Saffron, rose water and toasted nuts folded through — the feast-day halwa.",
    basePrice: 95,
    difficulty: 3,
    rawColor: "#e8d6a6",
    cookedColor: "#a83c14",
    ingredients: [
      { key: "starch", label: "Cornflour", emoji: "🌾", color: "#efe0b8", target: 0.62, tolerance: 0.1 },
      { key: "sugar", label: "Sugar", emoji: "🍬", color: "#fdf6e8", target: 0.72, tolerance: 0.1 },
      { key: "ghee", label: "Ghee", emoji: "🧈", color: "#f3c65a", target: 0.5, tolerance: 0.1 },
      { key: "saffron", label: "Saffron", emoji: "🌸", color: "#e8a33d", target: 0.32, tolerance: 0.08 },
      { key: "rose", label: "Rose Water", emoji: "🌹", color: "#e79ab0", target: 0.28, tolerance: 0.08 },
      { key: "nuts", label: "Nuts", emoji: "🥜", color: "#c58a4a", target: 0.4, tolerance: 0.09 },
    ],
    events: [
      { at: 0.35, label: "Saffron", emoji: "🌸", color: "#f0b24a" },
      { at: 0.58, label: "Rose Water", emoji: "🌹", color: "#f0a6bd" },
      { at: 0.78, label: "Nuts", emoji: "🥜", color: "#d69a5a" },
    ],
    unlockStars: 3,
    unlockCost: 400,
  },
};

export const DISH_ORDER: DishId[] = ["classic", "saffron", "royal"];
