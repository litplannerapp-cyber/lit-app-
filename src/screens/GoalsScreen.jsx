import { useState } from "react";
import { T } from "../theme";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { MintBar } from "../components/MintBar";
import { InlineAdd } from "../components/InlineAdd";
import { keyToDate } from "../utils/date";
import { goalPct } from "../utils/task";

export function GoalsScreen({ goals, onToggleMilestone, onAddMilestone, onCreateGoal }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [msDraft, setMsDraft] = useState("");

  const createGoal = () => {
    if (!title.trim()) return;
    onCreateGoal({ title: title.trim(), targetDate: date, milestones: msDraft.split("\n").map((s) => s.trim()).filter(Boolean) });
    setTitle(""); setDate(""); setMsDraft(""); setAdding(false);
  };

  return (
    <div style={{ padding: "26px 22px 0" }} className="rise">
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
            {g.milestones.map((m, ix) => {
              const isNext = ix === nextIx;
              return (
                <button key={m.id} onClick={() => onToggleMilestone(g.id, m.id)}
                  style={{ display: "flex", width: "100%", alignItems: "center", gap: 11, padding: "9px 2px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, border: m.done ? "none" : `1.6px solid ${isNext ? T.mint : T.ink3}`, background: m.done ? T.mint : "transparent", display: "grid", placeItems: "center", transition: "all .25s" }}>
                    {m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
                  </span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: isNext ? 650 : 480, color: m.done ? T.ink3 : T.ink, textDecoration: m.done ? "line-through" : "none" }}>{m.text}</span>
                  {isNext && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: T.mint, background: T.mintSoft, padding: "3px 8px", borderRadius: 100 }}>NEXT</span>}
                </button>
              );
            })}
            <InlineAdd placeholder="Add a milestone" onAdd={(v) => onAddMilestone(g.id, v)} />
          </Card>
        );
      })}

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
        <button data-coach="goals" onClick={() => setAdding(true)} style={{ width: "100%", padding: "16px 0", borderRadius: 18, border: `1.6px dashed ${T.ink3}`, color: T.ink2, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + New goal
        </button>
      )}
    </div>
  );
}
