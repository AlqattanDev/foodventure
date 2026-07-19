import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RECIPES } from "../data/recipes";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { cookViz, resetCookViz, SCORCH_N } from "../game/cookViz";
import { clamp01 } from "../game/scoring";
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
import { createStir, stepStir, coverageQuality, scorchTotal, worstSpot, isStirring } from "../game/stir";
import { createBurner, stepBurner, bubbleStage, type BurnerState } from "../game/burner";
import { createPour, stepPour, streamKind } from "../game/pour";
import { haptic } from "../game/haptics";
import { PourVessel } from "./cook/PourVessel";
import { StirPad, type PadPointer } from "./cook/StirPad";
import { GasKnob } from "./cook/GasKnob";
import { DragAdd } from "./cook/DragAdd";
import { useRaf, grab } from "./cook/shared";
import { C, FONT } from "./theme";

/**
 * The V3 cook: hands, not bars. Measuring is tilting real vessels to etched
 * lines; stirring is free paddle work over a pot that scorches exactly where
 * you neglect it; heat is a gas knob read through rim bubbles; ghee and spices
 * are carried to the pot by hand. The pot is the interface — no meters.
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
      <style>{`@keyframes vesselStreamFall { to { background-position: 0 30px; } }`}</style>
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
    case "pour-stir":
      return step.id === "base" ? (
        <PotPourStage step={step} onDone={onDone} />
      ) : (
        <SlurryStage step={step} onDone={onDone} />
      );
    case "heat-hold":
      return <SimmerStage step={step} onDone={onDone} />;
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
/* Stage 1 — The syrup base: measure sugar & water into the pot        */
/* ------------------------------------------------------------------ */

function PotPourStage({ step, onDone }: { step: PourStirStep; onDone: (s: StepSummary) => void }) {
  const [pourIdx, setPourIdx] = useState(0);
  const amounts = useRef<Record<string, number>>({});
  const pouring = pourIdx < step.pours.length;

  // decay the tip-in stream the vessel confirm kicks off
  useRaf((dt) => {
    cookViz.streamRate = Math.max(0, cookViz.streamRate - dt * 1.4);
    cookViz.progress = 0.04;
  });

  return pouring ? (
    <PourVessel
      key={step.pours[pourIdx].key}
      pour={step.pours[pourIdx]}
      intoLabel="into the pot"
      onDone={(amount) => {
        amounts.current[step.pours[pourIdx].key] = amount;
        cookViz.streamRate = 0.55;
        cookViz.streamColor = step.pours[pourIdx].color;
        setPourIdx((i) => i + 1);
      }}
    />
  ) : (
    <PotMix step={step} amounts={amounts.current} onDone={onDone} />
  );
}

