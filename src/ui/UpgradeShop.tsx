import { motion } from "framer-motion";
import { DISHES, DISH_ORDER } from "../data/dishes";
import { useGame, UPGRADE_COST } from "../state/game";
import { Button, Coin } from "./kit";
import { C, FONT, pop } from "./theme";

export function UpgradeShop() {
  const g = useGame();
  const nextLocked = DISH_ORDER.filter((id) => !g.unlocked[id]);

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.sheet}>
        <div style={S.head}>
          <div style={S.title}>Souq Upgrades</div>
          <div style={S.coins}><Coin value={g.coins} /></div>
        </div>

        <div style={S.section}>Equipment</div>
        <UpgradeRow
          icon="🍯"
          name="Copper Pot"
          desc="A thicker base — sticks and scorches slower."
          level={g.upgrades.pot}
          cost={UPGRADE_COST.pot[g.upgrades.pot]}
          coins={g.coins}
          onBuy={() => g.buyUpgrade("pot")}
        />
        <UpgradeRow
          icon="🔥"
          name="Brass Stove"
          desc="Finer heat — burns slower, more forgiving."
          level={g.upgrades.stove}
          cost={UPGRADE_COST.stove[g.upgrades.stove]}
          coins={g.coins}
          onBuy={() => g.buyUpgrade("stove")}
        />
        <UpgradeRow
          icon="🗄️"
          name="Pantry Shelves"
          desc="More storage for every ingredient (×2, ×3)."
          level={g.upgrades.shelf}
          cost={UPGRADE_COST.shelf[g.upgrades.shelf]}
          coins={g.coins}
          onBuy={() => g.buyUpgrade("shelf")}
        />

        {nextLocked.length > 0 && <div style={S.section}>New Recipes</div>}
        {nextLocked.map((id) => {
          const dish = DISHES[id];
          const idx = DISH_ORDER.indexOf(id);
          const prev = DISHES[DISH_ORDER[idx - 1]];
          const canStars = g.bestStars[prev.id] >= dish.unlockStars;
          const canAfford = g.coins >= dish.unlockCost;
          const can = g.canUnlock(id);
          return (
            <div key={id} style={S.unlockRow}>
              <div style={{ flex: 1 }}>
                <div style={S.uName}>{dish.name}</div>
                <div style={S.uReq}>
                  {canStars ? "✓" : "🔒"} Best {dish.unlockStars}★ on {prev.name}
                  <span style={{ margin: "0 6px" }}>·</span>
                  <span style={{ color: canAfford ? C.gold : C.bad }}>🪙 {dish.unlockCost}</span>
                </div>
              </div>
              <Button variant={can ? "gold" : "ghost"} disabled={!can} onClick={() => g.buyUnlock(id)} style={{ padding: "12px 18px", fontSize: 15 }}>
                Unlock
              </Button>
            </div>
          );
        })}

        <Button variant="primary" onClick={g.openSelect} style={{ width: "100%", marginTop: 18 }}>Back to cooking</Button>
      </motion.div>
    </div>
  );
}

function UpgradeRow({ icon, name, desc, level, cost, coins, onBuy }: {
  icon: string; name: string; desc: string; level: number; cost: number; coins: number; onBuy: () => void;
}) {
  const maxed = level >= 2;
  const afford = coins >= cost;
  return (
    <div style={S.row}>
      <div style={S.icon}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={S.rName}>
          {name}
          <span style={S.pips}>{[0, 1, 2].map((i) => (
            <span key={i} style={{ ...S.pip, background: i < level ? C.gold : "rgba(255,220,170,0.18)" }} />
          ))}</span>
        </div>
        <div style={S.rDesc}>{desc}</div>
      </div>
      {maxed ? (
        <div style={S.maxed}>MAX</div>
      ) : (
        <Button variant={afford ? "gold" : "ghost"} disabled={!afford} onClick={onBuy} style={{ padding: "12px 16px", fontSize: 14 }}>
          🪙 {cost}
        </Button>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, display: "grid", placeItems: "center", fontFamily: FONT, pointerEvents: "auto", padding: 18 },
  sheet: {
    width: "min(92vw, 420px)",
    maxHeight: "86vh",
    overflowY: "auto",
    background: "linear-gradient(180deg, rgba(48,26,14,0.95), rgba(28,15,7,0.96))",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,200,140,0.28)",
    borderRadius: 28,
    padding: 22,
    color: C.cream,
    boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
  },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 900 },
  coins: { fontSize: 17, fontWeight: 800, background: "rgba(20,10,4,0.5)", padding: "6px 14px", borderRadius: 999 },
  section: { fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.7, margin: "16px 2px 8px" },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 18, background: "rgba(255,240,220,0.05)", marginBottom: 8 },
  icon: { fontSize: 30, width: 46, height: 46, display: "grid", placeItems: "center", background: "rgba(20,10,4,0.4)", borderRadius: 14 },
  rName: { fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 },
  pips: { display: "inline-flex", gap: 4 },
  pip: { width: 8, height: 8, borderRadius: "50%" },
  rDesc: { fontSize: 12.5, opacity: 0.8, marginTop: 2, lineHeight: 1.3 },
  maxed: { fontSize: 13, fontWeight: 900, color: C.gold, padding: "10px 14px" },
  unlockRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 18, background: "rgba(255,240,220,0.05)", marginBottom: 8 },
  uName: { fontSize: 16, fontWeight: 800 },
  uReq: { fontSize: 12, opacity: 0.85, marginTop: 3 },
};
