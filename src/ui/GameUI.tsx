import { AnimatePresence } from "framer-motion";
import { useGame } from "../state/game";
import { Hud } from "./Hud";
import { DishSelect } from "./DishSelect";
import { RecipeBook } from "./RecipeBook";
import { StagedCook } from "./StagedCook";
import { RatingCard } from "./RatingCard";
import { SellCard } from "./SellCard";
import { UpgradeShop } from "./UpgradeShop";

/** All 2D game UI. Sits above the 3D canvas and switches on the game phase. */
export function GameUI() {
  const phase = useGame((s) => s.phase);
  return (
    <>
      <Hud />
      <AnimatePresence mode="wait">
        {phase === "select" && <DishSelect key="select" />}
        {phase === "book" && <RecipeBook key="book" />}
        {phase === "cook" && <StagedCook key="cook" />}
        {phase === "rating" && <RatingCard key="rating" />}
        {phase === "sell" && <SellCard key="sell" />}
        {phase === "shop" && <UpgradeShop key="shop" />}
      </AnimatePresence>
    </>
  );
}
