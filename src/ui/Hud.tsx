import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { dayLive, startDay, endDay } from "../game/eateryLive";
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
  const openMenu = useGame((s) => s.openMenu);
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
            <div style={S.topBtns}>
              <button style={S.souqBtn} onClick={openMarket}>
                🧺 Souq
              </button>
              <button style={S.souqBtn} onClick={openMenu}>
                📋 Menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DayClock />

      <AnimatePresence>
        {showStart && (
          <motion.div
            key="start"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            style={S.bottom}
          >
            <div style={S.bottomCol}>
              <OpenStallButton />
              <Button variant="primary" onClick={openSelect} style={{ padding: "15px 42px", fontSize: 18 }}>
                Start Cooking
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Open the stall for a service day — the tycoon's core verb. */
function OpenStallButton() {
  const opened = useGame((s) => s.opened);
  const dayOpen = useGame((s) => s.dayOpen);
  const day = useGame((s) => s.day);
  if (!opened || dayOpen) return null;
  return (
    <Button variant="gold" onClick={startDay} style={{ padding: "17px 46px", fontSize: 20 }}>
      ☀️ Open the Stall — Day {day}
    </Button>
  );
}

/** The running day: countdown chip + close-early. */
function DayClock() {
  const dayOpen = useGame((s) => s.dayOpen);
  const day = useGame((s) => s.day);
  const phase = useGame((s) => s.phase);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!dayOpen) return;
    const t = setInterval(() => tick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, [dayOpen]);

  if (!dayOpen || phase === "cook") return null;
  const s = Math.max(0, Math.ceil(dayLive.remaining));
  const mm = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, "0");
  return (
    <div style={S.dayClock}>
      <span style={S.dayClockTime}>
        ☀️ Day {day} · {mm}:{ss}
      </span>
      <button style={S.closeEarly} onClick={endDay}>
        close up
      </button>
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
  topBtns: { display: "flex", flexDirection: "column", gap: 6, alignItems: "stretch" },
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
  bottomCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  dayClock: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 64px)",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(40,20,10,0.65)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 999,
    padding: "7px 8px 7px 16px",
    pointerEvents: "auto",
  },
  dayClockTime: { fontSize: 14, fontWeight: 900, color: C.gold, fontVariantNumeric: "tabular-nums" },
  closeEarly: {
    border: "none",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 11.5,
    fontWeight: 900,
    fontFamily: FONT,
    background: "rgba(255,240,220,0.14)",
    color: C.cream,
    cursor: "pointer",
  },
};
