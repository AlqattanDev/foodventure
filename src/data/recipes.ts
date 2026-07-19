/**
 * The cookbook: Halwa Bahrainiya's real process as staged recipes.
 * Educational content is genuine — a player who reads the book learns how
 * halwa is actually made (starch not flour, bloomed saffron, ghee in batches,
 * the long patient stir, calling doneness by look).
 *
 * Menu/econ meta lives in dishes.ts; pantry economics in ingredients.ts.
 */
import { DISHES, type Dish, type DishId } from "./dishes";
import type { RecipeStep } from "../game/recipe";
import type { IngredientId } from "./ingredients";

export interface CookbookIngredient {
  label: string;
  arabic: string;
  emoji: string;
  amount: string;
  /** pantry id — water has none, nobody stocks water */
  id?: IngredientId;
}

export interface Recipe {
  dish: Dish;
  /** the full ingredient list shown on the cookbook page */
  ingredients: CookbookIngredient[];
  /** one-paragraph story for the cookbook page */
  intro: string;
  steps: RecipeStep[];
}

const STARCH: CookbookIngredient = { id: "starch", label: "Cornstarch", arabic: "نشا", emoji: "🌾", amount: "1 cup" };
const SUGAR: CookbookIngredient = { id: "sugar", label: "Sugar", arabic: "سكر", emoji: "🍬", amount: "3 cups" };
const WATER: CookbookIngredient = { label: "Water", arabic: "ماء", emoji: "💧", amount: "5 cups" };
const GHEE: CookbookIngredient = { id: "ghee", label: "Ghee", arabic: "سمن", emoji: "🧈", amount: "¾ cup" };
const CARDAMOM: CookbookIngredient = { id: "cardamom", label: "Ground cardamom", arabic: "هيل", emoji: "🫛", amount: "1 tsp" };
const SAFFRON: CookbookIngredient = { id: "saffron", label: "Saffron threads", arabic: "زعفران", emoji: "🌸", amount: "a generous pinch" };
const ROSE: CookbookIngredient = { id: "rose", label: "Rose water", arabic: "ماء ورد", emoji: "🌹", amount: "2 tbsp" };
const NUTS: CookbookIngredient = { id: "nuts", label: "Almonds & pistachios", arabic: "لوز وفستق", emoji: "🥜", amount: "½ cup, slivered" };

/** Shared skeleton — variations tighten windows and add their own touches. */
function halwaSteps(opts: {
  saffronInSyrup: boolean;
  gheeBatches: number;
  spiceAdds: { key: string; label: string; emoji: string; color: string; amount: string }[];
  smoothSeconds: number;
  holdSeconds: number;
  finishWindow: [number, number];
}): RecipeStep[] {
  return [
    {
      id: "base",
      kind: "pour-stir",
      title: "The syrup base",
      instruction: "Measure the sugar and water into the pot — fill each to the line.",
      edu: opts.saffronInSyrup
        ? "Everything starts with sugar and water in the pot — and the saffron threads dropped in now, so they bloom as it heats and stain the whole syrup gold. Measure honestly: halwa is a ratio before it is anything else."
        : "Everything starts with sugar and water in the pot. Measure honestly — halwa is a ratio before it is anything else; too much water and it never sets, too little and it candies.",
      tip: "Pour to the line. A dribble too far can be spooned back out.",
      pours: [
        { key: "sugar", label: "Sugar", emoji: "🍬", color: "#f2ead6", amount: "3 cups", target: 0.7, tolerance: 0.12 },
        { key: "syrupwater", label: "Water", emoji: "💧", color: "#bcd8e8", amount: "5 cups", target: 0.75, tolerance: 0.12 },
      ],
      smoothSeconds: 2,
      weight: 0.75,
    },
    {
      id: "syrup",
      kind: "heat-hold",
      title: "The simmer",
      instruction: "Open the gas and watch the rim — small beads mean simmer. Hold it there.",
      edu: "Bring the syrup to a gentle simmer — bubbles beading at the rim, not a rolling boil. Rushing the syrup darkens the sugar before the halwa even begins. There is no thermometer: the bubbles are the thermometer.",
      tip: "Beads at the rim = simmer. A rolling surface = too hot, ease the knob.",
      band: [0.45, 0.7],
      holdSeconds: opts.holdSeconds,
    },
    {
      id: "slurry",
      kind: "pour-stir",
      title: "The slurry",
      instruction: "Pour the cornstarch into cold water, then stir until silky.",
      edu: "Halwa Bahrainiya is a starch sweet, not a flour one — cornstarch (nisha) dissolved in COLD water. Cold matters: starch in hot water seizes into lumps instantly. Stir until it runs silky off the spoon.",
      tip: "Cold water only. Lumps here survive all the way to the pot.",
      pours: [
        { key: "starch", label: "Cornstarch", emoji: "🌾", color: "#efe0b8", amount: "1 cup", target: 0.6, tolerance: 0.14 },
        { key: "water", label: "Cold water", emoji: "💧", color: "#bcd8e8", amount: "2 cups", target: 0.65, tolerance: 0.14 },
      ],
      smoothSeconds: opts.smoothSeconds,
    },
    {
      id: "combine",
      kind: "pour-while-stir",
      title: "Marrying them",
      instruction: "Pour the slurry into the simmering syrup in a thin stream — never stop stirring.",
      edu: "The make-or-break moment: the slurry goes into the hot syrup in a slow, thin stream while the other hand never stops stirring. Pour fast and it lumps; stop stirring and it sticks and scorches.",
      tip: "Thin stream, constant stir. Patience beats speed.",
      weight: 1.25,
    },
    {
      id: "longstir",
      kind: "stir-batches",
      title: "The long stir",
      instruction: "Keep a steady stir on medium heat. When the shine dulls, ladle in the next ghee.",
      edu: `Now the halwa earns its cook. Steady circles over medium heat while it thickens and turns translucent. The ghee goes in ${opts.gheeBatches} ladles, never at once — each ladle only after the last is absorbed. You can see it ask: the surface loses its shine.`,
      tip: "Shine gone = the pot is asking for ghee.",
      batches: Array.from({ length: opts.gheeBatches }, (_, i) => ({
        key: `ghee${i + 1}`,
        label: `Ghee ladle ${i + 1}`,
        emoji: "🧈",
        color: "#f3c65a",
        amount: "¼ cup",
      })),
      durationSeconds: 24,
      weight: 2,
    },
    {
      id: "spices",
      kind: "timed-add",
      title: "The perfume",
      instruction: "Spices go in near the end — catch each cue.",
      edu: "Cardamom, rose water and their friends are perfume, and perfume burns off. They go in near the end, once the halwa is nearly set, so the aroma survives to the plate.",
      tip: "Late is better than early — aroma fades in a hot pot.",
      adds: opts.spiceAdds,
    },
    {
      id: "finish",
      kind: "finish-call",
      title: "Calling it",
      instruction: "Watch the pot — translucent, glossy, pulling off the sides. YOU call when it's done.",
      edu: "No timer decides halwa. The cook reads the pot: translucent amber, a deep gloss, the mass pulling away from the sides in one body. Pull early and it's pale and loose; late and it's dark and rubbery.",
      tip: "Glossy, amber, one stretchy body — that's the moment.",
      idealWindow: opts.finishWindow,
      weight: 1.5,
    },
  ];
}

