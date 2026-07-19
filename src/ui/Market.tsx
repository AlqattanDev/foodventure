import { motion } from "framer-motion";
import { useGame } from "../state/game";
import {
  INGREDIENTS,
  INGREDIENT_ORDER,
  capacityFor,
  priceOf,
  unitPrice,
  BULK_QTY,
  type IngredientId,
} from "../game/pantry";
import { Button, Coin } from "./kit";
import { C, FONT, pop } from "./theme";

const STALLS: { key: string; title: string; arabic: string; emoji: string }[] = [
  { key: "grain", title: "Grain stall", arabic: "الحبوب", emoji: "🌾" },
  { key: "dairy", title: "Dairy stall", arabic: "الألبان", emoji: "🧈" },
  { key: "spice", title: "Spice souq", arabic: "العطارة", emoji: "🌶️" },
  { key: "nuts", title: "Nut roaster", arabic: "المكسرات", emoji: "🥜" },
];

/**
 * The souq market: walk the stalls, fill the pantry. Prices are honest,
 * shelf space is finite, and what you don't stock you cannot cook.
 */
export function Market() {
  const g = useGame();
  const shelf = g.upgrades.shelf;

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.sheet}>
        <div style={S.head}>
          <div>
            <div style={S.title}>Souq Market</div>
            <div style={S.sub}>سوق المنامة · stock the pantry</div>
          </div>
          <div style={S.coins}><Coin value={g.coins} /></div>
        </div>

        {STALLS.map((stall) => {
          const items = INGREDIENT_ORDER.filter((id) => INGREDIENTS[id].stall === stall.key);
          if (!items.length) return null;
          return (
            <div key={stall.key}>
              <div style={S.section}>
                {stall.emoji} {stall.title} <span style={S.sectionAr}>{stall.arabic}</span>
              </div>
              {items.map((id) => (
                <MarketRow key={id} id={id} shelf={shelf} />
              ))}
            </div>
          );
        })}

        <Button variant="primary" onClick={g.openSelect} style={{ width: "100%", marginTop: 16 }}>
          Back to the stall
        </Button>
      </motion.div>
    </div>
  );
}

function MarketRow({ id, shelf }: { id: IngredientId; shelf: number }) {
  const item = INGREDIENTS[id];
  const stock = useGame((s) => s.stock[id]);
  const coins = useGame((s) => s.coins);
  const day = useGame((s) => s.day);
  const buy = useGame((s) => s.buyIngredient);
  const cap = capacityFor(id, shelf);
  const full = stock >= cap;
  const today = unitPrice(id, day);
  const trend = today > item.price ? "▲" : today < item.price ? "▼" : "";
  const canOne = !full && coins >= priceOf(id, 1, day);
  const bulkOk = !full && cap - stock >= BULK_QTY && coins >= priceOf(id, BULK_QTY, day);

  return (
    <div style={S.row}>
      <div style={S.icon}>{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rName}>
          {item.label} <span style={S.rAr}>{item.arabic}</span>
          {trend && (
            <span style={{ ...S.trend, color: trend === "▲" ? C.bad : C.good }}>
              {trend} today
            </span>
          )}
        </div>
        <div style={S.shelfRow}>
          <div style={S.shelfTrack}>
            <div style={{ ...S.shelfFill, width: `${(stock / cap) * 100}%` }} />
          </div>
          <span style={{ ...S.shelfCount, color: stock === 0 ? C.bad : C.creamDim }}>
            {stock}/{cap}
          </span>
        </div>
      </div>
      {full ? (
        <div style={S.full}>FULL</div>
      ) : (
        <div style={S.buys}>
          <button
            style={{ ...S.buyBtn, opacity: canOne ? 1 : 0.4 }}
            disabled={!canOne}
            onClick={() => buy(id, 1)}
          >
            +1 · 🪙{priceOf(id, 1, day)}
          </button>
          <button
            style={{ ...S.buyBtnGhost, opacity: bulkOk ? 1 : 0.4 }}
            disabled={!bulkOk}
            onClick={() => buy(id, BULK_QTY)}
          >
            +{BULK_QTY} · 🪙{priceOf(id, BULK_QTY, day)}
          </button>
        </div>
      )}
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
  head: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 900 },
  sub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  coins: { fontSize: 17, fontWeight: 800, background: "rgba(20,10,4,0.5)", padding: "6px 14px", borderRadius: 999 },
  section: { fontSize: 12.5, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.85, margin: "16px 2px 8px" },
  sectionAr: { fontWeight: 700, opacity: 0.6, textTransform: "none", marginLeft: 4 },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 18, background: "rgba(255,240,220,0.05)", marginBottom: 7 },
  icon: { fontSize: 26, width: 42, height: 42, display: "grid", placeItems: "center", background: "rgba(20,10,4,0.4)", borderRadius: 13, flexShrink: 0 },
  rName: { fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rAr: { fontSize: 12, fontWeight: 600, opacity: 0.6, marginLeft: 3 },
  trend: { fontSize: 10, fontWeight: 900, marginLeft: 6 },
  shelfRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 5 },
  shelfTrack: { flex: 1, height: 7, borderRadius: 4, background: "rgba(20,10,4,0.55)", overflow: "hidden", maxWidth: 110 },
  shelfFill: { height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})`, transition: "width 0.25s" },
  shelfCount: { fontSize: 11.5, fontWeight: 800 },
  buys: { display: "flex", flexDirection: "column", gap: 5, alignItems: "stretch" },
  buyBtn: {
    border: "none",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 12.5,
    fontWeight: 900,
    fontFamily: FONT,
    background: `linear-gradient(180deg, ${C.gold}, ${C.amber})`,
    color: C.ink,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  buyBtnGhost: {
    border: "1px solid rgba(255,200,140,0.3)",
    borderRadius: 12,
    padding: "6px 12px",
    fontSize: 11.5,
    fontWeight: 800,
    fontFamily: FONT,
    background: "rgba(255,240,220,0.07)",
    color: C.cream,
    cursor: "pointer",
  },
  full: { fontSize: 12, fontWeight: 900, color: C.good, padding: "8px 10px" },
};
