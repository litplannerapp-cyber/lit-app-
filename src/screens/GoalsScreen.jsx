import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { MintBar } from "../components/MintBar";
import { InlineAdd } from "../components/InlineAdd";
import { MilestoneRow } from "./MilestoneRow";
import { keyToDate } from "../utils/date";
import { goalPct } from "../utils/task";
import { useMediaQuery } from "../hooks/useMediaQuery";

/* the Lit ring (the logo's gapped circle) — reused for the medal and the
   celebration so "finished" always looks like Lit, never like a stock trophy */
const RING = "M75.67 88.78 A46.5 46.5 0 0 1 25.02 89.22 M20.42 85.88 A46.5 46.5 0 0 1 22.34 12.62 M27.10 9.53 A46.5 46.5 0 0 1 80.20 85.36";
const isComplete = (g) => g.milestones.length > 0 && g.milestones.every((m) => m.done);

const CHEERS = [
  ["You did it.", "You said you would — and you did."],
  ["That was a big one.", "Take a second to feel it."],
  ["One less thing to carry.", "Your future self says thank you."],
  ["Proof you can do hard things.", "Remember this next time it feels big."],
  ["Done. Properly done.", "Step by step got you here."],
];

const prefersReducedMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};

/* ---------- the constellation: one star per finished goal, top of the screen ----------
   Stars sit at fixed, hand-placed positions so every sky grows into the same
   pleasing shape; each new star is joined to the previous one. After 12 the
   pattern repeats a little offset and slightly smaller, so the sky keeps
   filling up instead of running out. Same night sky in light and dark theme. */
const STAR_POS = [[22, 40], [33, 22], [45, 40], [56, 18], [67, 36], [79, 18], [89, 42], [78, 64], [63, 58], [50, 70], [90, 74], [36, 62]];
const starPos = (i) => {
  const [x, y] = STAR_POS[i % STAR_POS.length];
  const layer = Math.floor(i / STAR_POS.length);
  return layer === 0 ? [x, y] : [Math.min(96, x + 5 * layer), Math.min(86, y + 8 * layer)];
};

