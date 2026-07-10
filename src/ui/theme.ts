/** One cohesive warm Khaliji palette + shared UI tokens. */
export const C = {
  cream: "#fff3e2",
  creamDim: "#e9d4b6",
  gold: "#ffc24d",
  amber: "#f0822d",
  terracotta: "#b5561f",
  saffron: "#e8a33d",
  teal: "#3fb0a4",
  rose: "#e79ab0",
  bg: "#20110b",
  ink: "#3a1c08",
  glass: "rgba(38,20,10,0.62)",
  glassBorder: "rgba(255,200,140,0.22)",
  good: "#8fd06a",
  bad: "#e8624a",
};

export const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', sans-serif";

export const glass: React.CSSProperties = {
  background: C.glass,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: `1px solid ${C.glassBorder}`,
  borderRadius: 26,
  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
};

export const bounce = { type: "spring", stiffness: 380, damping: 24 } as const;
export const pop = { type: "spring", stiffness: 520, damping: 18 } as const;
