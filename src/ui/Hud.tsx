/**
 * Placeholder HUD so the diorama already reads as a game.
 * Real cooking UI (prep / stir / star flourish) comes in milestone 2-3.
 */
export function Hud() {
  return (
    <div style={styles.wrap}>
      {/* top bar */}
      <div style={styles.topbar}>
        <div style={styles.coins}>🪙 120</div>
        <div style={styles.title}>Halwa Bahrainiya</div>
        <div style={styles.stars}>★★★☆☆</div>
      </div>

      {/* bottom cook button */}
      <div style={styles.bottom}>
        <button style={styles.cookBtn}>Start Cooking</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    padding: "calc(env(safe-area-inset-top) + 14px) 16px 32px",
    color: "#fff3e2",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  coins: {
    background: "rgba(40,20,10,0.55)",
    backdropFilter: "blur(8px)",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 16,
    border: "1px solid rgba(255,200,140,0.25)",
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 0.3,
    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
    opacity: 0.95,
  },
  stars: {
    fontSize: 18,
    color: "#ffc24d",
    textShadow: "0 0 12px rgba(255,180,60,0.6)",
  },
  bottom: {
    display: "flex",
    justifyContent: "center",
  },
  cookBtn: {
    pointerEvents: "auto",
    background: "linear-gradient(180deg,#ffb14d,#f0822d)",
    color: "#3a1c08",
    border: "none",
    padding: "16px 40px",
    borderRadius: 999,
    fontSize: 19,
    fontWeight: 800,
    letterSpacing: 0.4,
    boxShadow: "0 10px 26px rgba(255,140,40,0.45), 0 2px 0 #c9691f inset",
    cursor: "pointer",
  },
};
