import { useEffect } from "react";
import { motion } from "framer-motion";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { Button, Stars } from "./kit";
import { C, FONT, pop } from "./theme";
import { haptic } from "../game/haptics";

const QUIP: Record<number, string> = {
  0: "Burnt to a crisp… the pot wins this round.",
  1: "Edible. Barely.",
  2: "Not bad — the neighbours would eat it.",
  3: "Solid halwa. People will come back.",
  4: "Silky and glossy — a proper treat!",
  5: "Legendary. The souq will talk about this.",
};

export function RatingCard() {
  const result = useGame((s) => s.result);
  const sell = useGame((s) => s.sell);
  const toIdle = useGame((s) => s.toIdle);
  const dish = result ? DISHES[result.dish] : null;

  useEffect(() => {
    const t = setTimeout(() => haptic(result && result.stars >= 4 ? "success" : "medium"), 500);
    return () => clearTimeout(t);
  }, [result]);

  if (!result || !dish) return null;
  const burnt = result.burnt || result.stars === 0;

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ scale: 0.8, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={pop} style={S.card}>
        {!burnt && <ConfettiRing stars={result.stars} />}
        <div style={S.dishName}>{dish.name}</div>
        <div style={{ margin: "14px 0 10px" }}>
          <Stars value={result.stars} size={40} animate />
        </div>
        <div style={S.quip}>{QUIP[result.stars]}</div>

        {/* per-stage breakdown — which part of the recipe cost you */}
        <div style={S.breakdown}>
          {result.rating.results.map((r) => (
            <StageBar key={r.stepId} label={r.title} v={r.score} worst={result.rating.worst?.stepId === r.stepId} />
          ))}
        </div>
        {result.rating.worst && !burnt && (
          <div style={S.worstNote}>Work on <b>{result.rating.worst.title.toLowerCase()}</b> next time</div>
        )}

        {burnt ? (
          <>
            <div style={S.waste}>🔥 Wasted batch — no sale</div>
            <Button variant="ghost" onClick={toIdle}>Back to stall</Button>
          </>
        ) : (
          <>
            <div style={S.price}>Sells for 🪙 {result.price}</div>
            <Button variant="gold" onClick={sell} style={{ width: "100%" }}>Serve it up →</Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function StageBar({ label, v, worst }: { label: string; v: number; worst: boolean }) {
  return (
    <div style={S.stageRow}>
      <div style={{ ...S.barLabel, color: worst ? C.bad : undefined }}>{label}</div>
      <div style={S.barTrack}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0.02, v) }}
          transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 20 }}
          style={{ ...S.barFill, background: v > 0.7 ? C.good : v > 0.45 ? C.gold : C.bad }}
        />
      </div>
    </div>
  );
}

function ConfettiRing({ stars }: { stars: number }) {
  const n = 8 + stars * 3;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2;
        const col = [C.gold, C.saffron, C.teal, C.rose, C.amber][i % 5];
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * 160, y: Math.sin(a) * 160 - 20, opacity: 0, scale: 0.4 }}
            transition={{ duration: 1.1, delay: 0.2 + (i % 5) * 0.03, ease: "easeOut" }}
            style={{ position: "absolute", top: "38%", left: "50%", width: 10, height: 10, borderRadius: 3, background: col }}
          />
        );
      })}
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    fontFamily: FONT,
    background: "radial-gradient(ellipse at 50% 40%, rgba(30,16,8,0.2), rgba(15,8,4,0.55))",
    pointerEvents: "auto",
    padding: 24,
  },
  card: {
    position: "relative",
    width: "min(88vw, 380px)",
    background: "linear-gradient(180deg, rgba(48,26,14,0.92), rgba(30,16,8,0.94))",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,200,140,0.28)",
    borderRadius: 30,
    padding: "30px 26px 26px",
    textAlign: "center",
    color: C.cream,
    boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
    overflow: "hidden",
  },
  dishName: { fontSize: 22, fontWeight: 900, letterSpacing: 0.3 },
  quip: { fontSize: 15, opacity: 0.9, minHeight: 40, lineHeight: 1.35, padding: "0 6px" },
  breakdown: { display: "flex", flexDirection: "column", gap: 7, margin: "18px 4px 12px" },
  stageRow: { display: "flex", alignItems: "center", gap: 10 },
  worstNote: { fontSize: 13, opacity: 0.85, marginBottom: 14 },
  barLabel: { width: 108, textAlign: "right", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.85 },
  barTrack: { flex: 1, height: 10, borderRadius: 999, background: "rgba(20,10,4,0.6)", overflow: "hidden" },
  barFill: { height: "100%", transformOrigin: "left", borderRadius: 999 },
  price: { fontSize: 18, fontWeight: 800, margin: "4px 0 16px", color: C.gold },
  waste: { fontSize: 16, fontWeight: 800, color: C.bad, margin: "10px 0 18px" },
};
