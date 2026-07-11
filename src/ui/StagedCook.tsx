import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RECIPES } from "../data/recipes";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { cookViz, resetCookViz } from "../game/cookViz";
import { idealTempo, tempoQuality, clamp01, scorePour } from "../game/scoring";
import { rateRun } from "../game/recipe";
import type {
  RecipeStep,
  StepSummary,
  HeatHoldStep,
  PourStirStep,
  PourWhileStirStep,
  StirBatchesStep,
  TimedAddStep,
  FinishCallStep,
} from "../game/recipe";
import { haptic } from "../game/haptics";
import { C, FONT } from "./theme";

/**
 * The V2 cook: the recipe's real stages, played in order, each stage feeding
 * a summary into the tested recipe engine. Guided mode — the current step and
 * its instruction stay on screen (mastery mode hides them later).
 */
export function StagedCook() {
  const dishId = useGame((s) => s.selected);
  const finishRun = useGame((s) => s.finishRun);
  const recipe = RECIPES[dishId];
  const dish = DISHES[dishId];

  const [stepIdx, setStepIdx] = useState(0);
  const [transition, setTransition] = useState<string | null>(null);
  const summaries = useRef<StepSummary[]>([]);
  const totalBurn = useRef(0);

  useEffect(() => {
    resetCookViz(dish.rawColor, dish.cookedColor);
    cookViz.active = true;
    return () => {
      cookViz.active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = recipe.steps[stepIdx];

  const completeStep = (summary: StepSummary, burnDelta = 0) => {
    summaries.current.push(summary);
    totalBurn.current = clamp01(totalBurn.current + burnDelta);
    if (stepIdx + 1 >= recipe.steps.length) {
      cookViz.active = false;
      haptic("success");
      finishRun(rateRun(recipe.steps, summaries.current, totalBurn.current));
      return;
    }
    haptic("success");
    setTransition(step.title);
    setTimeout(() => {
      setTransition(null);
      setStepIdx((i) => i + 1);
    }, 950);
  };

  /** The pot burned past saving mid-stage — end the whole run, 0 stars. */
  const ruinRun = (summary: StepSummary) => {
    const done = [...summaries.current, summary];
    const rest = recipe.steps.slice(done.length).map(zeroSummary);
    cookViz.active = false;
    cookViz.burn = 1;
    haptic("error");
    finishRun(rateRun(recipe.steps, [...done, ...rest], 1));
  };

  return (
    <div style={S.wrap}>
      <div style={S.scrim} />

      {/* guided header: where you are in the recipe */}
      <div style={S.header}>
        <div style={S.stepDots}>
          {recipe.steps.map((st, i) => (
            <div
              key={st.id}
              style={{
                ...S.dot,
                background: i < stepIdx ? C.good : i === stepIdx ? C.gold : "rgba(255,220,170,0.22)",
              }}
            />
          ))}
        </div>
        <div style={S.stepTitle}>
          {stepIdx + 1}/{recipe.steps.length} · {step.title}
        </div>
        <MemoryAware>
          <div style={S.instruction}>{step.instruction}</div>
        </MemoryAware>
      </div>

      {/* the active stage */}
      {!transition && <Stage key={step.id} step={step} onDone={completeStep} onRuin={ruinRun} />}

      {/* stage-complete flash */}
      <AnimatePresence>
        {transition && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            style={S.transition}
          >
            ✓ {transition}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stage({
  step,
  onDone,
  onRuin,
}: {
  step: RecipeStep;
  onDone: (s: StepSummary, burnDelta?: number) => void;
  onRuin: (s: StepSummary) => void;
}) {
  switch (step.kind) {
    case "heat-hold":
      return <SyrupStage step={step} onDone={onDone} />;
    case "pour-stir":
      return <SlurryStage step={step} onDone={onDone} />;
    case "pour-while-stir":
      return <CombineStage step={step} onDone={onDone} />;
    case "stir-batches":
      return <LongStirStage step={step} onDone={onDone} onRuin={onRuin} />;
    case "timed-add":
      return <SpiceStage step={step} onDone={onDone} />;
    case "finish-call":
      return <FinishStage step={step} onDone={onDone} />;
  }
}

function zeroSummary(step: RecipeStep): StepSummary {
  switch (step.kind) {
    case "heat-hold":
      return { kind: "heat-hold", timeInBand: 0, timeAbove: 0 };
    case "pour-stir":
      return { kind: "pour-stir", pourAmounts: {}, smoothSeconds: 0 };
    case "pour-while-stir":
      return { kind: "pour-while-stir", rushedFrac: 1, stalledFrac: 1 };
    case "stir-batches":
      return { kind: "stir-batches", smoothness: 0, batchesHit: 0, burn: 1 };
    case "timed-add":
      return { kind: "timed-add", hits: 0 };
    case "finish-call":
      return { kind: "finish-call", calledAt: 0 };
  }
}

/* ------------------------------------------------------------------ */
/* shared plumbing                                                     */
/* ------------------------------------------------------------------ */

/** Pointer capture that never breaks input (synthetic/pen pointers can throw). */
function grab(e: React.PointerEvent) {
  try {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  } catch {
    /* capture is best-effort */
  }
}

/** requestAnimationFrame loop with dt; return true from cb to stop. */
function useRaf(cb: (dt: number) => boolean | void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (cbRef.current(dt) === true) return;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

/** Tracks circular finger motion inside a zone → angular speed + moving. */
function useStirTracker() {
  const zone = useRef<HTMLDivElement>(null);
  const s = useRef({ clock: 0, lastAngle: 0, lastMoveT: -1, speedEMA: 0 });

  const onMove = (clientX: number, clientY: number) => {
    const el = zone.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy) / (r.width / 2);
    if (dist < 0.18 || dist > 1.25) return;
    const ang = Math.atan2(dy, dx);
    const t = s.current;
    if (t.lastMoveT >= 0) {
      let d = ang - t.lastAngle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const dtm = Math.max(0.008, t.clock - t.lastMoveT);
      t.speedEMA += (Math.abs(d) / dtm - t.speedEMA) * 0.4;
    }
    t.lastAngle = ang;
    t.lastMoveT = t.clock;
  };

  return {
    zone,
    tick: (dt: number) => {
      s.current.clock += dt;
    },
    moving: () => s.current.lastMoveT >= 0 && s.current.clock - s.current.lastMoveT < 0.14,
    speed: () => s.current.speedEMA,
    bind: {
      onPointerMove: (e: React.PointerEvent) => onMove(e.clientX, e.clientY),
      onPointerDown: (e: React.PointerEvent) => {
        grab(e);
        onMove(e.clientX, e.clientY);
      },
    },
  };
}

/** The dashed stir ring, shared look across stir stages. */
function StirRing({
  tracker,
  glow,
  children,
}: {
  tracker: ReturnType<typeof useStirTracker>;
  glow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div ref={tracker.zone} style={S.stirZone} {...tracker.bind}>
      <div
        style={{
          ...S.ring,
          borderColor: glow ?? "rgba(255,220,170,0.3)",
          boxShadow: glow ? `0 0 30px ${glow}` : "none",
        }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, ease: "linear", duration: 3.2 }}
        style={S.arrows}
      >
        <span style={S.arrow}>↻</span>
      </motion.div>
      {children}
    </div>
  );
}

function MeterRow({ label, fillRef, gradient }: { label: string; fillRef: React.RefObject<HTMLDivElement>; gradient: string }) {
  return (
    <div style={S.meterRow}>
      <span style={S.meterLabel}>{label}</span>
      <div style={S.track}>
        <div ref={fillRef} style={{ ...S.fill, background: gradient }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 1 — Syrup: hold the flame, keep the simmer in the band        */
/* ------------------------------------------------------------------ */

function SyrupStage({ step, onDone }: { step: HeatHoldStep; onDone: (s: StepSummary, b?: number) => void }) {
  const holding = useRef(false);
  const sim = useRef({ heat: 0.12, inBand: 0, above: 0, done: false });
  const heatFill = useRef<HTMLDivElement>(null);
  const holdFill = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"cold" | "simmer" | "hot">("cold");
  const [lo, hi] = step.band;

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    s.heat = clamp01(s.heat + (holding.current ? dt * 0.42 : -dt * 0.3));
    const inBand = s.heat >= lo && s.heat <= hi;
    if (inBand) s.inBand += dt;
    if (s.heat > hi) s.above += dt;

    cookViz.heat = s.heat;
    cookViz.progress = 0.06;
    cookViz.bubble = inBand ? 0.4 : s.heat > hi ? 0.9 : 0.08;

    if (heatFill.current) heatFill.current.style.height = `${s.heat * 100}%`;
    if (holdFill.current) holdFill.current.style.transform = `scaleX(${clamp01(s.inBand / step.holdSeconds)})`;
    const st = inBand ? "simmer" : s.heat > hi ? "hot" : "cold";
    setState((p) => (p === st ? p : st));

    if (s.inBand >= step.holdSeconds) {
      s.done = true;
      onDone({ kind: "heat-hold", timeInBand: s.inBand, timeAbove: s.above }, (s.above / step.holdSeconds) * 0.12);
      return true;
    }
  });

  return (
    <>
      <div style={S.meters}>
        <MeterRow label="Hold" fillRef={holdFill} gradient={`linear-gradient(90deg,${C.saffron},${C.good})`} />
      </div>
      <div style={S.centerRow}>
        {/* heat gauge with simmer band */}
        <div style={S.gauge}>
          <div
            style={{
              ...S.band,
              bottom: `${lo * 100}%`,
              height: `${(hi - lo) * 100}%`,
              boxShadow: state === "simmer" ? `0 0 20px ${C.good}` : "none",
              borderColor: state === "simmer" ? C.good : "rgba(143,208,106,0.5)",
            }}
          />
          <div ref={heatFill} style={{ ...S.gaugeFill, background: "linear-gradient(180deg,#ffb14d,#e8624a)" }} />
          <div style={S.targetLabel}>simmer</div>
        </div>

        {/* flame hold button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onPointerDown={(e) => {
            grab(e);
            holding.current = true;
            haptic("tick");
          }}
          onPointerUp={() => (holding.current = false)}
          onPointerCancel={() => (holding.current = false)}
          style={S.bigHold}
        >
          <span style={{ fontSize: 46 }}>🔥</span>
          <span style={S.bigHoldLabel}>hold to heat</span>
        </motion.button>
      </div>
      <Hint
        text={state === "simmer" ? "Perfect simmer — hold it ✦" : state === "hot" ? "Too hot! Ease off" : "Bring it up to a simmer"}
        tone={state === "simmer" ? "good" : state === "hot" ? "bad" : undefined}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 2 — Slurry: pour starch + cold water, then stir it silky      */
/* ------------------------------------------------------------------ */

function SlurryStage({ step, onDone }: { step: PourStirStep; onDone: (s: StepSummary) => void }) {
  const [pourIdx, setPourIdx] = useState(0);
  const amounts = useRef<Record<string, number>>({});
  const pouring = pourIdx < step.pours.length;

  return pouring ? (
    <PourGauge
      key={step.pours[pourIdx].key}
      pour={step.pours[pourIdx]}
      onPoured={(amount) => {
        amounts.current[step.pours[pourIdx].key] = amount;
        setPourIdx((i) => i + 1);
      }}
    />
  ) : (
    <SmoothStir step={step} amounts={amounts.current} onDone={onDone} />
  );
}

function PourGauge({
  pour,
  onPoured,
}: {
  pour: PourStirStep["pours"][number];
  onPoured: (amount: number) => void;
}) {
  const fill = useRef(0);
  const holding = useRef(false);
  const released = useRef(false);
  const fillEl = useRef<HTMLDivElement>(null);
  const [inBand, setInBand] = useState(false);
  const [flash, setFlash] = useState<null | boolean>(null);
  const bandLo = Math.max(0, pour.target - pour.tolerance);
  const bandHi = Math.min(1, pour.target + pour.tolerance);

  useRaf((dt) => {
    if (released.current) return;
    if (holding.current) {
      fill.current = Math.min(1, fill.current + dt * 0.62);
      if (fillEl.current) fillEl.current.style.height = `${fill.current * 100}%`;
      const band = fill.current >= bandLo && fill.current <= bandHi;
      setInBand((p) => {
        if (p !== band && band) haptic("tick");
        return band;
      });
      if (fill.current >= 1) release();
    }
    cookViz.progress = 0.1;
    cookViz.bubble = 0.1;
  });

  const release = () => {
    if (!holding.current || released.current) return;
    holding.current = false;
    released.current = true;
    const amount = fill.current;
    const good =
      scorePour(
        { key: pour.key, label: pour.label, emoji: pour.emoji, color: pour.color, target: pour.target, tolerance: pour.tolerance },
        amount
      ) >= 0.8;
    haptic(good ? "success" : "error");
    setFlash(good);
    setTimeout(() => onPoured(amount), 620);
  };

  return (
    <>
      <div style={S.centerRow}>
        <div style={S.gauge}>
          <div
            style={{
              ...S.band,
              bottom: `${bandLo * 100}%`,
              height: `${(bandHi - bandLo) * 100}%`,
              boxShadow: inBand ? `0 0 20px ${C.good}` : "none",
              borderColor: inBand ? C.good : "rgba(143,208,106,0.5)",
            }}
          />
          <div ref={fillEl} style={{ ...S.gaugeFill, background: pour.color }} />
          <div style={S.targetLabel}>{pour.amount}</div>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onPointerDown={(e) => {
            grab(e);
            holding.current = true;
          }}
          onPointerUp={release}
          onPointerCancel={release}
          style={{ ...S.bigHold, background: pour.color, color: C.ink }}
        >
          <span style={{ fontSize: 46 }}>{pour.emoji}</span>
          <span style={{ ...S.bigHoldLabel, color: C.ink }}>{pour.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, color: C.ink }}>hold to pour</span>
        </motion.button>
      </div>
      <AnimatePresence>
        {flash !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ ...S.flash, color: flash ? C.good : C.bad }}
          >
            {flash ? "Perfect!" : "Off amount"}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SmoothStir({
  step,
  amounts,
  onDone,
}: {
  step: PourStirStep;
  amounts: Record<string, number>;
  onDone: (s: StepSummary) => void;
}) {
  const dish = DISHES[useGame((s) => s.selected)];
  const potTol = useGame((s) => s.upgrades.pot) * 0.9;
  const tracker = useStirTracker();
  const sim = useRef({ smooth: 0, total: 0, done: false });
  const smoothFill = useRef<HTMLDivElement>(null);
  const [good, setGood] = useState(false);

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    tracker.tick(dt);
    s.total += dt;
    const moving = tracker.moving();
    const q = moving ? tempoQuality(dish, tracker.speed(), potTol) : 0;
    if (moving && q > 0.5) s.smooth += dt;
    setGood((p) => (p === (moving && q > 0.5) ? p : moving && q > 0.5));

    cookViz.progress = 0.12;
    cookViz.bubble = moving ? 0.3 : 0.05;
    if (smoothFill.current)
      smoothFill.current.style.transform = `scaleX(${clamp01(s.smooth / step.smoothSeconds)})`;

    if (s.smooth >= step.smoothSeconds || s.total >= step.smoothSeconds * 3.2) {
      s.done = true;
      onDone({ kind: "pour-stir", pourAmounts: amounts, smoothSeconds: s.smooth });
      return true;
    }
  });

  return (
    <>
      <div style={S.meters}>
        <MeterRow label="Silky" fillRef={smoothFill} gradient={`linear-gradient(90deg,${C.saffron},${C.good})`} />
      </div>
      <StirRing tracker={tracker} glow={good ? C.good : undefined} />
      <Hint text={good ? "Silky… keep going ✦" : "Stir in steady circles"} tone={good ? "good" : undefined} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 3 — Combine: feather the pour, never stop stirring            */
/* ------------------------------------------------------------------ */

function CombineStage({ step, onDone }: { step: PourWhileStirStep; onDone: (s: StepSummary) => void }) {
  const tracker = useStirTracker();
  const holding = useRef(false);
  const sim = useRef({ poured: 0, rushed: 0, stalled: 0, streak: 0, done: false });
  const pourFill = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "good" | "fast" | "stall">("idle");

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    tracker.tick(dt);
    const stirring = tracker.moving();

    if (holding.current) {
      s.poured += dt;
      s.streak += dt;
      if (!stirring) s.stalled += dt;
      if (s.streak > 1.3) s.rushed += dt;
    } else {
      s.streak = 0;
    }

    const st = !holding.current ? "idle" : s.streak > 1.3 ? "fast" : !stirring ? "stall" : "good";
    setStatus((p) => (p === st ? p : st));

    cookViz.progress = 0.16 + (s.poured / step.pourSeconds) * 0.06;
    cookViz.bubble = stirring ? 0.35 : 0.08;
    if (pourFill.current) pourFill.current.style.transform = `scaleX(${clamp01(s.poured / step.pourSeconds)})`;

    if (s.poured >= step.pourSeconds) {
      s.done = true;
      onDone({
        kind: "pour-while-stir",
        rushedFrac: clamp01(s.rushed / step.pourSeconds),
        stalledFrac: clamp01(s.stalled / step.pourSeconds),
      });
      return true;
    }
  });

  return (
    <>
      <div style={S.meters}>
        <MeterRow label="Poured" fillRef={pourFill} gradient={`linear-gradient(90deg,#bcd8e8,${C.good})`} />
      </div>
      <StirRing tracker={tracker} glow={status === "good" ? C.good : status === "idle" ? undefined : C.bad} />
      {/* slurry bowl — feather it */}
      <div style={S.combinePour}>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onPointerDown={(e) => {
            grab(e);
            holding.current = true;
          }}
          onPointerUp={() => (holding.current = false)}
          onPointerCancel={() => (holding.current = false)}
          style={{ ...S.bigHold, width: 120, height: 120, background: "#e8dcc4", color: C.ink }}
        >
          <span style={{ fontSize: 40 }}>🥣</span>
          <span style={{ ...S.bigHoldLabel, color: C.ink, fontSize: 12 }}>hold to pour</span>
        </motion.button>
      </div>
      <Hint
        text={
          status === "fast"
            ? "TOO FAST — lumps forming!"
            : status === "stall"
              ? "Keep stirring while you pour!"
              : status === "good"
                ? "Thin stream… beautiful ✦"
                : "Pour in short bursts, stir non-stop"
        }
        tone={status === "good" ? "good" : status === "idle" ? undefined : "bad"}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 4 — The long stir: rhythm + heat + ghee ladles on cue         */
/* ------------------------------------------------------------------ */

const HEATS = [
  { label: "Low", cook: 0.72, burn: 0.6, viz: 0.32 },
  { label: "Med", cook: 1.0, burn: 1.0, viz: 0.56 },
  { label: "High", cook: 1.45, burn: 1.8, viz: 0.85 },
];

function LongStirStage({
  step,
  onDone,
  onRuin,
}: {
  step: StirBatchesStep;
  onDone: (s: StepSummary, b?: number) => void;
  onRuin: (s: StepSummary) => void;
}) {
  const dish = DISHES[useGame((s) => s.selected)];
  const potTol = useGame((s) => s.upgrades.pot) * 0.9;
  const burnResist = useGame((s) => s.burnResist());
  const tracker = useStirTracker();

  const [heatIdx, setHeatIdx] = useState(1);
  const heatRef = useRef(1);
  const [cue, setCue] = useState<number | null>(null); // pending ghee index
  const [good, setGood] = useState(false);

  const sim = useRef({
    progress: 0,
    burn: 0,
    smoothQ: 0,
    smoothT: 0,
    hits: 0,
    clock: 0,
    cueIdx: 0,
    cueEnd: 0,
    cueOpen: false,
    done: false,
  });
  const progFill = useRef<HTMLDivElement>(null);
  const burnFill = useRef<HTMLDivElement>(null);

  const n = step.batches.length;

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    tracker.tick(dt);
    s.clock += dt;

    const heat = HEATS[heatRef.current];
    const moving = tracker.moving();
    const speed = moving ? tracker.speed() : 0;
    const q = moving ? tempoQuality(dish, speed, potTol) : 0;
    const { center, band } = idealTempo(dish);
    const tooFast = moving && speed > center + band + potTol + 2.5;

    // progress toward "thick and translucent"
    s.progress = clamp01(s.progress + (dt / step.durationSeconds) * heat.cook * (moving ? 1 : 0.15));
    if (moving) {
      s.smoothT += dt;
      s.smoothQ += q * dt;
    }

    // ghee cues at even fractions — the sheen dulls, the pot "asks"
    if (!s.cueOpen && s.cueIdx < n && s.progress >= (s.cueIdx + 1) / (n + 1)) {
      s.cueOpen = true;
      s.cueEnd = s.clock + 3.2;
      haptic("light");
      setCue(s.cueIdx);
    }
    if (s.cueOpen && s.clock > s.cueEnd) {
      s.cueOpen = false;
      s.cueIdx += 1;
      setCue(null); // missed
    }

    // burn model
    let burnUp = 0;
    if (s.progress > 0.06) {
      if (!moving) burnUp += 0.14 * heat.burn;
      if (tooFast) burnUp += 0.09;
      if (heatRef.current === 2) burnUp += 0.03;
    }
    burnUp *= 1 - burnResist;
    const relief = moving && q > 0.55 ? 0.06 : 0;
    s.burn = clamp01(s.burn + dt * (burnUp - relief));

    // visuals
    cookViz.progress = 0.2 + s.progress * 0.5;
    cookViz.burn = s.burn;
    cookViz.bubble = moving ? 0.4 + q * 0.5 : 0.08;
    cookViz.heat = heat.viz;
    cookViz.sheen = s.cueOpen ? 0.15 : 0.35 + s.progress * 0.4; // dull = asking for ghee

    if (progFill.current) progFill.current.style.transform = `scaleX(${s.progress})`;
    if (burnFill.current) {
      burnFill.current.style.transform = `scaleX(${s.burn})`;
      burnFill.current.style.opacity = s.burn > 0.02 ? "1" : "0";
    }
    setGood((p) => (p === (moving && q > 0.6) ? p : moving && q > 0.6));

    const summary = (): StepSummary => ({
      kind: "stir-batches",
      smoothness: s.smoothT > 0 ? s.smoothQ / s.smoothT : 0,
      batchesHit: s.hits,
      burn: s.burn,
    });

    if (s.burn >= 1) {
      s.done = true;
      onRuin(summary());
      return true;
    }
    if (s.progress >= 1) {
      s.done = true;
      onDone(summary(), s.burn * 0.5);
      return true;
    }
  });

  const ladle = () => {
    const s = sim.current;
    if (!s.cueOpen) return;
    s.cueOpen = false;
    s.cueIdx += 1;
    s.hits += 1;
    cookViz.sparkAt += 1;
    haptic("success");
    setCue(null);
  };

  return (
    <>
      <div style={S.meters}>
        <MeterRow label="Thick" fillRef={progFill} gradient={`linear-gradient(90deg,${C.saffron},${C.amber})`} />
        <MeterRow label="Burn" fillRef={burnFill} gradient={`linear-gradient(90deg,#e8a34a,${C.bad})`} />
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

      <StirRing tracker={tracker} glow={good ? C.good : undefined}>
        {/* ghee ladle cue */}
        <AnimatePresence>
          {cue !== null && (
            <motion.div
              key={cue}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.14, 1], opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ scale: { repeat: Infinity, duration: 0.7 } }}
              onPointerDown={(e) => {
                e.stopPropagation();
                ladle();
              }}
              style={{ ...S.cue, boxShadow: "0 0 40px #f3c65a", borderColor: "#f3c65a" }}
            >
              <span style={{ fontSize: 40 }}>🧈</span>
              <span style={{ fontSize: 12, fontWeight: 800 }}>
                {step.batches[cue]?.label ?? "Ghee"} — TAP
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </StirRing>

      <Hint
        text={
          cue !== null
            ? "The shine dulled — ghee, now!"
            : good
              ? "Steady rhythm ✦"
              : "Keep it moving or it scorches"
        }
        tone={cue !== null ? "warn" : good ? "good" : undefined}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 5 — Spices: keep stirring, catch each cue                     */
/* ------------------------------------------------------------------ */

function SpiceStage({ step, onDone }: { step: TimedAddStep; onDone: (s: StepSummary, b?: number) => void }) {
  const dish = DISHES[useGame((s) => s.selected)];
  const potTol = useGame((s) => s.upgrades.pot) * 0.9;
  const tracker = useStirTracker();
  const [cue, setCue] = useState<number | null>(null);
  const sim = useRef({ clock: 0, idx: 0, open: false, end: 0, hits: 0, idle: 0, done: false });

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    tracker.tick(dt);
    s.clock += dt;
    const moving = tracker.moving();
    if (!moving) s.idle += dt;

    const q = moving ? tempoQuality(dish, tracker.speed(), potTol) : 0;
    cookViz.progress = 0.72;
    cookViz.bubble = moving ? 0.35 + q * 0.3 : 0.08;

    if (!s.open && s.idx < step.adds.length && s.clock >= 1 + s.idx * 2.6) {
      s.open = true;
      s.end = s.clock + 1.8;
      haptic("light");
      setCue(s.idx);
    }
    if (s.open && s.clock > s.end) {
      s.open = false;
      s.idx += 1;
      setCue(null);
    }

    if (s.idx >= step.adds.length && !s.open) {
      s.done = true;
      onDone({ kind: "timed-add", hits: s.hits }, Math.min(0.15, s.idle * 0.02));
      return true;
    }
  });

  const tap = () => {
    const s = sim.current;
    if (!s.open) return;
    s.open = false;
    s.idx += 1;
    s.hits += 1;
    cookViz.sparkAt += 1;
    haptic("success");
    setCue(null);
  };

  return (
    <>
      <StirRing tracker={tracker}>
        <AnimatePresence>
          {cue !== null && (
            <motion.div
              key={cue}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.14, 1], opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ scale: { repeat: Infinity, duration: 0.7 } }}
              onPointerDown={(e) => {
                e.stopPropagation();
                tap();
              }}
              style={{ ...S.cue, boxShadow: `0 0 40px ${step.adds[cue].color}`, borderColor: step.adds[cue].color }}
            >
              <span style={{ fontSize: 40 }}>{step.adds[cue].emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 800 }}>{step.adds[cue].label} — TAP</span>
            </motion.div>
          )}
        </AnimatePresence>
      </StirRing>
      <Hint text={cue !== null ? `Now — the ${step.adds[cue].label.toLowerCase()}!` : "Keep stirring… the perfume goes in late"} tone={cue !== null ? "warn" : undefined} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 6 — Calling it: watch the pot, tap when it's ready            */
/* ------------------------------------------------------------------ */

function FinishStage({ step, onDone }: { step: FinishCallStep; onDone: (s: StepSummary) => void }) {
  const tracker = useStirTracker();
  // from memory, nothing signals the window — you read the pot itself
  const memory = useGame((s) => s.cookMode) === "memory";
  const sim = useRef({ doneness: 0, done: false });
  const [readyRaw, setReady] = useState(false);
  const ready = readyRaw && !memory;

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    tracker.tick(dt);
    const moving = tracker.moving();
    s.doneness += dt * (moving ? 0.085 : 0.03);

    cookViz.progress = 0.72 + clamp01(s.doneness) * 0.26;
    cookViz.sheen = 0.5 + clamp01(s.doneness) * 0.45;
    cookViz.bubble = moving ? 0.3 : 0.06;

    const inWindow = s.doneness >= step.idealWindow[0] && s.doneness <= step.idealWindow[1];
    setReady((p) => (p === inWindow ? p : inWindow));

    // waited far too long — the pot calls it for you, overcooked
    if (s.doneness >= 1.12) {
      s.done = true;
      onDone({ kind: "finish-call", calledAt: s.doneness });
      return true;
    }
  });

  const call = () => {
    const s = sim.current;
    if (s.done) return;
    s.done = true;
    haptic("success");
    onDone({ kind: "finish-call", calledAt: s.doneness });
  };

  return (
    <>
      <StirRing tracker={tracker} glow={ready ? C.gold : undefined} />
      <div style={S.finishBtnWrap}>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={call}
          animate={ready ? { scale: [1, 1.05, 1] } : {}}
          transition={ready ? { repeat: Infinity, duration: 0.8 } : {}}
          style={{
            ...S.finishBtn,
            background: ready ? `linear-gradient(180deg,#ffd876,#eaa72f)` : "rgba(255,240,220,0.14)",
            color: ready ? C.ink : C.cream,
            boxShadow: ready ? "0 0 40px rgba(255,190,70,0.6)" : "none",
          }}
        >
          It's done! 🍯
        </motion.button>
      </div>
      <Hint
        text={ready ? "Translucent, glossy, pulling off the sides…" : "Watch the pot — amber, glossy, one body"}
        tone={ready ? "good" : undefined}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

/** Renders children only in guided mode — memory runs cook without prompts. */
function MemoryAware({ children }: { children: React.ReactNode }) {
  const memory = useGame((s) => s.cookMode) === "memory";
  return memory ? null : <>{children}</>;
}

function Hint({ text, tone }: { text: string; tone?: "good" | "bad" | "warn" }) {
  const memory = useGame((s) => s.cookMode) === "memory";
  const color = tone === "good" ? C.good : tone === "bad" ? C.bad : tone === "warn" ? C.gold : C.cream;
  if (memory) return null;
  return (
    <div style={S.hintWrap}>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          style={{ ...S.hint, color }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { position: "fixed", inset: 0, pointerEvents: "none", fontFamily: FONT, color: C.cream, touchAction: "none" },
  scrim: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at 50% 48%, rgba(24,12,6,0.05), rgba(14,7,3,0.5))",
  },
  header: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 58px)",
    left: 20,
    right: 20,
    textAlign: "center",
  },
  stepDots: { display: "flex", justifyContent: "center", gap: 7, marginBottom: 8 },
  dot: { width: 9, height: 9, borderRadius: "50%", transition: "background 0.3s" },
  stepTitle: { fontSize: 15, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase", opacity: 0.95 },
  instruction: { fontSize: 13.5, opacity: 0.85, marginTop: 4, lineHeight: 1.35 },
  transition: {
    position: "absolute",
    top: "44%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 30,
    fontWeight: 900,
    color: C.good,
    textShadow: "0 2px 14px rgba(0,0,0,0.6)",
  },
  meters: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 128px)",
    left: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  meterRow: { display: "flex", alignItems: "center", gap: 10 },
  meterLabel: { width: 44, fontSize: 12, fontWeight: 800, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    background: "rgba(20,10,4,0.55)",
    border: "1px solid rgba(255,200,140,0.18)",
    overflow: "hidden",
  },
  fill: { height: "100%", width: "100%", transformOrigin: "left", transform: "scaleX(0)", borderRadius: 999 },
  centerRow: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 46px)",
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
    height: 210,
    borderRadius: 18,
    background: "rgba(20,10,4,0.6)",
    border: "1px solid rgba(255,200,140,0.22)",
    overflow: "hidden",
  },
  gaugeFill: { position: "absolute", left: 0, right: 0, bottom: 0, height: "0%", borderRadius: "0 0 16px 16px", transition: "height 0.05s linear" },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    background: "rgba(143,208,106,0.22)",
    borderTop: "2px solid",
    borderBottom: "2px solid",
    borderColor: "rgba(143,208,106,0.5)",
  },
  targetLabel: { position: "absolute", top: 6, left: 0, right: 0, textAlign: "center", fontSize: 9, opacity: 0.6 },
  bigHold: {
    pointerEvents: "auto",
    width: 150,
    height: 150,
    borderRadius: "50%",
    border: "4px solid rgba(255,255,255,0.35)",
    background: "linear-gradient(180deg,#ffb14d,#f0822d)",
    color: C.ink,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
    touchAction: "none",
    fontFamily: FONT,
  },
  bigHoldLabel: { fontSize: 14, fontWeight: 900, color: C.ink },
  stirZone: {
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
    inset: 0,
    borderRadius: "50%",
    border: "3px dashed rgba(255,220,170,0.3)",
    transition: "border-color 0.12s, box-shadow 0.12s",
  },
  arrows: { width: "62%", height: "62%", borderRadius: "50%", display: "grid", placeItems: "center", opacity: 0.28 },
  arrow: { fontSize: 44, color: C.cream },
  cue: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: 14,
    borderRadius: 24,
    background: "rgba(30,16,8,0.85)",
    border: "2px solid",
    pointerEvents: "auto",
    cursor: "pointer",
  },
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
    fontFamily: FONT,
  },
  combinePour: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 108px)",
    left: 26,
  },
  finishBtnWrap: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 100px)",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
  },
  finishBtn: {
    pointerEvents: "auto",
    padding: "18px 44px",
    borderRadius: 999,
    fontSize: 20,
    fontWeight: 900,
    border: "1px solid rgba(255,200,140,0.3)",
    cursor: "pointer",
    fontFamily: FONT,
    transition: "background 0.2s, color 0.2s",
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
    fontSize: 15,
    fontWeight: 700,
    border: "1px solid rgba(255,200,140,0.2)",
  },
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