/** Brief pot stir — dissolve what you just poured. Free motion, no rhythm. */
function PotMix({
  step,
  amounts,
  onDone,
}: {
  step: PourStirStep;
  amounts: Record<string, number>;
  onDone: (s: StepSummary) => void;
}) {
  const ptr = useRef<PadPointer>({ x: 0, y: 0, down: false });
  const grid = useRef(createStir(SCORCH_N));
  const sim = useRef({ smooth: 0, total: 0, done: false });
  const [active, setActive] = useState(false);

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    s.total += dt;
    const g = grid.current;
    stepStir(g, ptr.current.down ? { x: ptr.current.x, y: ptr.current.y } : null, 0, dt);
    const moving = isStirring(g);
    if (moving) s.smooth += dt;

    writePaddle(ptr.current, moving);
    cookViz.streamRate = Math.max(0, cookViz.streamRate - dt * 1.4);
    cookViz.bubble = moving ? 0.18 : 0.04;
    cookViz.sheen = 0.3 + (s.smooth / step.smoothSeconds) * 0.25;
    setActive((p) => (p === moving ? p : moving));

    if (s.smooth >= step.smoothSeconds || s.total >= step.smoothSeconds * 4) {
      s.done = true;
      cookViz.paddleActive = false;
      onDone({ kind: "pour-stir", pourAmounts: amounts, smoothSeconds: Math.min(s.smooth, step.smoothSeconds) });
      return true;
    }
  });

  return (
    <>
      <StirPad ptr={ptr} />
      <Hint text={active ? "The sugar is dissolving… ✦" : "Give it a good mix — dissolve the sugar"} tone={active ? "good" : undefined} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 2 — The simmer: gas knob + rim bubbles, no gauge              */
/* ------------------------------------------------------------------ */

function SimmerStage({ step, onDone }: { step: HeatHoldStep; onDone: (s: StepSummary, b?: number) => void }) {
  const knob = useRef(0.15);
  const burner = useRef<BurnerState>(createBurner(0.15));
  const sim = useRef({ inBand: 0, above: 0, done: false });
  const [stage, setStage] = useState<"still" | "beads" | "simmer" | "rolling">("still");

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    stepBurner(burner.current, knob.current, dt);
    const heat = burner.current.heat;
    const st = bubbleStage(heat, step.band);
    if (st === "simmer") s.inBand += dt;
    if (st === "rolling") s.above += dt;

    cookViz.heat = heat;
    cookViz.progress = 0.05 + (s.inBand / step.holdSeconds) * 0.04;
    cookViz.bubble = st === "still" ? 0.03 : st === "beads" ? 0.22 : st === "simmer" ? 0.5 : 0.95;
    cookViz.sheen = 0.4 + (s.inBand / step.holdSeconds) * 0.2;
    setStage((p) => (p === st ? p : st));

    if (s.inBand >= step.holdSeconds) {
      s.done = true;
      onDone({ kind: "heat-hold", timeInBand: s.inBand, timeAbove: s.above }, (s.above / step.holdSeconds) * 0.12);
      return true;
    }
  });

  return (
    <>
      <GasKnob knob={knob} />
      <Hint
        text={
          stage === "simmer"
            ? "Beads at the rim — that's the simmer, hold it ✦"
            : stage === "rolling"
              ? "Rolling boil! Ease the gas down"
              : stage === "beads"
                ? "Almost… a touch more gas"
                : "Open the gas — watch the rim of the pot"
        }
        tone={stage === "simmer" ? "good" : stage === "rolling" ? "bad" : undefined}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 3 — The slurry: measure into the bowl, whisk the lumps out    */
/* ------------------------------------------------------------------ */

function SlurryStage({ step, onDone }: { step: PourStirStep; onDone: (s: StepSummary) => void }) {
  const [pourIdx, setPourIdx] = useState(0);
  const amounts = useRef<Record<string, number>>({});
  const pouring = pourIdx < step.pours.length;

  return pouring ? (
    <PourVessel
      key={step.pours[pourIdx].key}
      pour={step.pours[pourIdx]}
      intoLabel="into the bowl"
      onDone={(amount) => {
        amounts.current[step.pours[pourIdx].key] = amount;
        setPourIdx((i) => i + 1);
      }}
    />
  ) : (
    <BowlMix step={step} amounts={amounts.current} onDone={onDone} />
  );
}

/** Whisk the slurry bowl silky — the lumps visibly dissolve under your finger. */
function BowlMix({
  step,
  amounts,
  onDone,
}: {
  step: PourStirStep;
  amounts: Record<string, number>;
  onDone: (s: StepSummary) => void;
}) {
  const ptr = useRef<PadPointer>({ x: 0, y: 0, down: false });
  const grid = useRef(createStir(SCORCH_N));
  const sim = useRef({ smooth: 0, total: 0, done: false });
  const lumpRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(false);

  const LUMPS = useRef(
    Array.from({ length: 7 }, (_, i) => ({
      x: 24 + ((i * 53) % 52),
      y: 22 + ((i * 37) % 46),
      s: 12 + (i % 3) * 7,
      die: 0.25 + (i / 7) * 0.7, // the smooth fraction at which this lump vanishes
    }))
  );

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    s.total += dt;
    const g = grid.current;
    stepStir(g, ptr.current.down ? { x: ptr.current.x, y: ptr.current.y } : null, 0, dt);
    const moving = isStirring(g);
    if (moving) s.smooth += dt;
    const prog = s.smooth / step.smoothSeconds;

    LUMPS.current.forEach((l, i) => {
      const el = lumpRefs.current[i];
      if (!el) return;
      const life = clamp01((l.die - prog) / 0.12);
      const wob = moving ? Math.sin(performance.now() / 90 + i * 2) * 3 : 0;
      el.style.transform = `translate(${wob}px, 0) scale(${life})`;
    });
    setActive((p) => (p === moving ? p : moving));

    if (s.smooth >= step.smoothSeconds || s.total >= step.smoothSeconds * 4) {
      s.done = true;
      onDone({ kind: "pour-stir", pourAmounts: amounts, smoothSeconds: Math.min(s.smooth, step.smoothSeconds) });
      return true;
    }
  });

  return (
    <>
      <div style={S.mixBowlWrap}>
        <div style={S.mixBowl}>
          {LUMPS.current.map((l, i) => (
            <div
              key={i}
              ref={(el) => (lumpRefs.current[i] = el)}
              style={{
                position: "absolute",
                left: l.x,
                top: l.y,
                width: l.s,
                height: l.s * 0.8,
                borderRadius: "50%",
                background: "#efe0b8",
                boxShadow: "inset -2px -2px 3px rgba(120,90,40,0.4)",
              }}
            />
          ))}
        </div>
        <div style={S.mixBowlFoot} />
      </div>
      <StirPad ptr={ptr} size="min(64vw, 300px)" top="56%" />
      <Hint
        text={active ? "Whisking the lumps out… ✦" : "Whisk it — chase every lump"}
        tone={active ? "good" : undefined}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 4 — Marrying them: tilt the bowl with one thumb, stir with    */
/* the other. Thin stream or it lumps; stop stirring and it sticks.    */
/* ------------------------------------------------------------------ */

// the pour length is player-controlled (the bowl's volume), so the step data
// carries no knobs the stage needs
function CombineStage({ onDone }: { step: PourWhileStirStep; onDone: (s: StepSummary) => void }) {
  const ptr = useRef<PadPointer>({ x: 0, y: 0, down: false });
  const grid = useRef(createStir(SCORCH_N));
  const pour = useRef(createPour()); // fill here = how much slurry has gone in
  const drag = useRef({ startY: 0, tilt: 0, held: false });
  const sim = useRef({ pourT: 0, rushed: 0, stalled: 0, done: false });
  const bowlEl = useRef<HTMLDivElement>(null);
  const bowlFillEl = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "good" | "fast" | "stall">("idle");

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    const d = drag.current;
    stepPour(pour.current, d.held ? d.tilt : 0, false, dt);
    const flow = pour.current.flow;
    const kind = streamKind(flow);

    const g = grid.current;
    stepStir(g, ptr.current.down ? { x: ptr.current.x, y: ptr.current.y } : null, 0.4, dt);
    const stirring = isStirring(g);

    if (kind !== "none") {
      s.pourT += dt;
      if (kind === "glug") s.rushed += dt;
      if (!stirring) s.stalled += dt;
    }

    // visuals
    writePaddle(ptr.current, stirring);
    cookViz.streamRate = flow * 2.2;
    cookViz.streamColor = "#efe6d2";
    cookViz.bubble = stirring ? 0.4 : 0.1;
    cookViz.progress = 0.12 + pour.current.fill * 0.08;
    if (bowlEl.current) {
      bowlEl.current.style.transform = `translate(${-d.tilt * 30}px, ${-d.tilt * 20}px) rotate(${-d.tilt * 75}deg)`;
    }
    if (bowlFillEl.current) bowlFillEl.current.style.height = `${(1 - pour.current.fill) * 74}%`;

    const st = kind === "none" ? "idle" : kind === "glug" ? "fast" : !stirring ? "stall" : "good";
    setStatus((p) => (p === st ? p : st));

    if (pour.current.fill >= 0.995) {
      s.done = true;
      cookViz.paddleActive = false;
      cookViz.streamRate = 0;
      const t = Math.max(0.001, s.pourT);
      onDone({
        kind: "pour-while-stir",
        rushedFrac: clamp01(s.rushed / t),
        stalledFrac: clamp01(s.stalled / t),
      });
      return true;
    }
  });

  return (
    <>
      <StirPad ptr={ptr} />
      {/* the slurry bowl — held in your other hand */}
      <div
        ref={bowlEl}
        style={S.combineBowl}
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
        <div style={S.combineBowlInner}>
          <div ref={bowlFillEl} style={S.combineBowlFill} />
        </div>
        <span style={S.combineBowlLabel}>slurry · tilt to pour</span>
      </div>
      <Hint
        text={
          status === "fast"
            ? "TOO FAST — it's glugging, lumps forming!"
            : status === "stall"
              ? "Keep the other thumb stirring!"
              : status === "good"
                ? "Thin stream, steady stir… beautiful ✦"
                : "Tilt the bowl gently — and never stop stirring"
        }
        tone={status === "good" ? "good" : status === "idle" ? undefined : "bad"}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 5 — The long stir: coverage vs scorch, gas in your control,   */
/* ghee carried to the pot when the sheen dulls                        */
/* ------------------------------------------------------------------ */

function LongStirStage({
  step,
  onDone,
  onRuin,
}: {
  step: StirBatchesStep;
  onDone: (s: StepSummary, b?: number) => void;
  onRuin: (s: StepSummary) => void;
}) {
  const burnResist = useGame((s) => s.burnResist());
  const ptr = useRef<PadPointer>({ x: 0, y: 0, down: false });
  const grid = useRef(createStir(SCORCH_N));
  const knob = useRef(0.55);
  const burner = useRef(createBurner(0.55));
  const [cueOpen, setCueOpen] = useState(false);
  const [remaining, setRemaining] = useState(step.batches.length);

  const sim = useRef({
    progress: 0,
    smoothQ: 0,
    stirT: 0,
    hits: 0,
    clock: 0,
    cueIdx: 0,
    cueEnd: 0,
    cueOpen: false,
    done: false,
  });

  const n = step.batches.length;

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    s.clock += dt;

    stepBurner(burner.current, knob.current, dt);
    const heat = burner.current.heat;
    const g = grid.current;
    const effHeat = heat * (1 - burnResist * 0.5);
    stepStir(g, ptr.current.down ? { x: ptr.current.x, y: ptr.current.y } : null, effHeat, dt);
    const stirring = isStirring(g);

    // cooking pace: real heat helps, but only a moving mass cooks evenly
    const cookRate = 0.25 + heat * 1.5;
    s.progress = clamp01(s.progress + (dt / step.durationSeconds) * cookRate * (stirring ? 1 : 0.12));
    if (stirring) {
      s.stirT += dt;
      s.smoothQ += coverageQuality(g) * dt;
    }

    // ghee cues at even fractions — the sheen dulls, the pot "asks"
    if (!s.cueOpen && s.cueIdx < n && s.progress >= (s.cueIdx + 1) / (n + 1)) {
      s.cueOpen = true;
      s.cueEnd = s.clock + 4.2;
      haptic("light");
      setCueOpen(true);
    }
    if (s.cueOpen && s.clock > s.cueEnd) {
      s.cueOpen = false;
      s.cueIdx += 1;
      setCueOpen(false); // missed its window
    }

    const burn = scorchTotal(g);

    // visuals: the pot is the interface
    writePaddle(ptr.current, stirring);
    cookViz.heat = heat;
    cookViz.progress = 0.2 + s.progress * 0.5;
    cookViz.burn = burn;
    cookViz.bubble = stirring ? 0.35 + heat * 0.4 : 0.1;
    cookViz.sheen = s.cueOpen ? 0.12 : 0.35 + s.progress * 0.4; // dull = asking for ghee
    cookViz.stick.set(g.stick);
    cookViz.scorch.set(g.scorch);
    cookViz.gheePool = Math.max(0, cookViz.gheePool - dt * 0.4);
    const w = worstSpot(g);
    if (w) {
      cookViz.smokeX = w.x;
      cookViz.smokeY = w.y;
      cookViz.smokeAmount = w.scorch;
    } else {
      cookViz.smokeAmount = 0;
    }

    const summary = (): StepSummary => ({
      kind: "stir-batches",
      smoothness: s.stirT > 0 ? s.smoothQ / s.stirT : 0,
      batchesHit: s.hits,
      burn,
    });

    if (burn >= 0.95) {
      s.done = true;
      cookViz.paddleActive = false;
      onRuin(summary());
      return true;
    }
    if (s.progress >= 1) {
      s.done = true;
      cookViz.paddleActive = false;
      onDone(summary(), burn * 0.5);
      return true;
    }
  });

  const dropGhee = () => {
    const s = sim.current;
    if (s.done) return;
    if (s.cueOpen) {
      s.cueOpen = false;
      s.cueIdx += 1;
      s.hits += 1;
      cookViz.sparkAt += 1;
      setCueOpen(false);
    }
    // dropped off-cue: the ghee still lands (pool shows it) but earns nothing
    cookViz.gheePool = 1;
    cookViz.streamRate = 0.4;
    cookViz.streamColor = "#f3c65a";
    setRemaining((r) => Math.max(0, r - 1));
  };

  return (
    <>
      <StirPad ptr={ptr} />
      <GasKnob knob={knob} />
      {remaining > 0 && (
        <div style={S.rack}>
          <DragAdd
            emoji="🧈"
            label={`Ghee · ${remaining} left`}
            color="#f3c65a"
            glowing={cueOpen}
            onDrop={dropGhee}
          />
        </div>
      )}
      <Hint
        text={
          cueOpen
            ? "The shine died — carry the ghee to the pot!"
            : "Work the whole pot — it darkens where you don't"
        }
        tone={cueOpen ? "warn" : undefined}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 6 — The perfume: carry each spice to the pot in its moment    */
/* ------------------------------------------------------------------ */

function SpiceStage({ step, onDone }: { step: TimedAddStep; onDone: (s: StepSummary, b?: number) => void }) {
  const ptr = useRef<PadPointer>({ x: 0, y: 0, down: false });
  const grid = useRef(createStir(SCORCH_N));
  const sim = useRef({ clock: 0, idx: 0, open: false, end: 0, hits: 0, idle: 0, done: false });
  const dropped = useRef<Set<string>>(new Set());
  const [cueKey, setCueKey] = useState<string | null>(null);
  const [, force] = useState(0);

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    s.clock += dt;
    stepStir(grid.current, ptr.current.down ? { x: ptr.current.x, y: ptr.current.y } : null, 0.25, dt);
    const moving = isStirring(grid.current);
    if (!moving) s.idle += dt;

    writePaddle(ptr.current, moving);
    cookViz.progress = 0.72;
    cookViz.bubble = moving ? 0.4 : 0.1;
    cookViz.streamRate = Math.max(0, cookViz.streamRate - dt * 1.4);

    // windows open one by one; dragging takes real time, so they're generous
    if (!s.open && s.idx < step.adds.length && s.clock >= 1 + s.idx * 3.4) {
      // skip windows for spices already thrown in early
      if (dropped.current.has(step.adds[s.idx].key)) {
        s.idx += 1;
      } else {
        s.open = true;
        s.end = s.clock + 3.2;
        haptic("light");
        setCueKey(step.adds[s.idx].key);
      }
    }
    if (s.open && s.clock > s.end) {
      s.open = false;
      s.idx += 1;
      setCueKey(null);
    }

    const allDropped = dropped.current.size >= step.adds.length;
    const windowsOver = s.idx >= step.adds.length && !s.open;
    if (allDropped || windowsOver) {
      s.done = true;
      cookViz.paddleActive = false;
      onDone({ kind: "timed-add", hits: s.hits }, Math.min(0.15, s.idle * 0.02));
      return true;
    }
  });

  const drop = (key: string) => {
    const s = sim.current;
    if (dropped.current.has(key)) return;
    dropped.current.add(key);
    cookViz.streamRate = 0.3;
    cookViz.streamColor = step.adds.find((a) => a.key === key)?.color ?? "#fff";
    if (s.open && step.adds[s.idx]?.key === key) {
      s.open = false;
      s.idx += 1;
      s.hits += 1;
      cookViz.sparkAt += 1;
      setCueKey(null);
    }
    force((x) => x + 1);
  };

  return (
    <>
      <StirPad ptr={ptr} />
      <div style={S.rack}>
        {step.adds
          .filter((a) => !dropped.current.has(a.key))
          .map((a) => (
            <DragAdd
              key={a.key}
              emoji={a.emoji}
              label={`${a.label} · ${a.amount}`}
              color={a.color}
              glowing={cueKey === a.key}
              onDrop={() => drop(a.key)}
            />
          ))}
      </div>
      <Hint
        text={
          cueKey
            ? `Now — carry the ${step.adds.find((a) => a.key === cueKey)?.label.toLowerCase()} over!`
            : "Keep it moving… each perfume has its moment"
        }
        tone={cueKey ? "warn" : undefined}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 7 — Calling it: read the pot, tap when it's ready             */
/* ------------------------------------------------------------------ */

function FinishStage({ step, onDone }: { step: FinishCallStep; onDone: (s: StepSummary) => void }) {
  const ptr = useRef<PadPointer>({ x: 0, y: 0, down: false });
  const grid = useRef(createStir(SCORCH_N));
  // from memory, nothing signals the window — you read the pot itself
  const memory = useGame((s) => s.cookMode) === "memory";
  const sim = useRef({ doneness: 0, done: false });
  const [readyRaw, setReady] = useState(false);
  const ready = readyRaw && !memory;

  useRaf((dt) => {
    const s = sim.current;
    if (s.done) return true;
    stepStir(grid.current, ptr.current.down ? { x: ptr.current.x, y: ptr.current.y } : null, 0.2, dt);
    const moving = isStirring(grid.current);
    s.doneness += dt * (moving ? 0.085 : 0.03);

    writePaddle(ptr.current, moving);
    cookViz.progress = 0.72 + clamp01(s.doneness) * 0.26;
    cookViz.sheen = 0.5 + clamp01(s.doneness) * 0.45;
    cookViz.bubble = moving ? 0.3 : 0.06;

    const inWindow = s.doneness >= step.idealWindow[0] && s.doneness <= step.idealWindow[1];
    setReady((p) => (p === inWindow ? p : inWindow));

    // waited far too long — the pot calls it for you, overcooked
    if (s.doneness >= 1.12) {
      s.done = true;
      cookViz.paddleActive = false;
      onDone({ kind: "finish-call", calledAt: s.doneness });
      return true;
    }
  });

  const call = () => {
    const s = sim.current;
    if (s.done) return;
    s.done = true;
    cookViz.paddleActive = false;
    haptic("success");
    onDone({ kind: "finish-call", calledAt: s.doneness });
  };

  return (
    <>
      <StirPad ptr={ptr} />
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

/** Push the finger's pot position into the 3D paddle. */
function writePaddle(p: PadPointer, active: boolean) {
  cookViz.paddleX = p.x;
  cookViz.paddleY = p.y;
  cookViz.paddleActive = p.down && active;
}

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
  mixBowlWrap: {
    position: "absolute",
    left: "50%",
    top: "56%",
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
  },
  mixBowl: {
    position: "relative",
    width: 190,
    height: 118,
    overflow: "hidden",
    borderRadius: "14px 14px 90px 90px",
    background: "linear-gradient(180deg, #efe9db, #ded1b8)",
    border: "3px solid rgba(255,246,230,0.9)",
    boxShadow: "inset 0 10px 22px rgba(0,0,0,0.18), 0 14px 30px rgba(0,0,0,0.4)",
  },
  mixBowlFoot: {
    width: 70,
    height: 9,
    margin: "0 auto",
    borderRadius: "0 0 12px 12px",
    background: "rgba(255,236,210,0.55)",
  },
  combineBowl: {
    position: "absolute",
    left: 22,
    bottom: "calc(env(safe-area-inset-bottom) + 96px)",
    width: 110,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    pointerEvents: "auto",
    touchAction: "none",
    cursor: "grab",
    transformOrigin: "80% 85%",
  },
  combineBowlInner: {
    position: "relative",
    width: 104,
    height: 76,
    overflow: "hidden",
    borderRadius: "10px 10px 52px 52px",
    background: "linear-gradient(180deg, rgba(255,246,230,0.25), rgba(255,246,230,0.12))",
    border: "2.5px solid rgba(255,236,210,0.8)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
  },
  combineBowlFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "74%",
    background: "#efe6d2",
  },
  combineBowlLabel: { fontSize: 10.5, fontWeight: 800, color: C.creamDim, textShadow: "0 1px 3px rgba(0,0,0,0.6)" },
  rack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "calc(env(safe-area-inset-bottom) + 88px)",
    display: "flex",
    justifyContent: "center",
    gap: 14,
    pointerEvents: "none",
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
};