function GoalSky({ done, ignite }) { // ignite = { id, k } of the goal that just completed
  const [picked, setPicked] = useState(null);
  const lineRefs = useRef([]);
  const starRefs = useRef([]);
  const numRef = useRef(null);
  const n = done.length;

  /* a new star lighting up: the line draws in, the star blooms and settles,
     the others twinkle, the number pops. Runs when `ignite` changes (after
     the celebration closes), never on first load. */
  useEffect(() => {
    if (!ignite || !n || prefersReducedMotion()) return;
    const i = done.findIndex((g) => g.id === ignite.id);
    if (i === -1) return;
    /* draw the joining line by growing its end point from the previous star
       to the new one (SVG attributes, tweened by hand) */
    const line = lineRefs.current[i];
    let raf = 0;
    if (line) {
      const [x1, y1] = starPos(i - 1), [x2, y2] = starPos(i);
      const t0 = performance.now(), dur = 900;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur), e = ease(t);
        line.setAttribute("x2", x1 + (x2 - x1) * e); line.setAttribute("y2", y1 + (y2 - y1) * e);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      line.setAttribute("x2", x1); line.setAttribute("y2", y1);
      raf = requestAnimationFrame(step);
    }
    starRefs.current[i]?.animate?.([
      { transform: "translate(-50%,-50%) scale(0)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1.9)", opacity: 1, offset: 0.55 },
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
    ], { duration: 1300, delay: line ? 650 : 0, easing: "cubic-bezier(.2,1.3,.4,1)", fill: "both" });
    starRefs.current.slice(0, n).filter((_, k) => k !== i).forEach((s, k) => s?.animate?.([{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }], { duration: 900, delay: 1500 + k * 90 }));
    numRef.current?.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }], { duration: 500, delay: 1400, easing: "cubic-bezier(.3,1.5,.5,1)" });
    return () => cancelAnimationFrame(raf);
  }, [ignite]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = starPos(n);
  const pickedGoal = picked != null ? done[picked] : null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div role="img" aria-label={n ? `${n} star${n === 1 ? "" : "s"} in your sky — one for every finished goal` : "Your sky is empty — finish a goal to light the first star"}
        style={{ position: "relative", height: 170, borderRadius: 24, overflow: "hidden",
          background: "radial-gradient(120% 90% at 80% 0%,#4A2B3A 0%,#2A1E26 45%,#1A1416 100%)", boxShadow: "0 18px 40px -22px rgba(40,20,30,.7)" }}>
        {/* faint background dust */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.9, backgroundImage: [
          [12, 30, .35], [33, 78, .25], [58, 22, .3], [74, 64, .3], [90, 38, .25], [46, 50, .2], [22, 62, .2], [82, 15, .3], [6, 12, .25], [64, 88, .2],
        ].map(([x, y, a]) => `radial-gradient(1.1px 1.1px at ${x}% ${y}%, rgba(255,255,255,${a}) 50%, transparent 51%)`).join(",") }} />
        {/* lines between consecutive stars */}
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs><linearGradient id="skyLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F4B16B" /><stop offset="1" stopColor="#E35F87" /></linearGradient></defs>
          {done.slice(1).map((g, k) => {
            const [x1, y1] = starPos(k); const [x2, y2] = starPos(k + 1);
            return <line key={g.id} ref={(el) => { lineRefs.current[k + 1] = el; }} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#skyLine)"
              strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity=".75" />;
          })}
        </svg>
        {/* the next star's spot — a quiet hint of where the sky grows */}
        <span aria-hidden="true" style={{ position: "absolute", left: `${next[0]}%`, top: `${next[1]}%`, width: 8, height: 8, transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px dashed rgba(255,243,234,.4)" }} />
        {done.map((g, i) => {
          const [x, y] = starPos(i);
          const small = i >= STAR_POS.length;
          return (
            <button key={g.id} ref={(el) => { starRefs.current[i] = el; }} onClick={() => setPicked(picked === i ? null : i)}
              aria-label={`Star ${i + 1}: ${g.title}`} aria-pressed={picked === i}
              style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 36, height: 36, transform: "translate(-50%,-50%)", display: "grid", placeItems: "center", cursor: "pointer", borderRadius: "50%" }}>
              <svg width={small ? 26 : 34} height={small ? 26 : 34} viewBox="-17 -17 34 34" aria-hidden="true">
                <defs><radialGradient id={`sg${i}`}><stop offset="0" stopColor="#FFC08F" stopOpacity=".95" /><stop offset=".35" stopColor="#ED7B65" stopOpacity=".45" /><stop offset="1" stopColor="#E35F87" stopOpacity="0" /></radialGradient></defs>
                <circle r={picked === i ? 17 : 15} fill={`url(#sg${i})`} />
                <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" fill="#FFE7CF" />
                <circle r="2.4" fill="#fff" />
              </svg>
            </button>
          );
        })}
        <div style={{ position: "absolute", left: 16, bottom: 13, color: "#FFF3EA", pointerEvents: "none" }}>
          <span ref={numRef} className="fr tnum" style={{ display: "inline-block", fontSize: 34, fontWeight: 500, lineHeight: 1 }}>{n}</span>
          <span style={{ display: "block", fontSize: 12, color: "rgba(255,243,234,.72)", marginTop: 4 }}>
            {n === 0 ? "Your sky is waiting — finish a goal to light the first star" : n === 1 ? "star in your sky" : "stars in your sky"}
          </span>
        </div>
        {n > 0 && picked == null && (
          <span style={{ position: "absolute", right: 14, bottom: 14, fontSize: 11, fontWeight: 600, color: "rgba(255,243,234,.75)", background: "rgba(255,255,255,.08)", padding: "5px 9px", borderRadius: 100, pointerEvents: "none" }}>Tap a star</span>
        )}
      </div>
      {pickedGoal && (
        <button onClick={() => setPicked(null)} aria-label="Close"
          style={{ display: "block", width: "100%", textAlign: "left", marginTop: 8, padding: "12px 14px", borderRadius: 16, background: "#2E2427", color: "#FFF3EA", fontSize: 12.5, cursor: "pointer", animation: "fadeIn .2s ease" }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#FFC08F", boxShadow: "0 0 8px #ED7B65", marginRight: 7 }} />
          <b style={{ fontSize: 13.5 }}>{pickedGoal.title}</b>
          <span style={{ display: "block", opacity: 0.75, marginTop: 2 }}>
            {pickedGoal.completedAt ? `Lit on ${new Date(pickedGoal.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · ` : ""}
            {pickedGoal.milestones.length} milestone{pickedGoal.milestones.length === 1 ? "" : "s"}
          </span>
        </button>
      )}
    </div>
  );
}

