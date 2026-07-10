import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { C, FONT, glass, pop } from "./theme";
import { haptic } from "../game/haptics";

/** Big juicy primary/secondary button with squash on press. */
export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "gold";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const bg =
    variant === "primary"
      ? "linear-gradient(180deg,#ffb14d,#f0822d)"
      : variant === "gold"
      ? "linear-gradient(180deg,#ffd876,#eaa72f)"
      : "rgba(255,240,220,0.10)";
  const color = variant === "ghost" ? C.cream : C.ink;
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.93 }}
      transition={pop}
      onClick={() => {
        if (disabled) return;
        haptic("medium");
        onClick?.();
      }}
      style={{
        pointerEvents: "auto",
        fontFamily: FONT,
        background: bg,
        color,
        border: variant === "ghost" ? `1px solid ${C.glassBorder}` : "none",
        padding: "15px 30px",
        borderRadius: 999,
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: 0.3,
        opacity: disabled ? 0.4 : 1,
        boxShadow:
          variant === "ghost"
            ? "none"
            : "0 10px 26px rgba(255,140,40,0.4), 0 2px 0 rgba(150,80,20,0.6) inset",
        cursor: disabled ? "default" : "pointer",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ scale: 0.86, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      style={{
        ...glass,
        pointerEvents: "auto",
        padding: 22,
        fontFamily: FONT,
        color: C.cream,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Animated 1..5 star row with a pop-in flourish. */
export function Stars({
  value,
  size = 22,
  animate = false,
}: {
  value: number;
  size?: number;
  animate?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: size * 0.14 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        return (
          <motion.span
            key={n}
            initial={animate ? { scale: 0, rotate: -40 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: animate ? 0.15 * n : 0, ...pop }}
            style={{
              fontSize: size,
              lineHeight: 1,
              color: on ? C.gold : "rgba(255,220,170,0.22)",
              filter: on ? "drop-shadow(0 0 10px rgba(255,180,60,0.7))" : "none",
            }}
          >
            ★
          </motion.span>
        );
      })}
    </div>
  );
}

export function Coin({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ filter: "drop-shadow(0 0 6px rgba(255,190,70,0.6))" }}>🪙</span>
      <b>{value}</b>
    </span>
  );
}
