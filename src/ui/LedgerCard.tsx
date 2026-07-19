import { motion } from "framer-motion";
import { useGame } from "../state/game";
import { Button } from "./kit";
import { C, FONT, pop } from "./theme";

/**
 * The close-out books: what the day actually made. This card IS the tycoon —
 * revenue against ingredients, payroll and rent, read like a shopkeeper.
 */
export function LedgerCard() {
  const ledger = useGame((s) => s.ledgers[s.ledgers.length - 1]);
  const coins = useGame((s) => s.coins);
  const toIdle = useGame((s) => s.toIdle);
  if (!ledger) return null;

  const repDelta = ledger.repEnd - ledger.repStart;
  const shortfall = coins === 0 && ledger.net < 0;

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.card}>
        <div style={S.eyebrow}>CLOSE-OUT · دفتر الحساب</div>
        <div style={S.title}>Day {ledger.day}</div>

        <div style={S.rows}>
          <Row label="Revenue" value={ledger.revenue} plus />
          <Row label="Ingredients" value={-ledger.ingredientSpend} />
          <Row label="Wages" value={-ledger.wages} />
          <Row label="Rent" value={-ledger.rent} />
          <div style={S.divider} />
          <div style={S.netRow}>
            <span style={S.netLabel}>Net</span>
            <span style={{ ...S.netValue, color: ledger.net >= 0 ? C.good : C.bad }}>
              {ledger.net >= 0 ? "+" : ""}
              {ledger.net} 🪙
            </span>
          </div>
        </div>

        <div style={S.stats}>
          <span>🍽️ {ledger.served} served</span>
          <span style={{ color: ledger.lost > 0 ? C.bad : undefined }}>🚶 {ledger.lost} lost</span>
          <span style={{ color: repDelta >= 0 ? C.good : C.bad }}>
            {repDelta >= 0 ? "▲" : "▼"} {Math.abs(repDelta).toFixed(2)} rep
          </span>
        </div>

        {shortfall && (
          <div style={S.shortfall}>The till couldn't cover the full payroll — the souq talks.</div>
        )}

        <Button variant="gold" onClick={toIdle} style={{ width: "100%", marginTop: 16 }}>
          Prep for day {ledger.day + 1} →
        </Button>
      </motion.div>
    </div>
  );
}

function Row({ label, value, plus = false }: { label: string; value: number; plus?: boolean }) {
  return (
    <div style={S.row}>
      <span style={S.rowLabel}>{label}</span>
      <span style={{ ...S.rowValue, color: plus ? C.good : value < 0 ? C.creamDim : C.creamDim }}>
        {value > 0 && plus ? "+" : ""}
        {value} 🪙
      </span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    fontFamily: FONT,
    background: "radial-gradient(ellipse at 50% 40%, rgba(30,16,8,0.25), rgba(15,8,4,0.6))",
    pointerEvents: "auto",
    padding: 22,
  },
  card: {
    width: "min(88vw, 380px)",
    background: "linear-gradient(180deg, #f6e8cd, #efdbb8)",
    border: "1px solid #d9bd90",
    borderRadius: 28,
    padding: "26px 24px 22px",
    color: "#4a2c14",
    boxShadow: "0 26px 70px rgba(0,0,0,0.55), inset 0 0 60px rgba(180,130,70,0.15)",
    textAlign: "center",
  },
  eyebrow: { fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: "#a2703a" },
  title: { fontSize: 26, fontWeight: 900, marginTop: 4 },
  rows: { marginTop: 16, display: "flex", flexDirection: "column", gap: 7 },
  row: { display: "flex", justifyContent: "space-between", padding: "0 6px" },
  rowLabel: { fontSize: 14.5, fontWeight: 700, opacity: 0.85 },
  rowValue: { fontSize: 14.5, fontWeight: 800, color: "#6a4526" },
  divider: { height: 2, background: "rgba(162,112,58,0.35)", borderRadius: 2, margin: "4px 0" },
  netRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 6px" },
  netLabel: { fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.6 },
  netValue: { fontSize: 24, fontWeight: 900 },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
    fontSize: 13,
    fontWeight: 800,
    color: "#6a4526",
  },
  shortfall: {
    marginTop: 12,
    fontSize: 12.5,
    fontWeight: 800,
    color: "#b3402a",
    background: "rgba(179,64,42,0.12)",
    borderRadius: 12,
    padding: "8px 12px",
  },
};
