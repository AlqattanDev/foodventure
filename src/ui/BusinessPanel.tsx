import { motion } from "framer-motion";
import { useGame } from "../state/game";
import { MILESTONES, type BizSnapshot } from "../game/milestones";
import { Button, Stars } from "./kit";
import { C, FONT, pop } from "./theme";

/**
 * The books: last week's profit, all-time numbers, souq rating, and the
 * milestone ladder with claimable rewards.
 */
export function BusinessPanel() {
  const g = useGame();
  const week = g.ledgers.slice(-7);
  const maxAbs = Math.max(20, ...week.map((l) => Math.abs(l.net)));

  const snap: BizSnapshot = {
    opened: g.opened,
    lifetimeServed: g.lifetimeServed,
    bestDayNet: g.bestDayNet,
    servers: g.staff.servers,
    chefs: g.staff.chefs,
    floorTier: g.floorTier,
    reputation: g.reputation,
    mastery: g.mastery,
  };

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.sheet}>
        <div style={S.head}>
          <div>
            <div style={S.title}>The Books</div>
            <div style={S.sub}>دفاتر المحل · your business</div>
          </div>
          <div style={S.rating}>
            <Stars value={Math.round(g.reputation)} size={13} />
            <span style={S.ratingNum}>{g.reputation.toFixed(1)} souq rating</span>
          </div>
        </div>

        {/* the week in profit — signed bars around a zero line */}
        <div style={S.section}>Last {week.length || 0} days · net</div>
        {week.length === 0 ? (
          <div style={S.empty}>No days on the books yet — open the stall.</div>
        ) : (
          <div style={S.chart}>
            {week.map((l) => {
              const h = (Math.abs(l.net) / maxAbs) * 54;
              const up = l.net >= 0;
              return (
                <div key={l.day} style={S.col}>
                  <span style={{ ...S.colVal, color: up ? C.good : C.bad }}>
                    {up ? "+" : "−"}
                    {Math.abs(l.net)}
                  </span>
                  <div style={S.colPlot}>
                    <div
                      style={{
                        ...S.bar,
                        height: Math.max(3, h),
                        background: up ? C.good : C.bad,
                        alignSelf: "center",
                        marginTop: up ? 54 - Math.max(3, h) : 55,
                      }}
                    />
                  </div>
                  <span style={S.colDay}>D{l.day}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* all-time */}
        <div style={S.statRow}>
          <Stat label="days run" value={String(Math.max(0, g.day - 1))} />
          <Stat label="plates served" value={String(g.lifetimeServed)} />
          <Stat label="best day" value={`${g.bestDayNet >= 0 ? "+" : ""}${g.bestDayNet}`} />
        </div>

        {/* the ladder */}
        <div style={S.section}>Milestones</div>
        {MILESTONES.map((m) => {
          const done = m.achieved(snap);
          const claimed = g.claimed.includes(m.id);
          return (
            <div key={m.id} style={{ ...S.mRow, opacity: done || claimed ? 1 : 0.55 }}>
              <div style={S.mIcon}>{m.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.mTitle}>{m.title}</div>
                <div style={S.mDetail}>{m.detail}</div>
              </div>
              {claimed ? (
                <span style={S.claimed}>✓</span>
              ) : done ? (
                <Button
                  variant="gold"
                  onClick={() => g.claimMilestone(m.id, m.reward)}
                  style={{ padding: "10px 14px", fontSize: 13 }}
                >
                  Claim 🪙{m.reward}
                </Button>
              ) : (
                <span style={S.reward}>🪙 {m.reward}</span>
              )}
            </div>
          );
        })}

        <Button variant="primary" onClick={g.toIdle} style={{ width: "100%", marginTop: 14 }}>
          Back to the stall
        </Button>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.stat}>
      <div style={S.statValue}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, display: "grid", placeItems: "center", fontFamily: FONT, pointerEvents: "auto", padding: 18 },
  sheet: {
    width: "min(92vw, 430px)",
    maxHeight: "88vh",
    overflowY: "auto",
    background: "linear-gradient(180deg, rgba(48,26,14,0.95), rgba(28,15,7,0.96))",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,200,140,0.28)",
    borderRadius: 28,
    padding: 22,
    color: C.cream,
    boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
  },
  head: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: 900 },
  sub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  rating: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 },
  ratingNum: { fontSize: 11, fontWeight: 800, opacity: 0.8 },
  section: { fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", opacity: 0.7, margin: "16px 2px 8px" },
  empty: { fontSize: 13, opacity: 0.7, padding: "10px 4px" },
  chart: {
    display: "flex",
    gap: 6,
    alignItems: "stretch",
    background: "rgba(20,10,4,0.4)",
    borderRadius: 16,
    padding: "10px 10px 6px",
  },
  col: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 0 },
  colVal: { fontSize: 10, fontWeight: 900, fontVariantNumeric: "tabular-nums" },
  colPlot: {
    position: "relative",
    width: "100%",
    height: 110,
    display: "flex",
    justifyContent: "center",
    // the zero line
    backgroundImage: "linear-gradient(rgba(255,220,170,0.35), rgba(255,220,170,0.35))",
    backgroundSize: "100% 1.5px",
    backgroundPosition: "0 55px",
    backgroundRepeat: "no-repeat",
  },
  bar: { width: "62%", maxWidth: 22, borderRadius: 4 },
  colDay: { fontSize: 10, fontWeight: 800, opacity: 0.65 },
  statRow: { display: "flex", gap: 8, marginTop: 12 },
  stat: {
    flex: 1,
    background: "rgba(255,240,220,0.05)",
    borderRadius: 16,
    padding: "10px 6px",
    textAlign: "center",
  },
  statValue: { fontSize: 18, fontWeight: 900, color: C.gold },
  statLabel: { fontSize: 10.5, fontWeight: 800, opacity: 0.7, marginTop: 2 },
  mRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 18,
    background: "rgba(255,240,220,0.05)",
    marginBottom: 7,
  },
  mIcon: { fontSize: 22, width: 38, height: 38, display: "grid", placeItems: "center", background: "rgba(20,10,4,0.4)", borderRadius: 12, flexShrink: 0 },
  mTitle: { fontSize: 14.5, fontWeight: 800 },
  mDetail: { fontSize: 11.5, opacity: 0.75, marginTop: 2 },
  claimed: { fontSize: 18, fontWeight: 900, color: C.good, padding: "0 10px" },
  reward: { fontSize: 12.5, fontWeight: 800, opacity: 0.6, whiteSpace: "nowrap" },
};
