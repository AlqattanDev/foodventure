import { useRef } from "react";
import { grab } from "./shared";
import { C, FONT } from "../theme";

/**
 * The gas control: a brass slider on the stove's side. Drag the flame up and
 * down — no heat gauge anywhere; you read the pot's rim bubbles instead.
 * Writes into a mutable ref the stage's sim reads each frame.
 */
export function GasKnob({ knob }: { knob: React.MutableRefObject<number> }) {
  const track = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFrom = (clientY: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height));
    knob.current = v;
    if (dot.current) dot.current.style.bottom = `calc(${v * 100}% - 21px)`;
    if (flame.current) {
      flame.current.style.transform = `scale(${0.55 + v * 0.85})`;
      flame.current.style.filter = `saturate(${0.7 + v}) brightness(${0.8 + v * 0.5})`;
    }
  };

  return (
    <div style={S.wrap}>
      <div ref={flame} style={S.flame}>🔥</div>
      <div
        ref={track}
        style={S.track}
        onPointerDown={(e) => {
          grab(e);
          dragging.current = true;
          setFrom(e.clientY);
        }}
        onPointerMove={(e) => dragging.current && setFrom(e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div style={S.groove} />
        <div ref={dot} style={{ ...S.knob, bottom: `calc(${knob.current * 100}% - 21px)` }}>
          <div style={S.knobRidge} />
        </div>
      </div>
      <span style={S.label}>GAS</span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    pointerEvents: "auto",
    fontFamily: FONT,
  },
  flame: {
    fontSize: 26,
    transition: "transform 0.1s linear, filter 0.1s linear",
    transformOrigin: "50% 90%",
  },
  track: {
    position: "relative",
    width: 46,
    height: 190,
    borderRadius: 23,
    background: "linear-gradient(180deg, rgba(46,26,14,0.9), rgba(30,16,8,0.9))",
    border: `1.5px solid ${C.glassBorder}`,
    boxShadow: "inset 0 4px 10px rgba(0,0,0,0.5), 0 10px 24px rgba(0,0,0,0.35)",
    touchAction: "none",
    cursor: "grab",
  },
  groove: {
    position: "absolute",
    left: "50%",
    top: 12,
    bottom: 12,
    width: 4,
    transform: "translateX(-50%)",
    borderRadius: 2,
    background: "rgba(0,0,0,0.55)",
  },
  knob: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 30%, #f4c877, #b97a2e 70%)",
    border: "1.5px solid rgba(255,230,180,0.6)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    transition: "bottom 0.05s linear",
  },
  knobRidge: {
    width: 4,
    height: 18,
    borderRadius: 2,
    background: "rgba(58,28,8,0.55)",
  },
  label: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.5,
    color: C.creamDim,
    opacity: 0.7,
  },
};