export const RECIPES: Record<DishId, Recipe> = {
  classic: {
    dish: DISHES.classic,
    intro:
      "The halwa of every Bahraini majlis — cornstarch, sugar and ghee stirred patiently into a glossy amber, scented with cardamom. Simple to list, honest to cook.",
    ingredients: [STARCH, SUGAR, WATER, GHEE, CARDAMOM],
    steps: halwaSteps({
      saffronInSyrup: false,
      gheeBatches: 3,
      spiceAdds: [
        { key: "cardamom", label: "Cardamom", emoji: "🫛", color: "#8bb06a", amount: "1 tsp" },
      ],
      smoothSeconds: 4,
      holdSeconds: 6,
      finishWindow: [0.7, 0.9],
    }),
  },
  saffron: {
    dish: DISHES.saffron,
    intro:
      "The classic, elevated: real saffron threads bloomed in the syrup itself, staining the whole batch gold, finished with a splash of rose water.",
    ingredients: [STARCH, SUGAR, WATER, GHEE, SAFFRON, CARDAMOM, ROSE],
    steps: halwaSteps({
      saffronInSyrup: true,
      gheeBatches: 3,
      spiceAdds: [
        { key: "cardamom", label: "Cardamom", emoji: "🫛", color: "#8bb06a", amount: "1 tsp" },
        { key: "rose", label: "Rose water", emoji: "🌹", color: "#f0a6bd", amount: "2 tbsp" },
      ],
      smoothSeconds: 5,
      holdSeconds: 7,
      finishWindow: [0.72, 0.88],
    }),
  },
  royal: {
    dish: DISHES.royal,
    intro:
      "The feast-day halwa: saffron gold, rose perfume, and toasted almonds and pistachios folded through the amber. Served at weddings and Eid — the pot that proves a cook.",
    ingredients: [STARCH, SUGAR, WATER, GHEE, SAFFRON, CARDAMOM, ROSE, NUTS],
    steps: halwaSteps({
      saffronInSyrup: true,
      gheeBatches: 4,
      spiceAdds: [
        { key: "cardamom", label: "Cardamom", emoji: "🫛", color: "#8bb06a", amount: "1 tsp" },
        { key: "rose", label: "Rose water", emoji: "🌹", color: "#f0a6bd", amount: "2 tbsp" },
        { key: "nuts", label: "Toasted nuts", emoji: "🥜", color: "#d69a5a", amount: "½ cup" },
      ],
      smoothSeconds: 5,
      holdSeconds: 8,
      finishWindow: [0.74, 0.86],
    }),
  },
};
