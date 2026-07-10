import { motion } from "framer-motion";
import { DISHES } from "../data/dishes";
import { useGame } from "../state/game";
import { Button } from "./kit";
import { C, FONT, pop } from "./theme";

const CUSTOMERS = ["🧔🏽", "🧕🏽", "👳🏽", "👩🏽", "🧑🏽"];

export function SellCard() {
  const result = useGame((s) => s.result);
  const startPrep = useGame((s) => s.startPrep);
  const openShop = useGame((s) => s.openShop);
  const openSelect = useGame((s) => s.openSelect);
  if (!result) return null;
  const dish = DISHES[result.dish];
  const buyers = Math.min(3, 1 + Math.floor(result.stars / 2));

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.card}>
        <div style={S.sold}>Sold out!</div>
        <div style={S.row}>
          {Array.from({ length: buyers }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.18, ...pop }}
              style={S.customer}
            >
              <span style={{ fontSize: 44 }}>{CUSTOMERS[i % CUSTOMERS.length]}</span>
              <motion.span
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: -4, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.18 }}
                style={S.bubble}
              >
                {result.stars >= 4 ? "😍" : "😋"}
              </motion.span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, ...pop }}
          style={S.earn}
        >
          + 🪙 {result.price}
        </motion.div>
        <div style={S.sub}>{dish.name} · {result.stars}★</div>

        <div style={S.actions}>
          <Button variant="gold" onClick={startPrep} style={{ flex: 1 }}>Cook again</Button>
          <Button variant="ghost" onClick={openShop} style={{ flex: 1 }}>Upgrades</Button>
        </div>
        <button style={S.link} onClick={openSelect}>change dish</button>
      </motion.div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, display: "grid", placeItems: "center", fontFamily: FONT, pointerEvents: "auto", padding: 24 },
  card: {
    width: "min(88vw, 380px)",
    background: "linear-gradient(180deg, rgba(48,26,14,0.92), rgba(30,16,8,0.94))",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,200,140,0.28)",
    borderRadius: 30,
    padding: 26,
    textAlign: "center",
    color: C.cream,
    boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
  },
  sold: { fontSize: 22, fontWeight: 900, marginBottom: 14 },
  row: { display: "flex", justifyContent: "center", gap: 14, minHeight: 66 },
  customer: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  bubble: { position: "absolute", top: -14, right: -6, fontSize: 20 },
  earn: { fontSize: 34, fontWeight: 900, color: C.gold, marginTop: 12, filter: "drop-shadow(0 0 14px rgba(255,190,70,0.5))" },
  sub: { fontSize: 14, opacity: 0.85, marginBottom: 20 },
  actions: { display: "flex", gap: 12 },
  link: { marginTop: 14, background: "none", border: "none", color: C.creamDim, fontSize: 13, textDecoration: "underline", cursor: "pointer", pointerEvents: "auto", fontFamily: FONT },
};
