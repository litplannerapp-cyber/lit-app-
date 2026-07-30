import { useState } from "react";
import { T } from "../theme";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { MintBar } from "../components/MintBar";
import { InlineAdd } from "../components/InlineAdd";
import { MilestoneRow } from "./MilestoneRow";
import { keyToDate } from "../utils/date";
import { goalPct } from "../utils/task";
import { useMediaQuery } from "../hooks/useMediaQuery";

export function GoalsScreen({ goals, onToggleMilestone, onAddMilestone, onEditMilestone, onCreateGoal, setEditor }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [msDraft, setMsDraft] = useState("");

  const createGoal = () => {
    if (!title.trim()) return;
    onCreateGoal({ title: title.trim(), targetDate: date, milestones: msDraft.split("\n").map((s) => s.trim()).filter(Boolean) });
    setTitle(""); setDate(""); setMsDraft(""); setAdding(false);
  };

  return (
    <div style={{ padding: isDesktop ? "26px 22px 0" : "84px 22px 0" }} className="rise">
      <Eyebrow>Big things, broken into steps</Eyebrow>
      <h1 className="fr" style={{ fontSize: 34, fontWeight: 500, margin: "6px 0 20px" }}>Goals</h1>

      {goals.map((g) => {
        const pct = goalPct(g);
        const nextIx = g.milestones.findIndex((m) => !m.done);
        return (
          <Card key={g.id} style={{ padding: 20, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 700 }}>{g.title}</div>
                {g.targetDate && <div style={{ fontSize: 12, color: T.ink3, marginTop: 3 }}>by {keyToDate(g.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>}
              </div>
              <div className="fr tnum" style={{ fontSize: 30, fontWeight: 600, color: T.mint }}>{pct}%</div>
            </div>
            <div style={{ margin: "14px 0 16px" }}><MintBar pct={pct} /></div>
            {g.milestones.map((m, ix) => (
              <MilestoneRow key={m.id} m={m} isNext={ix === nextIx}
                onToggle={() => onToggleMilestone(g.id, m.id)}
                onEdit={(text) => onEditMilestone(g.id, m.id, text)}
                onTurnIntoTask={() => setEditor({ initial: { text: m.text } })} />
            ))}
            <InlineAdd placeholder="Add a milestone" onAdd={(v) => onAddMilestone(g.id, v)} />
          </Card>
        );
      })}

      {goals.length === 0 && !adding && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 0 28px", opacity: 0.8 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.mint} strokeWidth="1.6" style={{ marginBottom: 14 }}>
            <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={T.mint} />
          </svg>
          <p className="fr" style={{ fontStyle: "italic", fontSize: 15, color: T.ink2, margin: 0, textAlign: "center" }}>Nothing here yet. What's one big thing you're moving toward?</p>
        </div>
      )}

      {adding ? (
        <Card style={{ padding: 20 }}>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" enterKeyHint="next"
            style={{ width: "100%", border: "none", outline: "none", fontSize: 15.5, fontWeight: 600, background: "transparent", marginBottom: 10 }} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "none", outline: "none", background: T.bg, fontSize: 13.5, marginBottom: 10, WebkitAppearance: "none", appearance: "none" }} />
          <textarea value={msDraft} onChange={(e) => setMsDraft(e.target.value)} rows={3} placeholder={"Milestones, one per line"}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "none", outline: "none", resize: "none", background: T.bg, fontSize: 13.5, lineHeight: 1.6 }} />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={createGoal} style={{ flex: 1, padding: "13px 0", borderRadius: 14, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Create goal</button>
            <button onClick={() => setAdding(false)} style={{ padding: "0 16px", fontSize: 13.5, color: T.ink2, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button data-coach="goals" onClick={() => setAdding(true)} className="pressable" style={{ width: "100%", padding: "16px 0", borderRadius: 18, border: `1.6px dashed ${T.ink3}`, color: T.ink2, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + New goal
        </button>
      )}
    </div>
  );
}
