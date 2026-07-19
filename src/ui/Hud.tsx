import { motion, AnimatePresence } from "framer-motion";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { Button, Coin, Stars } from "./kit";
import { C, FONT } from "./theme";

/**
 * Persistent HUD. A slim top bar (coins + current dish) shows on the calm
 * screens; the big "Start Cooking" call-to-action only appears at the stall.
 * Prep / Cook / Rating / Sell each own the full screen, so the HUD steps back.
 */
export function Hud() {
  const phase = useGame((s) => s.phase);
  const coins = useGame((s) => s.coins);
  const selected = useGame((s) => s.selected);
  const bestStars = useGame((s) => s.bestStars[selected]);
  const openSelect = useGame((s) => s.openSelect);
  const openMarket = useGame((s) => s.openMarket);
  const dish = DISHES[selected];

  const showTop = phase === "idle" || phase === "select" || phase === "shop";
  const showStart = phase === "idle";

  return (
    <div style={S.wrap}>
      <AnimatePresence>
        {showTop && (
          <motion.div
            key="top"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            style={S.topbar}
          >
            <div style={S.coins}><Coin value={coins} /></div>
            <div style={S.center}>
              <div style={S.dish}>{dish.name}</div>
              <Stars value={bestStars} size={13} />
            </div>
            <button style={S.souqBtn} onClick={openMarket}>
              🧺 Souq
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStart && (
          <motion.div
            key="start"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            style={S.bottom}
          >
            <Button variant="primary" onClick={openSelect} style={{ padding: "17px 46px", fontSize: 20 }}>
              Start Cooking
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    fontFamily: FONT,
    color: C.cream,
  },
  topbar: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 14px)",
    left: 16,
    right: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coins: {
    background: "rgba(40,20,10,0.55)",
    backdropFilter: "blur(8px)",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 16,
    border: `1px solid ${C.glassBorder}`,
    minWidth: 74,
    textAlign: "center",
  },
  center: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  souqBtn: {
    pointerEvents: "auto",
    background: "rgba(40,20,10,0.55)",
    backdropFilter: "blur(8px)",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13.5,
    border: `1px solid ${C.glassBorder}`,
    color: C.cream,
    fontFamily: FONT,
    cursor: "pointer",
    minWidth: 74,
  },
  dish: { fontSize: 15, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.6)" },
  bottom: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 34px)",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
  },
};
