import { motion } from "framer-motion";
import { DISHES, DISH_ORDER } from "../data/dishes";
import { useGame } from "../state/game";
import { payFor, valueVerdict, PRICE_MIN, PRICE_MAX, PRICE_STEP } from "../game/menu";
import { Button } from "./kit";
import { C, FONT, pop } from "./theme";

/**
 * The menu board: your prices, your call. Shows what a serving of the
 * CURRENT batch would list at, and how the souq will judge the value.
 */
export function MenuBoard() {
  const g = useGame();

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.board}>
        <div style={S.head}>
          <div style={S.title}>Menu Board</div>
          <div style={S.sub}>قائمة اليوم · set your prices</div>
        </div>

        {DISH_ORDER.filter((id) => g.unlocked[id]).map((id) => {
          const dish = DISHES[id];
          const entry = g.menu[id];
          const stars = g.batches[id]?.stars ?? g.bestStars[id] ?? 3;
          const listed = payFor(dish.basePrice, Math.max(1, stars), entry.priceMult, 0).price;
          const verdict = valueVerdict(Math.max(1, stars), entry.priceMult);
          return (
            <div key={id} style={{ ...S.row, opacity: entry.on ? 1 : 0.55 }}>
              <button
                onClick={() => g.toggleMenuDish(id)}
                style={{ ...S.toggle, background: entry.on ? C.good : "rgba(255,240,220,0.15)" }}
              >
                {entry.on ? "✓" : "–"}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.rName}>
                  {dish.emoji} {dish.name}
                </div>
                <div style={S.rMeta}>
                  serves at 🪙{listed}
                  {" · "}
                  <span
                    style={{
                      color: verdict === "ripped" ? C.bad : verdict === "bargain" ? C.teal : C.good,
                      fontWeight: 900,
                    }}
                  >
                    {verdict === "ripped" ? "rip-off risk" : verdict}
                  </span>
                  {" for "}
                  {"★".repeat(Math.max(1, stars))}
                </div>
              </div>
              <div style={S.stepper}>
                <button
                  style={S.stepBtn}
                  disabled={entry.priceMult <= PRICE_MIN}
                  onClick={() => g.setMenuPrice(id, entry.priceMult - PRICE_STEP)}
                >
                  –
                </button>
                <span style={S.mult}>{entry.priceMult.toFixed(1)}×</span>
                <button
                  style={S.stepBtn}
                  disabled={entry.priceMult >= PRICE_MAX}
                  onClick={() => g.setMenuPrice(id, entry.priceMult + PRICE_STEP)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        <div style={S.hint}>
          Cheap fills tables, premium needs stars — get greedy with 2★ halwa and the souq will talk.
        </div>

        <Button variant="primary" onClick={g.toIdle} style={{ width: "100%", marginTop: 14 }}>
          Done
        </Button>
      </motion.div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, display: "grid", placeItems: "center", fontFamily: FONT, pointerEvents: "auto", padding: 18 },
  board: {
    width: "min(92vw, 420px)",
    background: "linear-gradient(180deg, rgba(48,26,14,0.95), rgba(28,15,7,0.96))",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,200,140,0.28)",
    borderRadius: 28,
    padding: 22,
    color: C.cream,
    boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
  },
  head: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 900 },
  sub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px",
    borderRadius: 18,
    background: "rgba(255,240,220,0.05)",
    marginBottom: 8,
    transition: "opacity 0.2s",
  },
  toggle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 900,
    color: C.ink,
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: FONT,
  },
  rName: { fontSize: 15.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rMeta: { fontSize: 12, opacity: 0.9, marginTop: 3 },
  stepper: { display: "flex", alignItems: "center", gap: 6 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: "1px solid rgba(255,200,140,0.3)",
    background: "rgba(255,240,220,0.1)",
    color: C.cream,
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: FONT,
  },
  mult: { fontSize: 13.5, fontWeight: 900, width: 38, textAlign: "center", color: C.gold },
  hint: { fontSize: 12, opacity: 0.7, lineHeight: 1.4, marginTop: 6, textAlign: "center" },
};
