import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { scorePour, scorePrep } from "../game/scoring";
import { haptic } from "../game/haptics";
import { C, FONT, pop } from "./theme";

/**
 * Phase 1 — Prep. Hold to pour each ingredient; release inside the green band
 * to nail the amount. Every pour drops a blob onto the plate with a squash-pop.
 */
export function PrepGame() {
  const dish = DISHES[useGame((s) => s.selected)];
  const finishPrep = useGame((s) => s.finishPrep);

  const [idx, setIdx] = useState(0);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [inBand, setInBand] = useState(false);
  const [flash, setFlash] = useState<null | { good: boolean }>(null);

  const fill = useRef(0);
  const fillEl = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const holding = useRef(false);
  const wasInBand = useRef(false);

  const ing = dish.ingredients[idx];
  const bandLo = Math.max(0, ing.target - ing.tolerance);
  const bandHi = Math.min(1, ing.target + ing.tolerance);

  const tick = () => {
    if (!holding.current) return;
    fill.current = Math.min(1, fill.current + 0.011);
    const v = fill.current;
    if (fillEl.current) fillEl.current.style.height = `${v * 100}%`;
    if (knob.current) knob.current.style.bottom = `calc(${v * 100}% - 14px)`;
    const band = v >= bandLo && v <= bandHi;
    if (band !== wasInBand.current) {
      wasInBand.current = band;
      setInBand(band);
      if (band) haptic("tick");
    }
    if (v >= 1) return release();
    raf.current = requestAnimationFrame(tick);
  };

  const start = () => {
    holding.current = true;
    raf.current = requestAnimationFrame(tick);
  };

  const release = () => {
    if (!holding.current) return;
    holding.current = false;
    cancelAnimationFrame(raf.current);
    const amount = fill.current;
    const s = scorePour(ing, amount);
    const good = s >= 0.8;
    haptic(good ? "success" : "error");
    setFlash({ good });
    const next = { ...amounts, [ing.key]: amount };
    setAmounts(next);

    setTimeout(() => {
      setFlash(null);
      if (idx + 1 >= dish.ingredients.length) {
        finishPrep(scorePrep(dish, next), next);
      } else {
        fill.current = 0;
        wasInBand.current = false;
        setInBand(false);
        if (fillEl.current) fillEl.current.style.height = "0%";
        if (knob.current) knob.current.style.bottom = "-14px";
        setIdx(idx + 1);
      }
    }, 650);
  };

  return (
    <div style={S.wrap}>
      <div style={S.scrim} />
      <div style={S.header}>
        <div style={S.step}>Prep · {idx + 1}/{dish.ingredients.length}</div>
        <div style={S.title}>{dish.name}</div>
      </div>

      {/* plate with accumulated blobs */}
      <div style={S.plateWrap}>
        <div style={S.plate}>
          <AnimatePresence>
            {dish.ingredients.slice(0, idx).map((g, i) => (
              <motion.div
                key={g.key}
                initial={{ scale: 0, y: -40 }}
                animate={{ scale: 1, y: 0 }}
                transition={pop}
                style={{
                  ...S.blob,
                  background: g.color,
                  left: `${22 + (i % 4) * 18}%`,
                  top: `${34 + Math.floor(i / 4) * 22 + (i % 2) * 8}%`,
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* pour gauge */}
      <div style={S.center}>
        <div style={S.gauge}>
          {/* target band */}
          <div
            style={{
              ...S.band,
              bottom: `${bandLo * 100}%`,
              height: `${(bandHi - bandLo) * 100}%`,
              boxShadow: inBand ? `0 0 20px ${C.good}` : "none",
              borderColor: inBand ? C.good : "rgba(143,208,106,0.5)",
            }}
          />
          <div ref={fillEl} style={{ ...S.fill, background: ing.color }} />
          <div ref={knob} style={S.knob} />
          <div style={S.targetLabel}>target</div>
        </div>

        {/* pour button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            start();
          }}
          onPointerUp={release}
          onPointerCancel={release}
          style={{ ...S.pour, background: ing.color }}
        >
          <span style={{ fontSize: 46 }}>{ing.emoji}</span>
          <span style={S.pourLabel}>{ing.label}</span>
          <span style={S.pourHint}>hold to pour</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={pop}
            style={{ ...S.flash, color: flash.good ? C.good : C.bad }}
          >
            {flash.good ? "Perfect!" : "Off amount"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { position: "fixed", inset: 0, fontFamily: FONT, color: C.cream, pointerEvents: "none", touchAction: "none" },
  scrim: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(rgba(16,8,4,0.5), rgba(12,6,3,0.62)), radial-gradient(ellipse at 50% 40%, rgba(24,12,6,0.1), rgba(12,6,3,0.5))",
  },
  header: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 60px)",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  step: { fontSize: 13, fontWeight: 800, letterSpacing: 1, opacity: 0.8, textTransform: "uppercase" },
  title: { fontSize: 22, fontWeight: 800, textShadow: "0 2px 10px rgba(0,0,0,0.6)" },
  plateWrap: { position: "absolute", top: "20%", left: 0, right: 0, display: "flex", justifyContent: "center" },
  plate: {
    position: "relative",
    width: "min(60vw,260px)",
    height: "min(24vw,110px)",
    borderRadius: "50%",
    background: "radial-gradient(ellipse at 50% 40%, #f3e6cf, #d8c3a1)",
    boxShadow: "0 16px 34px rgba(0,0,0,0.45), inset 0 -6px 14px rgba(0,0,0,0.12)",
    border: "3px solid #efe3cf",
  },
  blob: { position: "absolute", width: 34, height: 34, borderRadius: "50%", boxShadow: "0 4px 8px rgba(0,0,0,0.25)" },
  center: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 40px)",
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 26,
  },
  gauge: {
    position: "relative",
    width: 56,
    height: 220,
    borderRadius: 18,
    background: "rgba(20,10,4,0.6)",
    border: "1px solid rgba(255,200,140,0.22)",
    overflow: "hidden",
  },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    background: "rgba(143,208,106,0.22)",
    borderTop: "2px solid",
    borderBottom: "2px solid",
    borderColor: "rgba(143,208,106,0.5)",
  },
  fill: { position: "absolute", left: 0, right: 0, bottom: 0, height: "0%", borderRadius: "0 0 16px 16px" },
  knob: {
    position: "absolute",
    left: -4,
    right: -4,
    bottom: -14,
    height: 4,
    background: C.cream,
    boxShadow: "0 0 8px rgba(255,255,255,0.6)",
  },
  targetLabel: { position: "absolute", top: 6, left: 0, right: 0, textAlign: "center", fontSize: 9, opacity: 0.5 },
  pour: {
    pointerEvents: "auto",
    width: 150,
    height: 150,
    borderRadius: "50%",
    border: "4px solid rgba(255,255,255,0.35)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    color: C.ink,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
    touchAction: "none",
  },
  pourLabel: { fontSize: 15, fontWeight: 900 },
  pourHint: { fontSize: 11, fontWeight: 700, opacity: 0.7 },
  flash: {
    position: "absolute",
    top: "44%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 30,
    fontWeight: 900,
    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
  },
};