/* ---------- the celebration: shown when a goal's last milestone is ticked ---------- */
function Celebration({ goal, cheer, onClose }) {
  const reduced = prefersReducedMotion();
  const ringRef = useRef(null);
  const burstRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  /* runs once per celebration — the parent re-renders right after the tick
     (goals update), and that must not restart the burst or the timer */
  useEffect(() => {
    try { navigator.vibrate?.([14, 60, 22]); } catch { /* not supported (iOS) */ }
    const t = setTimeout(() => closeRef.current(), reduced ? 3200 : 4200);
    if (!reduced) {
      ringRef.current?.animate([{ strokeDashoffset: 300, transform: "rotate(-90deg) scale(.7)" }, { strokeDashoffset: 0, transform: "rotate(0deg) scale(1)" }],
        { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
      const box = burstRef.current;
      if (box) {
        const colors = ["#F4B16B", "#ED7B65", "#E35F87", "#FFD9A8", "#6BD4B3"];
        for (let i = 0; i < 26; i++) {
          const s = document.createElement("span");
          const size = 5 + Math.random() * 7;
          const round = Math.random() > 0.4;
          s.style.cssText = `position:absolute;left:50%;top:50%;width:${size}px;height:${round ? size : size * 0.45}px;border-radius:${round ? "50%" : "2px"};background:${colors[i % colors.length]};pointer-events:none`;
          box.appendChild(s);
          const ang = (i / 26) * Math.PI * 2 + Math.random() * 0.3;
          const dist = 90 + Math.random() * 80;
          s.animate([
            { transform: "translate(-50%,-50%) scale(.2)", opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) rotate(${Math.random() * 360}deg) scale(1)`, opacity: 1, offset: 0.7 },
            { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 1.1}px), calc(-50% + ${Math.sin(ang) * dist * 1.1 + 30}px)) scale(.6)`, opacity: 0 },
          ], { duration: 1300 + Math.random() * 500, delay: 380, easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" });
        }
      }
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div onClick={onClose} role="dialog" aria-live="assertive" aria-label={`${cheer[0]} ${goal.title} is complete.`}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center", background: "rgba(24,21,18,.42)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", animation: "fadeIn .25s ease", cursor: "pointer", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 340, padding: "34px 26px 26px", borderRadius: 28, background: T.card, boxShadow: "0 30px 80px rgba(0,0,0,.35)", textAlign: "center", animation: reduced ? "fadeIn .25s ease" : "modalIn .45s cubic-bezier(.3,1.3,.5,1)" }}>
        <div ref={burstRef} style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
          <svg width="120" height="120" viewBox="0 0 100 100" aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs><linearGradient id="celebGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4B16B" /><stop offset=".52" stopColor="#ED7B65" /><stop offset="1" stopColor="#E35F87" /></linearGradient>
              <radialGradient id="celebGlow"><stop offset="0" stopColor="#FFC9A0" stopOpacity=".55" /><stop offset="1" stopColor="#FFC9A0" stopOpacity="0" /></radialGradient></defs>
            <circle cx="50" cy="50" r="50" fill="url(#celebGlow)" />
            <path ref={ringRef} d={RING} fill="none" stroke="url(#celebGrad)" strokeWidth="6" strokeLinecap="butt"
              style={{ strokeDasharray: 300, strokeDashoffset: reduced ? 0 : 300, transformOrigin: "50px 50px" }} />
            <path d="M33 51l11 11 23-25" fill="none" stroke="url(#celebGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 60, strokeDashoffset: 0, animation: reduced ? undefined : "goalTick .5s ease .7s both" }} />
          </svg>
        </div>
        <div className="fr" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.15, marginTop: 16, color: T.ink }}>{cheer[0]}</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: T.coral, marginTop: 8, overflowWrap: "break-word" }}>“{goal.title}” — complete</div>
        <div style={{ fontSize: 13.5, color: T.ink2, marginTop: 6, lineHeight: 1.45 }}>{cheer[1]}</div>
        <button onClick={onClose} style={{ marginTop: 20, padding: "12px 26px", borderRadius: 100, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Keep going</button>
      </div>
      <style>{"@keyframes goalTick{from{stroke-dashoffset:60}to{stroke-dashoffset:0}}"}</style>
    </div>,
    document.body,
  );
}

export function GoalsScreen({ goals, onToggleMilestone, onAddMilestone, onEditMilestone, onDeleteMilestone, onUpdateGoal, onCreateGoal, onDeleteGoal, setEditor }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const wide = useMediaQuery("(min-width: 1200px)");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [msDraft, setMsDraft] = useState("");
  const [editingGoal, setEditingGoal] = useState(null); // goal id whose title/date is being edited
  const [goalDraft, setGoalDraft] = useState({ title: "", date: "" });
  const [celebrate, setCelebrate] = useState(null);     // { goal, cheer }
  const [bump, setBump] = useState(null); // { id, k } — the goal whose star should light up next

  const createGoal = () => {
    if (!title.trim()) return;
    onCreateGoal({ title: title.trim(), targetDate: date, milestones: msDraft.split("\n").map((s) => s.trim()).filter(Boolean) });
    setTitle(""); setDate(""); setMsDraft(""); setAdding(false);
  };

  /* ticking the LAST open milestone of a goal is the "goal complete" moment */
  const toggleMilestone = (g, m) => {
    const willComplete = !m.done && g.milestones.filter((x) => !x.done).length === 1;
    onToggleMilestone(g.id, m.id);
    if (willComplete) {
      setCelebrate({ goal: g, cheer: CHEERS[Math.floor(Math.random() * CHEERS.length)] });
    }
  };

  const startGoalEdit = (g) => { setGoalDraft({ title: g.title, date: g.targetDate || "" }); setEditingGoal(g.id); };
  const saveGoalEdit = (g) => {
    const t = goalDraft.title.trim();
    const changes = {};
    if (t && t !== g.title) changes.title = t;
    if ((goalDraft.date || "") !== (g.targetDate || "")) changes.targetDate = goalDraft.date || null;
    if (Object.keys(changes).length) onUpdateGoal(g.id, changes);
    setEditingGoal(null);
  };

  return (
    <div style={{ padding: isDesktop ? "0" : "84px 22px 0", maxWidth: isDesktop && !wide ? 760 : undefined, margin: isDesktop && !wide ? "0 auto" : undefined }} className="rise">
      <Eyebrow>Big things, broken into steps</Eyebrow>
      <h1 className="fr" style={{ fontSize: 34, fontWeight: 500, margin: "6px 0 16px" }}>Goals</h1>
      {goals.length > 0 && <GoalSky ignite={bump}
        /* stars in the order goals were finished; ones finished before
           completed_at existed (no date) come first, in their list order */
        done={goals.filter(isComplete).map((g, ix) => ({ g, ix })).sort((a, b) => {
          const ta = a.g.completedAt ? Date.parse(a.g.completedAt) : -1, tb = b.g.completedAt ? Date.parse(b.g.completedAt) : -1;
          return ta - tb || a.ix - b.ix;
        }).map((x) => x.g)} />}

      {/* wide desktop: goal cards side by side, two per row */}
      <div style={wide ? { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", columnGap: 18, alignItems: "start", marginTop: 6 } : undefined}>
      {goals.map((g) => {
        const pct = goalPct(g);
        const done = isComplete(g);
        const nextIx = g.milestones.findIndex((m) => !m.done);
        const editingThis = editingGoal === g.id;
        return (
          <Card key={g.id} className="goal-card" style={{ padding: "20px 20px 12px", marginBottom: 14, position: "relative",
            boxShadow: done ? `0 0 0 1.5px ${T.mint}, ${T.shadowSm}` : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              {editingThis ? (
                <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 8 }}>
                  <input autoFocus value={goalDraft.title} onChange={(e) => setGoalDraft((d) => ({ ...d, title: e.target.value }))} aria-label="Goal name" enterKeyHint="done"
                    onKeyDown={(e) => { if (e.key === "Enter") saveGoalEdit(g); if (e.key === "Escape") setEditingGoal(null); }}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${T.mint}`, outline: "none", background: T.bg, fontSize: 15.5, fontWeight: 700, color: T.ink }} />
                  <input type="date" value={goalDraft.date || ""} onChange={(e) => setGoalDraft((d) => ({ ...d, date: e.target.value }))} aria-label="Target date"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 12, border: "none", outline: "none", background: T.bg, fontSize: 13.5, color: T.ink, WebkitAppearance: "none", appearance: "none" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveGoalEdit(g)} style={{ padding: "9px 18px", borderRadius: 100, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingGoal(null)} style={{ padding: "9px 14px", borderRadius: 100, background: T.bg, color: T.ink2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => startGoalEdit(g)} aria-label={`Edit goal: ${g.title}`} title="Edit goal"
                  style={{ minWidth: 0, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 16.5, fontWeight: 700, color: T.ink, overflowWrap: "break-word" }}>{g.title}</span>
                    {g.targetDate && <span style={{ display: "block", fontSize: 12, color: T.ink3, marginTop: 3 }}>by {keyToDate(g.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                  </span>
                  <span style={{ marginTop: 2, flexShrink: 0, opacity: 0.8 }}>{Ic.pencil(T.ink3)}</span>
                </button>
              )}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div className="fr tnum" style={{ fontSize: 30, fontWeight: 600, color: T.mint, lineHeight: 1 }}>{pct}%</div>
                {done && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: T.mint, background: T.mintSoft, padding: "3px 8px", borderRadius: 100 }}>COMPLETE</div>}
              </div>
            </div>
            <div style={{ margin: "14px 0 16px" }}><MintBar pct={pct} /></div>
            {g.milestones.map((m, ix) => (
              <MilestoneRow key={m.id} m={m} isNext={ix === nextIx}
                onToggle={() => toggleMilestone(g, m)}
                onEdit={(text) => onEditMilestone(g.id, m.id, text)}
                onDelete={onDeleteMilestone ? () => onDeleteMilestone(g.id, m.id) : undefined}
                onTurnIntoTask={() => setEditor({ initial: { text: m.text } })} />
            ))}
            {/* footer: add a milestone on the left, delete the goal bottom-right */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <div style={{ flex: 1, minWidth: 0 }}><InlineAdd placeholder="Add a milestone" onAdd={(v) => onAddMilestone(g.id, v)} /></div>
              <button onClick={() => onDeleteGoal(g.id)} aria-label={`Delete goal: ${g.title}`} title="Delete goal" className="goal-trash"
                style={{ width: 40, height: 40, borderRadius: 14, display: "grid", placeItems: "center", background: T.bg, color: T.ink2, cursor: "pointer", flexShrink: 0 }}>
                {Ic.trash(T.ink2, 17)}
              </button>
            </div>
          </Card>
        );
      })}
      </div>

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

      {celebrate && <Celebration goal={celebrate.goal} cheer={celebrate.cheer} onClose={() => { setBump({ id: celebrate.goal.id, k: Date.now() }); setCelebrate(null); }} />}
    </div>
  );
}
