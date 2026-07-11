import { motion } from "framer-motion";
import { DISHES, DISH_ORDER } from "../data/dishes";
import { useGame } from "../state/game";
import { Button, Stars } from "./kit";
import { C, FONT, pop } from "./theme";
import { haptic } from "../game/haptics";

export function DishSelect() {
  const g = useGame();

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.sheet}>
        <div style={S.title}>Choose your halwa</div>
        <div style={S.cards}>
          {DISH_ORDER.map((id) => {
            const dish = DISHES[id];
            const unlocked = g.unlocked[id];
            const selected = g.selected === id;
            return (
              <motion.button
                key={id}
                whileTap={unlocked ? { scale: 0.97 } : undefined}
                onClick={() => {
                  if (!unlocked) return;
                  haptic("light");
                  g.select(id);
                }}
                style={{
                  ...S.card,
                  opacity: unlocked ? 1 : 0.55,
                  borderColor: selected ? C.gold : "rgba(255,200,140,0.18)",
                  boxShadow: selected ? `0 0 0 2px ${C.gold}, 0 14px 34px rgba(0,0,0,0.4)` : "0 10px 26px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ ...S.swatch, background: `linear-gradient(140deg, ${dish.rawColor}, ${dish.cookedColor})` }}>
                  {!unlocked && <span style={S.lock}>🔒</span>}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={S.name}>{dish.name} <span style={S.arabic}>{dish.arabic}</span></div>
                  <div style={S.blurb}>{dish.blurb}</div>
                  <div style={S.meta}>
                    <Stars value={g.bestStars[id]} size={14} />
                    <span style={S.price}>🪙 {dish.basePrice}+</span>
                    <span style={S.diff}>{"🌶️".repeat(dish.difficulty)}</span>
                    {g.mastery[id].mastered && <span style={{ fontSize: 13 }}>🏅</span>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <Button variant="gold" onClick={g.openBook} style={{ width: "100%", marginTop: 8 }}>
          Open the recipe 📖
        </Button>
        <button style={S.link} onClick={g.openShop}>upgrades & unlocks</button>
      </motion.div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, display: "grid", placeItems: "center", fontFamily: FONT, pointerEvents: "auto", padding: 18 },
  sheet: {
    width: "min(92vw, 440px)",
    maxHeight: "88vh",
    overflowY: "auto",
    background: "linear-gradient(180deg, rgba(48,26,14,0.94), rgba(28,15,7,0.96))",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,200,140,0.28)",
    borderRadius: 28,
    padding: 22,
    color: C.cream,
    boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
  },
  title: { fontSize: 22, fontWeight: 900, marginBottom: 14, textAlign: "center" },
  cards: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  card: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    padding: 14,
    borderRadius: 22,
    background: "rgba(255,240,220,0.05)",
    border: "1px solid",
    cursor: "pointer",
    fontFamily: FONT,
    color: C.cream,
  },
  swatch: {
    width: 62,
    height: 62,
    borderRadius: 18,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.3)",
  },
  lock: { fontSize: 26, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" },
  name: { fontSize: 17, fontWeight: 900 },
  arabic: { fontSize: 14, fontWeight: 600, opacity: 0.7, marginLeft: 4 },
  blurb: { fontSize: 12.5, opacity: 0.82, margin: "3px 0 7px", lineHeight: 1.3 },
  meta: { display: "flex", alignItems: "center", gap: 12 },
  price: { fontSize: 13, fontWeight: 800, color: C.gold },
  diff: { fontSize: 12 },
  link: { display: "block", margin: "12px auto 0", background: "none", border: "none", color: C.creamDim, fontSize: 13, textDecoration: "underline", cursor: "pointer", pointerEvents: "auto", fontFamily: FONT },
};
