import { useEffect, useMemo, useRef, useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { HALO_ARCS } from "../constants";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { MintBar } from "../components/MintBar";
import { TaskCard } from "../components/TaskCard";
import { MiniCalendar } from "../components/MiniCalendar";
import { useHSwipe } from "../hooks/useHSwipe";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { addDays, toDateKey, keyToDate, phraseForToday } from "../utils/date";
import { byPeriodAndTime, goalPct } from "../utils/task";
import { financeMonthTotals, monthLabel, toMonthKey } from "../utils/finance";

/* touch drops are imprecise, so hit-testing samples a small ring of points
   around the finger (center + 8 around it, ~14px out) instead of just the
   exact pixel — the first hit wins */
const DROP_SAMPLE_RADIUS = 14;
const DROP_SAMPLE_OFFSETS = [
  [0, 0],
  [DROP_SAMPLE_RADIUS, 0], [-DROP_SAMPLE_RADIUS, 0], [0, DROP_SAMPLE_RADIUS], [0, -DROP_SAMPLE_RADIUS],
  [DROP_SAMPLE_RADIUS, DROP_SAMPLE_RADIUS], [DROP_SAMPLE_RADIUS, -DROP_SAMPLE_RADIUS], [-DROP_SAMPLE_RADIUS, DROP_SAMPLE_RADIUS], [-DROP_SAMPLE_RADIUS, -DROP_SAMPLE_RADIUS],
];
const findDropZone = (x, y) => {
  for (const [dx, dy] of DROP_SAMPLE_OFFSETS) {
    const el = document.elementFromPoint(x + dx, y + dy);
    const zone = el && el.closest ? el.closest("[data-drop]") : null;
    if (zone) return zone.getAttribute("data-drop");
  }
  return null;
};

export function TodayScreen({ tasks, top3, rest, doneTop3, selectedDay, setSelectedDay, todayKey, streak, finance, goals, toggleDone, deleteTask, setTop3, moveTaskToDay, taskToInbox, setEditor, setTab, openDetail, financeMonth, setFinanceMonth, profile }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const longDate = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const phrase = phraseForToday();

  /* the week strip is navigable now — it used to be locked to the current
     week forever (computed once with useMemo), which meant there was no way
     to reach a date outside it. weekMonday is state instead; swiping past an
     edge rolls into the next/prev week rather than just stopping. */
  const [weekMonday, setWeekMonday] = useState(() => {
    const wd = (now.getDay() + 6) % 7; // Mon=0
    return addDays(now, -wd);
  });
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i));
  const [calendarOpen, setCalendarOpen] = useState(false);

  const heroState = doneTop3 === 0
    ? { title: "A clear runway", sub: top3.length ? `${top3.length} thing${top3.length > 1 ? "s" : ""} that matter today. Start with the smallest.` : "Choose up to three things that matter today." }
    : doneTop3 < top3.length
      ? { title: "Momentum", sub: `${top3.length - doneTop3} of your ${top3.length} left. You're moving.` }
      : { title: "Day clear", sub: `Your ${top3.length} ${top3.length === 1 ? "is" : "are"} done. Whatever you do next is a bonus.` };
  const dayComplete = top3.length === 3 && doneTop3 === 3;

  /* the halo's "lit" moment — Apple's own research on Activity Rings calls
     this the Gestalt closure effect: an open shape creates a small mental
     itch, and closing it is where the payoff lives. We echo that payoff
     literally, in our own language — light turning on, not confetti. */
  const [justLit, setJustLit] = useState(false);
  const prevComplete = useRef(false);
  useEffect(() => {
    if (dayComplete && !prevComplete.current) {
      setJustLit(true);
      const t = setTimeout(() => setJustLit(false), 1500);
      prevComplete.current = true;
      return () => clearTimeout(t);
    }
    if (!dayComplete) prevComplete.current = false;
  }, [dayComplete]);

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
      const z = findDropZone(ev.clientX, ev.clientY);
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
        else if (z === "inbox") taskToInbox(t.id);    /* drop on the Inbox trigger — no date anymore, becomes a capture */
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

  /* swipe left = next day, swipe right = previous day — rolls into the next
     or previous week when it runs past the strip's edge, instead of just
     stopping (that "stop" was the bug: no way to reach a date outside the
     current week at all). */
  const [daySlide, setDaySlide] = useState(null); // {dir, k}
  const daySwipe = useHSwipe((dir) => {
    const idx = week.findIndex((d) => toDateKey(d) === selectedDay);
    const next = idx + dir;
    let targetDate;
    if (next < 0) { setWeekMonday((m) => addDays(m, -7)); targetDate = addDays(week[0], -1); }
    else if (next > 6) { setWeekMonday((m) => addDays(m, 7)); targetDate = addDays(week[6], 1); }
    else targetDate = week[next];
    const k = toDateKey(targetDate);
    setSelectedDay(k); setFinanceMonth(toMonthKey(keyToDate(k)));
    setDaySlide({ dir, k: Date.now() });
  });

  /* jump to any date directly — the other half of the fix */
  const jumpToDate = (d) => {
    const wd = (d.getDay() + 6) % 7;
    setWeekMonday(addDays(d, -wd));
    const k = toDateKey(d);
    setSelectedDay(k); setFinanceMonth(toMonthKey(keyToDate(k)));
    setCalendarOpen(false);
  };

  return (
    <div style={{ padding: isDesktop ? "26px 22px 0" : "84px 22px 0", touchAction: "pan-y" }} className="rise" onPointerDown={daySwipe.onPointerDown}>
      {/* header */}
      <Eyebrow>{longDate}</Eyebrow>
      <h1 className="fr" style={{ fontSize: 34, fontWeight: 500, margin: "6px 0 0", letterSpacing: "-0.01em" }}>
        {greeting}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
      </h1>

      {/* week strip Mon–Sun — now navigable: arrows for mouse/desktop, swipe
          for touch (rolls into the next/prev week past the edge), and a
          calendar button to jump straight to any date */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 22 }}>
        <button onClick={() => setWeekMonday((m) => addDays(m, -7))} aria-label="Previous week" className="hoverable"
          style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>

        <div data-noswipe style={{ display: "flex", gap: 4, flex: 1 }}>
          {week.map((d) => {
            const k = toDateKey(d);
            const sel = k === selectedDay;
            const hasTask = tasks.some((t) => t.dateKey === k);
            return (
              <button key={k} onClick={() => { setSelectedDay(k); setFinanceMonth(toMonthKey(keyToDate(k))); }}
                data-drop={"day:" + k}
                style={{ flex: 1, padding: "12px 0 11px", borderRadius: 16, cursor: "pointer", textAlign: "center",
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

        <button onClick={() => setWeekMonday((m) => addDays(m, 7))} aria-label="Next week" className="hoverable"
          style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        <button onClick={() => setCalendarOpen(true)} aria-label="Pick a date" className="hoverable"
          style={{ width: 34, height: 34, borderRadius: 11, background: T.card, border: `1px solid ${T.stroke}`, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2, flexShrink: 0, marginLeft: 2 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
        </button>
      </div>

      {calendarOpen && (
        <MiniCalendar selectedDay={selectedDay} onPick={jumpToDate} onClose={() => setCalendarOpen(false)} />
      )}

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
      <Card data-coach="ring" style={{ marginTop: 18, padding: "22px 22px", display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "visible" }}>
        {/* ambient glow while the day is fully lit — quiet, not blinking;
            just a soft warmth sitting behind the ring, like a lamp left on */}
        {dayComplete && (
          <div aria-hidden style={{
            position: "absolute", left: 22, top: 22, width: 104, height: 104, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,179,92,0.35) 0%, rgba(255,107,94,0.18) 45%, transparent 72%)",
            filter: "blur(6px)", pointerEvents: "none", animation: "ambientGlow 3.2s ease-in-out infinite",
          }} />
        )}
        <svg width="104" height="104" viewBox="0 0 104 104" style={{ flexShrink: 0, display: "block", position: "relative",
          animation: justLit ? "ringSettle 1.5s cubic-bezier(.25,1,.35,1)" : undefined }}>
          <defs>
            <linearGradient id="ring" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="85" y2="92">
              <stop offset="0%" stopColor="#FFB35C" /><stop offset="55%" stopColor="#FF6B5E" /><stop offset="100%" stopColor="#F4508C" />
            </linearGradient>
            <radialGradient id="litFlash" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF4E0" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#FFB35C" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF6B5E" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* the "lit" moment: light flaring outward once, the instant the
              third priority is checked off — not confetti, just light
              turning on, in the app's own vocabulary */}
          {justLit && (
            <circle cx="52" cy="52" r="30" fill="url(#litFlash)" style={{ animation: "litFlare 1.5s cubic-bezier(.16,1,.3,1)", transformOrigin: "52px 52px" }} />
          )}
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
          <h2 className="fr" style={{ fontSize: 22, fontWeight: 600, margin: 0,
            ...(dayComplete ? { backgroundImage: "linear-gradient(100deg,#FFB35C,#FF6B5E)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {}) }}>
            {heroState.title}
          </h2>
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
      <button data-coach="addtask" onClick={() => setEditor({ initial: { dateKey: selectedDay } })} style={{ width: "100%", marginTop: 26, padding: "16px 0", borderRadius: 18, background: T.coralGrad, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 24px rgba(255,107,94,.32)" }}>
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
