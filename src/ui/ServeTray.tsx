import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DISHES, DISH_ORDER } from "../data/dishes";
import { useGame } from "../state/game";
import {
  eatery,
  subscribeEatery,
  eaterySnapshot,
  eateryRunning,
  runEatery,
  tryServe,
} from "../game/eateryLive";
import { useRaf } from "./cook/shared";
import { C, FONT } from "./theme";

/** Ticks the live eatery. Mounted once; renders nothing. */
export function EateryController() {
  useRaf((dt) => {
    if (eateryRunning()) runEatery(dt);
  });
  return null;
}

/**
 * The service surface: what's on the counter and who is waiting. Tap a
 * hungry customer to serve them from the matching batch. During a service
 * cook it shrinks to a "people waiting" badge — the world didn't stop.
 */
export function ServeTray() {
  const phase = useGame((s) => s.phase);
  const opened = useGame((s) => s.opened);
  const batches = useGame((s) => s.batches);
  useSyncExternalStore(subscribeEatery, eaterySnapshot);

  if (!opened) return null;

  const waiting = eatery.customers.filter((c) => c.phase === "waiting");
  const hungryCount = waiting.length + eatery.customers.filter((c) => c.phase === "queueing").length;

  // mid-cook: just the pressure badge
  if (phase === "cook") {
    return hungryCount > 0 ? (
      <div style={S.cookBadge}>🧍 {hungryCount} waiting</div>
    ) : null;
  }

  if (phase !== "idle" && phase !== "select") return null;

  return (
    <div style={S.wrap}>
      {/* the counter: what's ready to serve */}
      <div style={S.counterRow}>
        {DISH_ORDER.map((id) => {
          const b = batches[id];
          if (!b) return null;
          return (
            <div key={id} style={S.batchChip}>
              <span style={{ fontSize: 17 }}>{DISHES[id].emoji}</span>
              <span style={S.batchText}>
                {"★".repeat(b.stars)} · {b.servings}
              </span>
            </div>
          );
        })}
      </div>

      {/* hungry tables */}
      <div style={S.tray}>
        <AnimatePresence>
          {waiting.map((c) => {
            const b = batches[c.dish];
            const servable = !!b && b.servings > 0;
            return (
              <motion.button
                key={c.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => tryServe(c.id)}
                style={{
                  ...S.order,
                  borderColor: servable ? C.gold : "rgba(255,200,140,0.25)",
                  opacity: servable ? 1 : 0.65,
                }}
              >
                <PatienceRing patience={c.patience} />
                <span style={{ fontSize: 22, lineHeight: 1 }}>{DISHES[c.dish].emoji}</span>
                <span style={S.orderLabel}>
                  {servable ? "serve" : "cook it!"} · T{c.table + 1}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PatienceRing({ patience }: { patience: number }) {
  const p = Math.max(0, Math.min(1, patience));
  const R = 26;
  const CIRC = 2 * Math.PI * R;
  const color = p > 0.55 ? C.good : p > 0.3 ? C.gold : C.bad;
  return (
    <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: "absolute", inset: 0 }}>
      <circle cx={30} cy={30} r={R} fill="none" stroke="rgba(20,10,4,0.5)" strokeWidth={4} />
      <circle
        cx={30}
        cy={30}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - p)}
        transform="rotate(-90 30 30)"
      />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    left: 14,
    bottom: "calc(env(safe-area-inset-bottom) + 108px)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "none",
    fontFamily: FONT,
  },
  counterRow: { display: "flex", gap: 8 },
  batchChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(38,20,10,0.72)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 999,
    padding: "6px 12px",
    color: C.gold,
  },
  batchText: { fontSize: 12, fontWeight: 900, letterSpacing: 0.5 },
  tray: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" },
  order: {
    position: "relative",
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "rgba(38,20,10,0.82)",
    border: "2.5px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    pointerEvents: "auto",
    cursor: "pointer",
    color: C.cream,
    fontFamily: FONT,
    padding: 0,
  },
  orderLabel: { fontSize: 8.5, fontWeight: 900, letterSpacing: 0.2 },
  cookBadge: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 14px)",
    right: 16,
    background: "rgba(38,20,10,0.78)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 900,
    color: C.gold,
    fontFamily: FONT,
    pointerEvents: "none",
  },
};
