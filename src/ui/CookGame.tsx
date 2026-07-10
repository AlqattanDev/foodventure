import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { cookViz, resetCookViz } from "../game/cookViz";
import { idealTempo, tempoQuality, clamp01, scoreCook } from "../game/scoring";
import { haptic } from "../game/haptics";
import { C, FONT } from "./theme";

const HEATS = [
  { label: "Low", cook: 0.72, burn: 0.6, viz: 0.32 },
  { label: "Med", cook: 1.0, burn: 1.0, viz: 0.56 },
  { label: "High", cook: 1.45, burn: 1.8, viz: 0.85 },
];

interface LiveEvent {
  idx: number;
  label: string;
  emoji: string;
  color: string;
  windowEnd: number; // sim-clock seconds
}

/**
 * Phase 2 — the heart. Stir the pot by dragging your finger in circles at a
 * steady rhythm; keep it moving or it scorches; tap when a spice cue flashes.
 * The 3D halwa cooks live off the shared cookViz singleton.
 */
export function CookGame() {
  const dish = DISHES[useGame((s) => s.selected)];
  const finishCook = useGame((s) => s.finishCook);
  const potTol = useGame((s) => s.upgrades.pot) * 0.9; // band bonus (rad/s)
  const burnResist = useGame((s) => s.burnResist());

  const [heatIdx, setHeatIdx] = useState(1);
  const heatRef = useRef(1);
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [tempoState, setTempoState] = useState<"idle" | "good" | "slow" | "fast">("idle");
  const [banner, setBanner] = useState<string | null>("Stir in circles!");

  // DOM refs for smooth imperative meters
  const cookBar = useRef<HTMLDivElement>(null);
  const burnBar = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const stirZone = useRef<HTMLDivElement>(null);

  // sim state (never re-renders)
  const sim = useRef({
    progress: 0,
    burn: 0,
    smoothQ: 0,
    smoothT: 0,
    timingHits: 0,
    stirEnergy: 0,
    clock: 0,
    lastAngle: 0,
    lastMoveT: -1,
    speedEMA: 0,
    stirring: false,
    done: false,
    events: dish.events.map((e, idx) => ({ idx, ...e, fired: false, resolved: false, hit: false, windowEnd: 0 })),
    activeEventIdx: -1,
  });

  useEffect(() => {
    resetCookViz(dish.rawColor, dish.cookedColor);
    heatRef.current = 1;
    const s = sim.current;
    let raf = 0;
    let prev = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      s.clock += dt;

      const heat = HEATS[heatRef.current];
      const { center } = idealTempo(dish);

      // has the finger moved recently?
      const moving = s.lastMoveT >= 0 && s.clock - s.lastMoveT < 0.14;
      s.stirring = moving;

      // decay stir energy toward current speed
      const speed = moving ? s.speedEMA : 0;
      s.stirEnergy += ((moving ? clamp01(speed / (center * 1.4)) : 0) - s.stirEnergy) * Math.min(1, dt * 6);

      // tempo quality (with pot upgrade widening the band)
      const q = moving ? tempoQuality(dish, speed, potTol) : 0;
      const tooFast = moving && speed > center + idealTempo(dish).band + potTol + 2.5;

      // ---- cook progress ----
      const stirFactor = moving ? 1 : 0.18;
      s.progress = clamp01(s.progress + dt * 0.062 * heat.cook * stirFactor);

      // ---- smoothness accrual ----
      if (moving) {
        s.smoothT += dt;
        s.smoothQ += q * dt;
      }

      // ---- burn model ----
      const hot = s.progress > 0.1;
      let burnUp = 0;
      if (hot) {
        if (!moving) burnUp += 0.14 * heat.burn;
        if (tooFast) burnUp += 0.09;
        if (heatRef.current === 2) burnUp += 0.03;
      }
      burnUp *= 1 - burnResist;
      const relief = moving && q > 0.55 ? 0.06 : 0;
      s.burn = clamp01(s.burn + dt * (burnUp - relief));

      // ---- timed spice events ----
      let active: LiveEvent | null = null;
      for (const e of s.events) {
        if (!e.fired && s.progress >= e.at) {
          e.fired = true;
          e.windowEnd = s.clock + 1.7;
          s.activeEventIdx = e.idx;
          haptic("light");
          setEvent({ idx: e.idx, label: e.label, emoji: e.emoji, color: e.color, windowEnd: e.windowEnd });
          setBanner(`Tap to add ${e.label}!`);
        }
        if (e.fired && !e.resolved) {
          if (s.clock > e.windowEnd) {
            e.resolved = true; // missed
            s.activeEventIdx = -1;
            setEvent(null);
            setBanner("Keep stirring!");
            setTimeout(() => setBanner(null), 900);
          } else {
            active = { idx: e.idx, label: e.label, emoji: e.emoji, color: e.color, windowEnd: e.windowEnd };
          }
        }
      }
      void active;

      // ---- write visuals ----
      cookViz.progress = s.progress;
      cookViz.burn = s.burn;
      cookViz.sheen = 0.3 + s.progress * 0.7;
      cookViz.bubble = s.stirEnergy;
      cookViz.heat = heat.viz;

      // ---- imperative meters ----
      if (cookBar.current) cookBar.current.style.transform = `scaleX(${s.progress})`;
      if (burnBar.current) {
        burnBar.current.style.transform = `scaleX(${s.burn})`;
        burnBar.current.style.opacity = s.burn > 0.02 ? "1" : "0";
      }
      if (ring.current) {
        const good = moving && q > 0.6;
        const col = s.burn > 0.6 ? C.bad : good ? C.good : moving ? C.amber : "rgba(255,220,170,0.3)";
        ring.current.style.borderColor = col;
        ring.current.style.boxShadow = `0 0 ${good ? 34 : 14}px ${col}`;
        const scale = 1 + s.stirEnergy * 0.05;
        ring.current.style.transform = `translate(-50%,-50%) scale(${scale})`;
      }
      // reflect tempo band as a coarse state for the center hint
      const st = !moving ? "idle" : q > 0.6 ? "good" : speed < center ? "slow" : "fast";
      setTempoState((prevSt) => (prevSt === st ? prevSt : st));

      // ---- end conditions ----
      if (s.burn >= 1 && !s.done) {
        s.done = true;
        cookViz.active = false;
        haptic("error");
        const smoothness = s.smoothT > 0 ? s.smoothQ / s.smoothT : 0;
        const timing = s.events.length ? s.timingHits / s.events.length : 1;
        finishCook(prepFromStore(), scoreCook({ smoothness, timing, burn: 1 }), true);
        return;
      }
      if (s.progress >= 1 && !s.done) {
        s.done = true;
        cookViz.active = false;
        cookViz.progress = 1;
        haptic("success");
        const smoothness = s.smoothT > 0 ? s.smoothQ / s.smoothT : 0;
        const timing = s.events.length ? s.timingHits / s.events.length : 1;
        finishCook(prepFromStore(), scoreCook({ smoothness, timing, burn: s.burn }), false);
        return;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cookViz.active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- pointer → angular speed ----
  const onMove = (clientX: number, clientY: number) => {
    const el = stirZone.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy) / (r.width / 2);
    if (dist < 0.18 || dist > 1.25) return; // ignore dead-center / far outside
    const ang = Math.atan2(dy, dx);
    const s = sim.current;
    if (s.lastMoveT >= 0) {
      let d = ang - s.lastAngle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const dtm = Math.max(0.008, s.clock - s.lastMoveT);
      const speed = Math.abs(d) / dtm;
      s.speedEMA += (speed - s.speedEMA) * 0.4;
    }
    s.lastAngle = ang;
    s.lastMoveT = s.clock;
  };

  const resolveEvent = () => {
    const s = sim.current;
    const e = s.events.find((ev) => ev.idx === s.activeEventIdx);
    if (!e || e.resolved) return;
    e.resolved = true;
    e.hit = true;
    s.timingHits += 1;
    s.activeEventIdx = -1;
    cookViz.sparkAt += 1;
    haptic("success");
    setEvent(null);
    setBanner("Perfect!");
    setTimeout(() => setBanner(null), 800);
  };

  const hint =
    tempoState === "good"
      ? "Nice rhythm ✦"
      : tempoState === "slow"
      ? "A little faster…"
      : tempoState === "fast"
      ? "Ease off — too fast"
      : "Drag in circles";

  return (
    <div style={S.wrap}>
      <div style={S.scrim} />
      {/* top meters */}
      <div style={S.meters}>
        <div style={S.meterRow}>
          <span style={S.meterLabel}>Cook</span>
          <div style={S.track}>
            <div ref={cookBar} style={{ ...S.fill, background: `linear-gradient(90deg,${C.saffron},${C.amber})` }} />
          </div>
        </div>
        <div style={S.meterRow}>
          <span style={S.meterLabel}>Burn</span>
          <div style={S.track}>
            <div ref={burnBar} style={{ ...S.fill, background: `linear-gradient(90deg,#e8a34a,${C.bad})`, opacity: 0 }} />
          </div>
        </div>
      </div>

      {/* heat control */}
      <div style={S.heat}>
        {HEATS.map((h, i) => (
          <button
            key={h.label}
            onClick={() => {
              setHeatIdx(i);
              heatRef.current = i;
              haptic("tick");
            }}
            style={{
              ...S.heatBtn,
              background: heatIdx === i ? "linear-gradient(180deg,#ffb14d,#f0822d)" : "rgba(255,240,220,0.08)",
              color: heatIdx === i ? C.ink : C.creamDim,
              transform: heatIdx === i ? "scale(1.06)" : "scale(1)",
            }}
          >
            {["🔥", "🔥🔥", "🔥🔥🔥"][i]}
            <span style={{ fontSize: 11, fontWeight: 800 }}>{h.label}</span>
          </button>
        ))}
      </div>

      {/* stir zone */}
      <div
        ref={stirZone}
        style={S.stir}
        onPointerMove={(e) => onMove(e.clientX, e.clientY)}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          onMove(e.clientX, e.clientY);
          if (sim.current.activeEventIdx >= 0) resolveEvent();
        }}
      >
        <div ref={ring} style={S.ring} />
        {/* rotating hint arrows */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 3.2 }}
          style={S.arrows}
        >
          <span style={S.arrow}>↻</span>
        </motion.div>

        {/* spice cue pulse */}
        <AnimatePresence>
          {event && (
            <motion.div
              key={event.idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.14, 1], opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ scale: { repeat: Infinity, duration: 0.7 } }}
              onPointerDown={(e) => {
                e.stopPropagation();
                resolveEvent();
              }}
              style={{ ...S.cue, boxShadow: `0 0 40px ${event.color}`, borderColor: event.color }}
            >
              <span style={{ fontSize: 40 }}>{event.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>TAP</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* banner / hint */}
      <div style={S.hintWrap}>
        <AnimatePresence mode="wait">
          <motion.div
            key={banner ?? hint}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            style={S.hint}
          >
            {banner ?? hint}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// prep score was stashed by the store when Phase 1 finished
function prepFromStore(): number {
  return useGame.getState().prepScore ?? 1;
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    fontFamily: FONT,
    color: C.cream,
    touchAction: "none",
  },
  scrim: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at 50% 48%, rgba(24,12,6,0.05), rgba(14,7,3,0.5))",
  },
  meters: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 64px)",
    left: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  meterRow: { display: "flex", alignItems: "center", gap: 10 },
  meterLabel: { width: 40, fontSize: 12, fontWeight: 800, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    background: "rgba(20,10,4,0.55)",
    border: "1px solid rgba(255,200,140,0.18)",
    overflow: "hidden",
  },
  fill: { height: "100%", width: "100%", transformOrigin: "left", transform: "scaleX(0)", borderRadius: 999 },
  heat: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "auto",
  },
  heatBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    border: "1px solid rgba(255,200,140,0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    fontSize: 15,
    cursor: "pointer",
    transition: "transform 0.15s, background 0.15s",
  },
  stir: {
    position: "absolute",
    left: "50%",
    top: "48%",
    transform: "translate(-50%,-50%)",
    width: "min(74vw, 360px)",
    height: "min(74vw, 360px)",
    pointerEvents: "auto",
    touchAction: "none",
    display: "grid",
    placeItems: "center",
  },
  ring: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "100%",
    height: "100%",
    transform: "translate(-50%,-50%)",
    borderRadius: "50%",
    border: "3px dashed rgba(255,220,170,0.3)",
    transition: "border-color 0.12s, box-shadow 0.12s",
  },
  arrows: {
    width: "62%",
    height: "62%",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    opacity: 0.28,
  },
  arrow: { fontSize: 44, color: C.cream },
  cue: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: 14,
    borderRadius: 24,
    background: "rgba(30,16,8,0.8)",
    border: "2px solid",
    pointerEvents: "auto",
    cursor: "pointer",
  },
  hintWrap: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 40px)",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
  },
  hint: {
    background: "rgba(30,16,8,0.6)",
    backdropFilter: "blur(10px)",
    padding: "10px 22px",
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 700,
    border: "1px solid rgba(255,200,140,0.2)",
  },
};
