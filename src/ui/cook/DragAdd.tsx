import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { haptic } from "../../game/haptics";
import { grab } from "./shared";
import { C, FONT } from "../theme";

/** Is a viewport point over the pot? (matches the StirPad's default circle) */
export function overPot(clientX: number, clientY: number): boolean {
  const r = Math.min(window.innerWidth * 0.78, 380) / 2;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.47;
  return Math.hypot(clientX - cx, clientY - cy) <= r * 1.15;
}

/**
 * A pinch of something you physically carry to the pot: grab the chip, drag
 * it over the pot, let go. Dropped anywhere else it springs back.
 */
export function DragAdd({
  emoji,
  label,
  color,
  glowing = false,
  onDrop,
}: {
  emoji: string;
  label: string;
  color: string;
  /** the pot is asking for this right now (its timing window is open) */
  glowing?: boolean;
  onDrop: () => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const [returning, setReturning] = useState(0);

  const setOffset = (dx: number, dy: number) => {
    if (el.current) el.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
  };

  return (
    <motion.div
      key={returning /* remount to spring back cleanly */}
      initial={returning ? { scale: 1.15, opacity: 0.6 } : false}
      animate={{ scale: 1, opacity: 1 }}
      style={{ position: "relative", pointerEvents: "auto" }}
    >
      <div
        ref={el}
        style={{
          ...S.chip,
          borderColor: glowing ? color : "rgba(255,200,140,0.25)",
          boxShadow: glowing ? `0 0 34px ${color}` : "0 8px 20px rgba(0,0,0,0.4)",
        }}
        onPointerDown={(e) => {
          grab(e);
          start.current = { x: e.clientX, y: e.clientY };
          haptic("tick");
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          setOffset(e.clientX - start.current.x, e.clientY - start.current.y);
        }}
        onPointerUp={(e) => {
          if (!start.current) return;
          start.current = null;
          setOffset(0, 0);
          if (overPot(e.clientX, e.clientY)) {
            haptic("success");
            onDrop();
          } else {
            haptic("tick");
            setReturning((n) => n + 1);
          }
        }}
        onPointerCancel={() => {
          start.current = null;
          setOffset(0, 0);
          setReturning((n) => n + 1);
        }}
      >
        <motion.span
          animate={glowing ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={glowing ? { repeat: Infinity, duration: 0.7 } : {}}
          style={{ fontSize: 34, lineHeight: 1 }}
        >
          {emoji}
        </motion.span>
        <span style={S.label}>{label}</span>
      </div>
    </motion.div>
  );
}

const S: Record<string, React.CSSProperties> = {
  chip: {
    width: 84,
    padding: "12px 6px 9px",
    borderRadius: 22,
    background: "rgba(34,18,9,0.9)",
    border: "2px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    touchAction: "none",
    cursor: "grab",
    color: C.cream,
    fontFamily: FONT,
    transition: "box-shadow 0.25s, border-color 0.25s",
  },
  label: { fontSize: 10.5, fontWeight: 800, textAlign: "center" },
};
