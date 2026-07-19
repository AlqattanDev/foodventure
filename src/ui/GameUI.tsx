import { AnimatePresence } from "framer-motion";
import { useGame } from "../state/game";
import { Hud } from "./Hud";
import { DishSelect } from "./DishSelect";
import { RecipeBook } from "./RecipeBook";
import { StagedCook } from "./StagedCook";
import { RatingCard } from "./RatingCard";
import { UpgradeShop } from "./UpgradeShop";
import { Market } from "./Market";
import { ServeTray, EateryController } from "./ServeTray";

/** All 2D game UI. Sits above the 3D canvas and switches on the game phase. */
export function GameUI() {
  const phase = useGame((s) => s.phase);
  return (
    <>
      <Hud />
      <EateryController />
      <ServeTray />
      <AnimatePresence mode="wait">
        {phase === "select" && <DishSelect key="select" />}
        {phase === "book" && <RecipeBook key="book" />}
        {phase === "cook" && <StagedCook key="cook" />}
        {phase === "rating" && <RatingCard key="rating" />}
        {phase === "shop" && <UpgradeShop key="shop" />}
        {phase === "market" && <Market key="market" />}
      </AnimatePresence>
    </>
  );
}
