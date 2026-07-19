import { motion } from "framer-motion";
import { RECIPES } from "../data/recipes";
import { CONSUMPTION } from "../data/ingredients";
import { useGame } from "../state/game";
import { Button } from "./kit";
import { FONT, pop } from "./theme";

/**
 * The cookbook page — read the real recipe before the pot goes on.
 * Educational by design: real ingredients with amounts, the actual process,
 * a tip per step. (Mastery mode later closes this at pot-on; for now it's
 * always available pre-cook.)
 */
export function RecipeBook() {
  const selected = useGame((s) => s.selected);
  const startCook = useGame((s) => s.startCook);
  const openSelect = useGame((s) => s.openSelect);
  const cookMode = useGame((s) => s.cookMode);
  const setCookMode = useGame((s) => s.setCookMode);
  const memoryOk = useGame((s) => s.memoryAvailable(selected));
  const mastery = useGame((s) => s.mastery[selected]);
  const recipe = RECIPES[selected];
  const dish = recipe.dish;
  const memory = cookMode === "memory";
  const stock = useGame((s) => s.stock);
  const canCookNow = useGame((s) => s.canCookSelected());
  const openMarket = useGame((s) => s.openMarket);
  const need = CONSUMPTION[selected];

  return (
    <div style={S.backdrop}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={pop} style={S.book}>
        {/* page header */}
        <div style={S.header}>
          <div style={S.eyebrow}>Grandma's cookbook · دفتر الوصفات</div>
          <div style={S.title}>
            {dish.name} <span style={S.arabic}>{dish.arabic}</span>
          </div>
          <div style={S.intro}>{recipe.intro}</div>
        </div>

        {/* ingredients */}
        <div style={S.sectionLabel}>Ingredients</div>
        <div style={S.ingredients}>
          {recipe.ingredients.map((ing) => {
            const needed = ing.id ? need[ing.id] ?? 0 : 0;
            const have = ing.id ? stock[ing.id] ?? 0 : 0;
            const short = !!ing.id && have < needed;
            return (
              <div key={ing.label} style={S.ingRow}>
                <span style={{ fontSize: 18 }}>{ing.emoji}</span>
                <span style={S.ingName}>
                  {ing.label} <span style={S.ingArabic}>{ing.arabic}</span>
                </span>
                {ing.id && (
                  <span style={{ ...S.pantryChip, color: short ? "#b3402a" : "#5f7d3a" }}>
                    {short ? `need ${needed}, have ${have}` : `✓ in pantry`}
                  </span>
                )}
                <span style={S.ingAmount}>{ing.amount}</span>
              </div>
            );
          })}
        </div>

        {/* method */}
        <div style={S.sectionLabel}>The method</div>
        <div style={S.steps}>
          {recipe.steps.map((step, i) => (
            <div key={step.id} style={S.stepRow}>
              <div style={S.stepNum}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={S.stepTitle}>{step.title}</div>
                <div style={S.stepEdu}>{step.edu}</div>
                {step.tip && <div style={S.stepTip}>✎ {step.tip}</div>}
              </div>
            </div>
          ))}
        </div>

        <div style={S.footer}>
          {mastery.mastered && <div style={S.masteredBadge}>🏅 Mastered — cooked from memory</div>}
          {memoryOk && !mastery.mastered && (
            <div style={S.modeRow}>
              {(["guided", "memory"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCookMode(m)}
                  style={{
                    ...S.modeBtn,
                    background: cookMode === m ? "#c99a52" : "rgba(201,154,82,0.16)",
                    color: cookMode === m ? "#fff8ec" : "#6a4526",
                  }}
                >
                  {m === "guided" ? "📖 Guided" : "🧠 From memory"}
                </button>
              ))}
            </div>
          )}
          {memory && (
            <div style={S.memoryNote}>
              The book closes when the pot goes on. {mastery.memoryGood}/2 memory runs at 4★+ to master it.
            </div>
          )}
          {canCookNow ? (
            <Button variant="gold" onClick={startCook} style={{ width: "100%" }}>
              {memory ? "I know it — pot on 🧠" : "Put the pot on 🔥"}
            </Button>
          ) : (
            <Button variant="gold" onClick={openMarket} style={{ width: "100%" }}>
              Shelf is short — to the souq 🧺
            </Button>
          )}
          <button style={S.link} onClick={openSelect}>
            back to the menu
          </button>
        </div>
      </motion.div>
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
    padding: 16,
  },
  book: {
    width: "min(94vw, 460px)",
    maxHeight: "90vh",
    overflowY: "auto",
    // warm paper, not the usual dark glass — this is a *book*
    background: "linear-gradient(180deg, #f6e8cd, #efdbb8)",
    border: "1px solid #d9bd90",
    borderRadius: 26,
    padding: "24px 22px 18px",
    color: "#4a2c14",
    boxShadow: "0 26px 70px rgba(0,0,0,0.55), inset 0 0 60px rgba(180,130,70,0.15)",
  },
  header: { textAlign: "center", marginBottom: 14 },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#a2703a",
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: 900 },
  arabic: { fontSize: 18, fontWeight: 700, opacity: 0.75, marginLeft: 6 },
  intro: { fontSize: 13.5, lineHeight: 1.45, opacity: 0.85, marginTop: 8, fontStyle: "italic" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#a2703a",
    borderBottom: "2px solid rgba(162,112,58,0.3)",
    paddingBottom: 4,
    margin: "14px 2px 8px",
  },
  ingredients: { display: "flex", flexDirection: "column", gap: 4 },
  ingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "5px 6px",
    borderBottom: "1px dashed rgba(162,112,58,0.25)",
  },
  ingName: { flex: 1, fontSize: 14.5, fontWeight: 700 },
  ingArabic: { fontSize: 12.5, fontWeight: 600, opacity: 0.65, marginLeft: 4 },
  ingAmount: { fontSize: 13.5, fontWeight: 800, color: "#8a5a22" },
  pantryChip: { fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap" },
  steps: { display: "flex", flexDirection: "column", gap: 12 },
  stepRow: { display: "flex", gap: 12, alignItems: "flex-start" },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#c99a52",
    color: "#fff8ec",
    fontSize: 14,
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    marginTop: 2,
    boxShadow: "0 2px 6px rgba(120,80,30,0.4)",
  },
  stepTitle: { fontSize: 15.5, fontWeight: 900 },
  stepEdu: { fontSize: 13, lineHeight: 1.45, opacity: 0.88, marginTop: 3 },
  stepTip: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#8a5a22",
    marginTop: 5,
    padding: "4px 10px",
    background: "rgba(201,154,82,0.16)",
    borderRadius: 10,
    display: "inline-block",
  },
  footer: { marginTop: 18, textAlign: "center" },
  masteredBadge: {
    fontSize: 14,
    fontWeight: 900,
    color: "#8a5a22",
    background: "rgba(201,154,82,0.2)",
    borderRadius: 12,
    padding: "8px 14px",
    marginBottom: 10,
  },
  modeRow: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 10 },
  modeBtn: {
    border: "1px solid rgba(162,112,58,0.4)",
    borderRadius: 999,
    padding: "9px 18px",
    fontSize: 13.5,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT,
    transition: "background 0.15s",
  },
  memoryNote: { fontSize: 12.5, opacity: 0.8, marginBottom: 10, fontStyle: "italic" },
  link: {
    display: "block",
    margin: "10px auto 0",
    background: "none",
    border: "none",
    color: "#8a5a22",
    fontSize: 13,
    textDecoration: "underline",
    cursor: "pointer",
    fontFamily: FONT,
  },
};
