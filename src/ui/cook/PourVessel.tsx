import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPour, stepPour, streamKind } from "../../game/pour";
import type { PourSpec } from "../../game/recipe";
import { haptic } from "../../game/haptics";
import { grab, useRaf } from "./shared";
import { C, FONT } from "../theme";

/**
 * The V3 measurement: hold the vessel, tilt it by dragging up, and watch the
 * level rise toward the etched line on the measuring bowl. The stream dribbles
 * off when you right the vessel; a dribble too far can be spooned back out.
 * You decide when it's measured — then tip it in.
 */
export function PourVessel({
  pour,
  intoLabel = "into the pot",
  onDone,
}: {
  pour: PourSpec;
  intoLabel?: string;
  onDone: (fill: number) => void;
}) {
  const sim = useRef(createPour());
  if ((import.meta as any).env?.DEV && typeof window !== "undefined") {
    (window as any).__pour = sim.current; // synthetic-touch verification handle
  }
  const drag = useRef<{ startY: number; tilt: number; held: boolean }>({ startY: 0, tilt: 0, held: false });
  const scooping = useRef(false);
  const settled = useRef(0); // seconds since the stream fully stopped

  const fillEl = useRef<HTMLDivElement>(null);
  const surfEl = useRef<HTMLDivElement>(null);
  const vesselEl = useRef<HTMLDivElement>(null);
  const streamEl = useRef<HTMLDivElement>(null);
  const [canConfirm, setCanConfirm] = useState(false);
  const [overfull, setOverfull] = useState(false);
  const [tipping, setTipping] = useState(false);

  useRaf((dt) => {
    if (tipping) return;
    const s = sim.current;
    const d = drag.current;
    stepPour(s, d.held ? d.tilt : 0, scooping.current, dt);

    // --- vessel follows the hand ---
    if (vesselEl.current) {
      const t = s.tilt;
      vesselEl.current.style.transform = `translate(${-t * 74}px, ${-t * 46}px) rotate(${-t * 92}deg)`;
    }
    // --- the stream ---
    if (streamEl.current) {
      const kind = streamKind(s.flow);
      const w = kind === "none" ? 0 : 2 + s.flow * 26;
      streamEl.current.style.width = `${w}px`;
      streamEl.current.style.opacity = kind === "none" ? "0" : "1";
    }
    // --- bowl contents ---
    if (fillEl.current) fillEl.current.style.height = `${s.fill * 100}%`;
    if (surfEl.current) {
      const wob = s.flow > 0.01 ? 1 + Math.sin(performance.now() / 60) * 0.15 : 1;
      surfEl.current.style.transform = `scaleY(${wob})`;
    }

    settled.current = s.flow === 0 && !d.held ? settled.current + dt : 0;
    const confirmable = settled.current > 0.35 && s.fill > 0.03;
    setCanConfirm((p) => (p === confirmable ? p : confirmable));
    const over = s.fill > pour.target + pour.tolerance * 0.7;
    setOverfull((p) => (p === over ? p : over));
  });

  const confirm = () => {
    if (tipping) return;
    setTipping(true);
    haptic("success");
    setTimeout(() => onDone(sim.current.fill), 620);
  };

  return (
    <div style={S.wrap}>
      {/* measuring bowl */}
      <motion.div
        animate={tipping ? { rotate: -50, x: 40, y: -30, opacity: 0 } : {}}
        transition={{ duration: 0.55, ease: "easeIn" }}
        style={S.bowlZone}
      >
        <div style={S.bowl}>
          <div ref={fillEl} style={{ ...S.fillBody, background: pour.color }}>
            <div ref={surfEl} style={{ ...S.meniscus, background: pour.color, filter: "brightness(1.18)" }} />
          </div>
          {/* etched measure line — like a real measuring jug */}
          <div style={{ ...S.etch, bottom: `${pour.target * 100}%` }}>
            <span style={{ ...S.etchTick, background: overfull ? C.bad : "rgba(58,28,8,0.55)" }} />
            <span style={{ ...S.etchLabel, color: overfull ? C.bad : "rgba(58,28,8,0.62)" }}>{pour.amount}</span>
            <span style={{ ...S.etchTick, background: overfull ? C.bad : "rgba(58,28,8,0.55)" }} />
          </div>
        </div>
        <div style={S.bowlFoot} />
      </motion.div>

      {/* the falling stream */}
      <div ref={streamEl} style={{ ...S.stream, background: `linear-gradient(180deg, ${pour.color}, ${pour.color}cc)` }}>
        <div style={S.streamShimmer} />
      </div>

      {/* the vessel — hold and tilt */}
      <div
        ref={vesselEl}
        style={S.vessel}
        onPointerDown={(e) => {
          grab(e);
          drag.current = { startY: e.clientY, tilt: 0, held: true };
          haptic("tick");
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.held) return;
          d.tilt = Math.max(0, Math.min(1, (d.startY - e.clientY) / 150));
        }}
        onPointerUp={() => (drag.current.held = false)}
        onPointerCancel={() => (drag.current.held = false)}
      >
        <span style={{ fontSize: 44, lineHeight: 1 }}>{pour.emoji}</span>
        <span style={S.vesselLabel}>{pour.label}</span>
        <span style={S.vesselHint}>hold · drag up to tilt</span>
      </div>

      {/* scoop-back spoon — only shows once you've clearly overshot */}
      <AnimatePresence>
        {overfull && !tipping && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onPointerDown={(e) => {
              grab(e);
              scooping.current = true;
              haptic("tick");
            }}
            onPointerUp={() => (scooping.current = false)}
            onPointerCancel={() => (scooping.current = false)}
            style={S.spoon}
          >
            <span style={{ fontSize: 30 }}>🥄</span>
            <span style={S.spoonLabel}>hold to scoop back</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* commit the measure */}
      <AnimatePresence>
        {canConfirm && !tipping && (
          <motion.button
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            whileTap={{ scale: 0.94 }}
            onClick={confirm}
            style={S.confirm}
          >
            Tip it {intoLabel} ✓
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "calc(env(safe-area-inset-bottom) + 30px)",
    height: 300,
    pointerEvents: "none",
    fontFamily: FONT,
  },
  bowlZone: {
    position: "absolute",
    left: "50%",
    bottom: 66,
    transform: "translateX(-88%)",
    width: 148,
  },
  bowl: {
    position: "relative",
    width: 148,
    height: 118,
    overflow: "hidden",
    borderRadius: "10px 10px 64px 64px",
    background: "linear-gradient(180deg, rgba(255,246,230,0.24), rgba(255,246,230,0.12))",
    border: "2.5px solid rgba(255,236,210,0.75)",
    borderTop: "3.5px solid rgba(255,246,230,0.95)",
    boxShadow: "inset 0 8px 18px rgba(0,0,0,0.22), 0 10px 24px rgba(0,0,0,0.35)",
  },
  fillBody: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "0%",
    transition: "none",
  },
  meniscus: {
    position: "absolute",
    top: -3,
    left: 0,
    right: 0,
    height: 7,
    borderRadius: "50%",
  },
  etch: {
    position: "absolute",
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 5px",
    transform: "translateY(50%)",
    pointerEvents: "none",
  },
  etchTick: { width: 16, height: 2.5, borderRadius: 2 },
  etchLabel: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.3,
    textShadow: "0 1px 0 rgba(255,255,255,0.25)",
  },
  bowlFoot: {
    width: 56,
    height: 8,
    margin: "0 auto",
    borderRadius: "0 0 10px 10px",
    background: "rgba(255,236,210,0.5)",
  },
  stream: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-24px)",
    bottom: 150,
    height: 92,
    width: 0,
    opacity: 0,
    borderRadius: 6,
    overflow: "hidden",
    transition: "width 0.06s linear, opacity 0.12s",
  },
  streamShimmer: {
    position: "absolute",
    inset: 0,
    background:
      "repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0 8px, transparent 8px 22px)",
    animation: "vesselStreamFall 0.35s linear infinite",
  },
  vessel: {
    position: "absolute",
    right: 26,
    bottom: 96,
    width: 116,
    height: 128,
    borderRadius: 26,
    background: "linear-gradient(180deg, rgba(64,36,18,0.92), rgba(44,24,12,0.92))",
    border: `1.5px solid ${C.glassBorder}`,
    boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    pointerEvents: "auto",
    touchAction: "none",
    cursor: "grab",
    transformOrigin: "20% 90%",
    color: C.cream,
  },
  vesselLabel: { fontSize: 13.5, fontWeight: 900 },
  vesselHint: { fontSize: 10, fontWeight: 700, opacity: 0.55 },
  spoon: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-210px)",
    bottom: 96,
    width: 86,
    borderRadius: 20,
    padding: "10px 6px",
    background: "rgba(38,20,10,0.85)",
    border: `1.5px solid ${C.glassBorder}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    pointerEvents: "auto",
    touchAction: "none",
    color: C.cream,
    fontFamily: FONT,
    cursor: "pointer",
  },
  spoonLabel: { fontSize: 9.5, fontWeight: 800, opacity: 0.75, textAlign: "center" },
  confirm: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 0,
    padding: "14px 34px",
    borderRadius: 999,
    border: "none",
    background: `linear-gradient(180deg, ${C.gold}, ${C.amber})`,
    color: C.ink,
    fontSize: 16,
    fontWeight: 900,
    fontFamily: FONT,
    pointerEvents: "auto",
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
  },
};
