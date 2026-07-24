import { useMemo, useRef, useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { HALO_ARCS } from "../constants";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { MintBar } from "../components/MintBar";
import { TaskCard } from "../components/TaskCard";
import { useHSwipe } from "../hooks/useHSwipe";
import { addDays, toDateKey, keyToDate, phraseForToday } from "../utils/date";
import { byPeriodAndTime, goalPct } from "../utils/task";
import { financeMonthTotals, monthLabel, toMonthKey } from "../utils/finance";

export function TodayScreen({ tasks, top3, rest, doneTop3, selectedDay, setSelectedDay, todayKey, streak, captures, finance, goals, toggleDone, deleteTask, setTop3, moveTaskToDay, setEditor, setInboxOpen, setTab, openDetail, financeMonth, setFinanceMonth, profile, openProfile, dark, toggleTheme }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const longDate = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const phrase = phraseForToday();

  /* fixed Monday→Sunday strip */
  const monday = useMemo(() => {
    const d = new Date(now);
    const wd = (d.getDay() + 6) % 7; // Mon=0
    return addDays(d, -wd);
  }, []); // eslint-disable-line
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const heroState = doneTop3 === 0
    ? { title: "A clear runway", sub: top3.length ? `${top3.length} thing${top3.length > 1 ? "s" : ""} that matter today. Start with the smallest.` : "Choose up to three things that matter today." }
    : doneTop3 < top3.length
      ? { title: "Momentum", sub: `${top3.length - doneTop3} of your three left. You're moving.` }
      : { title: "Day clear", sub: "Your three are done. Whatever you do next is a bonus." };

  const grouped = useMemo(() => {
    const g = {};
    rest.forEach((t) => { const k = t.group?.name || "No group"; (g[k] = g[k] || []).push(t); });
    Object.values(g).forEach((list) => list.sort(byPeriodAndTime));
    return g;
  }, [rest]);

  const mainGoal = goals[0];
  const financeReady = finance.income != null;
  const financeLeft = financeReady ? financeMonthTotals(finance, financeMonth).left : 0;

  /* --- press & drag: hold a card (touch) or just drag it (mouse), drop on a
     weekday to move the date, on "Your 3" to make it a priority, or on
     "Rest of the day" to demote. Ghost follows the finger.

     Pointer capture is set on the grip the moment the gesture starts so
     move/up/cancel keep arriving here no matter what the finger passes over,
     and every one of those listeners is filtered to this gesture's exact
     pointerId so a second, accidental touch can't cross wires with it. A
     safety timeout guarantees the ghost is released even if a pointerup is
     somehow never delivered — this was freezing the whole card mid-drag on
     some mobile browsers. --- */
  const [drag, setDrag] = useState(null);           // {id, text, x, y}
  const [hoverZone, setHoverZone] = useState(null); // "top3" | "rest" | "day:YYYY-MM-DD"
  const zoneRef = useRef(null);
  const justDragged = useRef(false);

  const startDrag = (t) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const pointerId = e.pointerId;
    const grip = e.currentTarget;
    try { grip.setPointerCapture(pointerId); } catch { /* unsupported — window listeners still cover the gesture */ }
    const startX = e.clientX, startY = e.clientY;
    let active = false;
    let safetyTimer = null;

    const activate = () => {
      if (active) return;
      active = true;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden"; /* freeze page scroll (body AND html) */
      setDrag({ id: t.id, text: t.text, x: startX, y: startY });
      safetyTimer = setTimeout(() => end(false), 8000); /* never let a missed pointerup leave the ghost stuck */
    };
    activate(); /* the grip is touch-action:none, so the gesture is ours from the first pixel */

    const touchBlock = (ev) => { if (active && ev.cancelable) ev.preventDefault(); };

    const move = (ev) => {
      if (ev.pointerId !== pointerId || !active) return;
      setDrag((d) => d && { ...d, x: ev.clientX, y: ev.clientY });
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = under && under.closest ? under.closest("[data-drop]") : null;
      const z = zone ? zone.getAttribute("data-drop") : null;
      zoneRef.current = z; setHoverZone(z);
    };
    const end = (apply) => {
      clearTimeout(safetyTimer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("touchmove", touchBlock);
      try { grip.releasePointerCapture(pointerId); } catch { /* already released or unsupported */ }
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (active && apply) {
        const z = zoneRef.current;
        if (z && z.startsWith("day:")) moveTaskToDay(t.id, z.slice(4));
        else if (z === "top3") setTop3(t.id, true);   /* 4th attempt still refused in silence */
        else if (z === "rest") setTop3(t.id, false);
        justDragged.current = true;
        setTimeout(() => { justDragged.current = false; }, 120);
      }
      setDrag(null); setHoverZone(null); zoneRef.current = null;
    };
    const up = (ev) => { if (ev.pointerId === pointerId) end(true); };
    const cancel = (ev) => { if (ev.pointerId === pointerId) end(false); };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("touchmove", touchBlock, { passive: false });
  };
  const openDetailGuarded = (id) => { if (!justDragged.current) openDetail(id); };

  /* swipe left = next day, swipe right = previous day (clamped to this week's strip) */
  const [daySlide, setDaySlide] = useState(null); // {dir, k}
  const daySwipe = useHSwipe((dir) => {
    const idx = week.findIndex((d) => toDateKey(d) === selectedDay);
    const next = idx + dir;
    if (next < 0 || next > 6) return; /* Mon–Sun strip is fixed — quiet stop at the edges */
    const k = toDateKey(week[next]);
    setSelectedDay(k); setFinanceMonth(toMonthKey(keyToDate(k)));
    setDaySlide({ dir, k: Date.now() });
  });

  return (
    <div style={{ padding: "26px 22px 0", touchAction: "pan-y" }} className="rise" onPointerDown={daySwipe.onPointerDown}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow>{longDate}</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{ width: 30, height: 30, borderRadius: 15, background: T.card, border: `1px solid ${T.stroke}`, boxShadow: T.shadowSm, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2 }}>
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
              </svg>
            )}
          </button>
          <button onClick={openProfile} aria-label="Profile and settings"
            style={{ width: 30, height: 30, borderRadius: 15, background: T.coralGrad, color: "#fff", display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
            {(profile?.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
        <h1 className="fr" style={{ fontSize: 34, fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>
          {greeting}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
        </h1>
        <button data-coach="inbox" onClick={() => setInboxOpen(true)} aria-label="Open Inbox" style={{ position: "relative", width: 44, height: 44, borderRadius: 15, background: T.card, boxShadow: T.shadowSm, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, marginLeft: 12 }}>
          {Ic.tray()}
          {captures.length > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, minWidth: 19, height: 19, borderRadius: 10, background: T.coralGrad, color: "#fff", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", padding: "0 5px" }}>{captures.length}</span>
          )}
        </button>
      </div>

      {/* week strip Mon–Sun */}
      <div data-noswipe style={{ display: "flex", gap: 6, marginTop: 22 }}>
        {week.map((d) => {
          const k = toDateKey(d);
          const sel = k === selectedDay;
          const hasTask = tasks.some((t) => t.dateKey === k);
          return (
            <button key={k} onClick={() => { setSelectedDay(k); setFinanceMonth(toMonthKey(keyToDate(k))); }}
              data-drop={"day:" + k}
              style={{ flex: 1, padding: "10px 0 9px", borderRadius: 16, cursor: "pointer", textAlign: "center",
                background: sel ? T.coralGrad : hoverZone === "day:" + k ? T.coralSoft : "transparent",
                outline: hoverZone === "day:" + k ? `2px solid ${T.coral}` : "none",
                boxShadow: sel ? "0 6px 16px rgba(255,107,94,.32)" : "none",
                color: sel ? "#fff" : T.ink2, transition: "background .25s ease, box-shadow .25s ease" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", opacity: sel ? 0.9 : 0.8 }}>
                {d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3).toUpperCase()}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2, color: sel ? "#fff" : T.ink }}>{d.getDate()}</div>
              <div style={{ width: 4, height: 4, borderRadius: 2, margin: "4px auto 0", background: hasTask ? (sel ? "rgba(255,255,255,.85)" : T.coral) : "transparent" }} />
            </button>
          );
        })}
      </div>

      <div key={daySlide ? daySlide.k : "day"} style={{
        transform: daySwipe.dragging ? `translateX(${daySwipe.x}px)` : undefined,
        transition: daySwipe.dragging ? "none" : "transform .25s ease",
        animation: daySlide && !daySwipe.dragging ? `${daySlide.dir === 1 ? "slideFromRight" : "slideFromLeft"} .3s cubic-bezier(.3,.8,.4,1)` : undefined,
      }}>
      {/* phrase of the day */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 4px 0" }}>
        {Ic.feather()}
        <span className="fr" style={{ fontStyle: "italic", fontSize: 14.5, color: T.ink2 }}>{phrase}</span>
      </div>

      {/* hero — clarity ring */}
      <Card data-coach="ring" style={{ marginTop: 18, padding: "22px 22px", display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="104" height="104" viewBox="0 0 104 104" style={{ flexShrink: 0, display: "block" }}>
          <defs>
            <linearGradient id="ring" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="85" y2="92">
              <stop offset="0%" stopColor="#FFB35C" /><stop offset="55%" stopColor="#FF6B5E" /><stop offset="100%" stopColor="#F4508C" />
            </linearGradient>
          </defs>
          {/* the ring's shape is the brand mark itself — 3 arcs, one per priority.
              each arc lights up (dashoffset sweep + a soft halo stroke underneath)
              the moment that priority is checked off; unchecking reverses it.
              No SVG filter here on purpose — feDropShadow recalculated on every
              re-render is a known freeze risk on real devices; a second, wider,
              translucent stroke gives the same glow far more cheaply. */}
          {HALO_ARCS.map((arc, i) => {
            const done = !!top3[i]?.done;
            return (
              <g key={i}>
                <path d={arc.d} fill="none" stroke={T.hairline} strokeWidth="5" strokeLinecap="round" />
                {done && (
                  <path d={arc.d} fill="none" stroke="#FF6B5E" strokeWidth="9" strokeLinecap="round"
                    opacity={0.28} style={{ transition: "opacity .3s ease" }} />
                )}
                <path d={arc.d} fill="none" stroke="url(#ring)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={arc.length} strokeDashoffset={done ? 0 : arc.length}
                  style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }} />
              </g>
            );
          })}
          <g key={doneTop3} style={{ transformOrigin: "52px 52px", animation: "pop .45s cubic-bezier(.34,1.5,.5,1)" }}>
            <text x="52" y="57" textAnchor="middle" className="fr tnum" style={{ fontSize: 21, fontWeight: 600, fill: T.ink }}>{doneTop3}/{top3.length || 3}</text>
          </g>
        </svg>
        <div>
          <h2 className="fr" style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{heroState.title}</h2>
          <p style={{ fontSize: 13.5, color: T.ink2, margin: "6px 0 0", lineHeight: 1.5 }}>{heroState.sub}</p>
          {doneTop3 === top3.length && top3.length > 0 && streak > 0 && (
            <p style={{ fontSize: 12, color: T.ink3, margin: "8px 0 0" }}>{streak} day{streak > 1 ? "s" : ""} of steady rhythm</p>
          )}
        </div>
      </Card>

      {/* Your 3 today */}
      <div style={{ marginTop: 28 }}>
        <Eyebrow style={{ marginBottom: 12 }}>Your 3 today</Eyebrow>
        {drag && !top3.some((x) => x.id === drag.id) && (
          <div data-drop="top3" style={{ border: `1.8px dashed ${hoverZone === "top3" ? T.coral : T.ink3}`, background: hoverZone === "top3" ? T.coralSoft : "transparent", borderRadius: 16, padding: "13px 16px", marginBottom: 10, textAlign: "center", fontSize: 13, fontWeight: 600, color: hoverZone === "top3" ? T.coral : T.ink2, transition: "all .15s" }}>
            Drop here — one of your 3
          </div>
        )}
        {top3.map((t) => (
          <TaskCard key={t.id} t={t} big toggleDone={toggleDone} deleteTask={deleteTask} setTop3={setTop3} setEditor={setEditor} openDetail={openDetailGuarded} onPressDrag={startDrag(t)} dragging={drag?.id === t.id} />
        ))}
        {top3.length === 0 && rest.length > 0 && (
          <div data-drop="top3"
            style={{ border: `1.6px dashed ${hoverZone === "top3" ? T.coral : T.ink3}`, background: hoverZone === "top3" ? T.coralSoft : "transparent", borderRadius: T.r, padding: "26px 20px", textAlign: "center", color: T.ink2, fontSize: 13.5, transition: "all .15s" }}>
            Drag a task here — or tap the star on any task below
          </div>
        )}
        {top3.length === 0 && rest.length === 0 && (
          <Card style={{ padding: "30px 20px", textAlign: "center", boxShadow: T.shadowSm }}>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 10, opacity: .7 }}>{Ic.feather(T.ink3)}</div>
            <p className="fr" style={{ fontStyle: "italic", fontSize: 15, color: T.ink2, margin: 0 }}>Nothing planned yet. The day is still yours.</p>
          </Card>
        )}
        {top3.length > 0 && top3.length < 3 && (
          <div style={{ height: 10 }} />
        )}
      </div>

      {/* Rest of the day */}
      <div style={{ marginTop: 30, borderTop: `1px solid ${T.hairline}`, paddingTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <Eyebrow>Rest of the day</Eyebrow>
          <span style={{ fontSize: 12, color: T.ink3 }}>{rest.length > 0 ? `${rest.length} waiting, no pressure` : "nothing waiting"}</span>
        </div>
        {drag && top3.some((x) => x.id === drag.id) && (
          <div data-drop="rest" style={{ border: `1.8px dashed ${hoverZone === "rest" ? T.ink2 : T.ink3}`, background: hoverZone === "rest" ? T.bg : "transparent", borderRadius: 16, padding: "13px 16px", marginBottom: 10, textAlign: "center", fontSize: 13, fontWeight: 600, color: T.ink2, transition: "all .15s" }}>
            Drop here — later today, no pressure
          </div>
        )}
        {Object.entries(grouped).map(([g, list]) => (
          <div key={g} style={{ marginBottom: 10 }}>
            {Object.keys(grouped).length > 1 && <div style={{ fontSize: 11.5, color: T.ink3, fontWeight: 600, margin: "10px 2px 6px" }}>{g}</div>}
            {list.map((t) => (
              <TaskCard key={t.id} t={t} toggleDone={toggleDone} deleteTask={deleteTask} setTop3={setTop3} setEditor={setEditor} openDetail={openDetailGuarded} onPressDrag={startDrag(t)} dragging={drag?.id === t.id} />
            ))}
          </div>
        ))}
      </div>

      {/* add task — the day's primary action, before the peripheral glances */}
      <button data-coach="addtask" onClick={() => setEditor({})} style={{ width: "100%", marginTop: 26, padding: "16px 0", borderRadius: 18, background: T.coralGrad, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 24px rgba(255,107,94,.32)" }}>
        Add task
      </button>

      {/* At a glance */}
      {(mainGoal || finance.income != null) && (
        <div style={{ marginTop: 26 }}>
          <Eyebrow style={{ marginBottom: 12 }}>At a glance</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: mainGoal && finance.income != null ? "1fr 1fr" : "1fr", gap: 12 }}>
            {mainGoal && (
              <Card onClick={() => setTab("goals")} className="pressable" style={{ padding: 16, boxShadow: T.shadowSm }}>
                <Eyebrow style={{ fontSize: 10, color: T.mint }}>Goal</Eyebrow>
                <div style={{ fontSize: 14, fontWeight: 600, margin: "6px 0 8px", lineHeight: 1.3 }}>{mainGoal.title}</div>
                <MintBar pct={goalPct(mainGoal)} />
                <div className="fr tnum" style={{ fontSize: 18, fontWeight: 600, color: T.mint, marginTop: 8 }}>{goalPct(mainGoal)}%</div>
              </Card>
            )}
            {finance.income != null && (
              <Card onClick={() => setTab("finance")} className="pressable" style={{ padding: 16, boxShadow: T.shadowSm }}>
                <Eyebrow style={{ fontSize: 10, color: T.sky }}>{monthLabel(financeMonth)}</Eyebrow>
                <div style={{ fontSize: 12.5, color: T.ink2, margin: "6px 0 2px" }}>You can save</div>
                <div className="fr tnum" style={{ fontSize: 22, fontWeight: 600 }}>€{financeLeft.toLocaleString("en-IE", { maximumFractionDigits: 0 })}</div>
              </Card>
            )}
          </div>
        </div>
      )}

      </div>

      {/* drag ghost */}
      {drag && (
        <div style={{ position: "fixed", left: drag.x, top: drag.y, transform: "translate(-50%, -120%) rotate(-2deg)", zIndex: 300, pointerEvents: "none", background: T.card, boxShadow: "0 18px 40px rgba(46,42,38,.22)", borderRadius: 16, padding: "12px 18px", fontSize: 14, fontWeight: 600, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {drag.text}
        </div>
      )}
    </div>
  );
}
