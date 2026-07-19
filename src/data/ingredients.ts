/**
 * The souq market catalog + what each cook actually consumes.
 * Units are recipe-units: "1" = the amount one classic batch needs of a
 * staple (the cookbook amounts made purchasable). Water is free — nobody
 * buys water in a souq game.
 */
import type { DishId } from "./dishes";

export type IngredientId =
  | "sugar"
  | "starch"
  | "ghee"
  | "cardamom"
  | "saffron"
  | "rose"
  | "nuts";

export interface MarketItem {
  id: IngredientId;
  label: string;
  arabic: string;
  emoji: string;
  /** coins per unit at the souq */
  price: number;
  /** pantry capacity before shelf upgrades */
  baseCap: number;
  /** which souq stall sells it */
  stall: "grain" | "dairy" | "spice" | "nuts";
}

export const INGREDIENTS: Record<IngredientId, MarketItem> = {
  sugar:    { id: "sugar",    label: "Sugar",          arabic: "سكر",     emoji: "🍬", price: 3,  baseCap: 12, stall: "grain" },
  starch:   { id: "starch",   label: "Cornstarch",     arabic: "نشا",     emoji: "🌾", price: 2,  baseCap: 12, stall: "grain" },
  ghee:     { id: "ghee",     label: "Ghee",           arabic: "سمن",     emoji: "🧈", price: 5,  baseCap: 10, stall: "dairy" },
  cardamom: { id: "cardamom", label: "Cardamom",       arabic: "هيل",     emoji: "🫛", price: 4,  baseCap: 8,  stall: "spice" },
  saffron:  { id: "saffron",  label: "Saffron",        arabic: "زعفران",  emoji: "🌸", price: 12, baseCap: 6,  stall: "spice" },
  rose:     { id: "rose",     label: "Rose water",     arabic: "ماء ورد", emoji: "🌹", price: 6,  baseCap: 8,  stall: "spice" },
  nuts:     { id: "nuts",     label: "Almonds & pist.", arabic: "لوز وفستق", emoji: "🥜", price: 8, baseCap: 8, stall: "nuts" },
};

export const INGREDIENT_ORDER: IngredientId[] = [
  "sugar",
  "starch",
  "ghee",
  "cardamom",
  "saffron",
  "rose",
  "nuts",
];

/** What one full batch of each dish consumes. */
export const CONSUMPTION: Record<DishId, Partial<Record<IngredientId, number>>> = {
  classic: { sugar: 1, starch: 1, ghee: 1, cardamom: 1 },
  saffron: { sugar: 1, starch: 1, ghee: 1, cardamom: 1, saffron: 1, rose: 1 },
  royal:   { sugar: 1, starch: 1, ghee: 2, cardamom: 1, saffron: 1, rose: 1, nuts: 1 },
};
