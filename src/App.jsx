import { useCallback, useEffect, useRef, useState } from "react";
import { T, applyTheme } from "./theme";
import { GlobalStyle } from "./components/GlobalStyle";
import { Dock } from "./components/Dock";
import { TodayScreen } from "./screens/TodayScreen";
import { VisionScreen } from "./screens/VisionScreen";
import { FinanceScreen } from "./screens/FinanceScreen";
import { GoalsScreen } from "./screens/GoalsScreen";
import { InboxSheet } from "./sheets/InboxSheet";
import { TaskEditor } from "./sheets/TaskEditor";
import { SettingsSheet } from "./sheets/SettingsSheet";
import { TaskDetailSheet } from "./sheets/TaskDetailSheet";
import { CoachMarks } from "./onboarding/CoachMarks";
import { toDateKey, uid } from "./utils/date";
import { toMonthKey } from "./utils/finance";
import { byPeriodAndTime } from "./utils/task";
import { seedTasks, seedCaptures, seedBoards, seedGoals } from "./data/seed";

export default function LitApp() {
  const todayKey = toDateKey();
  const [theme, setTheme] = useState("light"); // "light" | "dark" | "system"
  const [sysDark, setSysDark] = useState(() => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false));
  useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setSysDark(e.matches);
    m.addEventListener ? m.addEventListener("change", fn) : m.addListener(fn);
    return () => { m.removeEventListener ? m.removeEventListener("change", fn) : m.removeListener(fn); };
  }, []);
  const dark = theme === "dark" || (theme === "system" && sysDark);
  applyTheme(dark); /* must run before anything below renders */
  const [profile, setProfile] = useState({ name: "Debora", email: "debora@lit.app" });
  const [profileOpen, setProfileOpen] = useState(false);
  const [onboarded, setOnboarded] = useState(false); /* first login → walkthrough shows once */
  const [coachStep, setCoachStep] = useState(-1); /* -1 = welcome brand moment, 0+ = pointer tour */
  const [tab, setTab] = useState("today");
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [tasks, setTasks] = useState(() => seedTasks(todayKey));
  const [captures, setCaptures] = useState(seedCaptures);
  const [boards, setBoards] = useState(seedBoards);
  const [looseItems, setLooseItems] = useState([]);
  const [goals, setGoals] = useState(seedGoals);
  const [finance, setFinance] = useState({ income: null, extras: [], bills: [], expenses: [] });
  const [financeMonth, setFinanceMonth] = useState(() => toMonthKey());
  const [clearedDays, setClearedDays] = useState([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [editor, setEditor] = useState(null); // null | {initial?}
  const [detailId, setDetailId] = useState(null); // task id open in read-only detail
  const [toast, setToast] = useState(null);
  const [boardOpen, setBoardOpen] = useState(null);
  const toastTimer = useRef();

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  /* ----- derived ----- */
  const dayTasks = tasks.filter((t) => t.dateKey === selectedDay);
  const top3 = dayTasks.filter((t) => t.top3).sort(byPeriodAndTime);
  const rest = dayTasks.filter((t) => !t.top3);
  const doneTop3 = top3.filter((t) => t.done).length;

  /* streak: quiet, never resets — only pauses */
  useEffect(() => {
    if (selectedDay === todayKey && top3.length === 3 && doneTop3 === 3 && !clearedDays.includes(todayKey)) {
      setClearedDays((c) => [...c, todayKey]);
    }
  }, [doneTop3, top3.length, selectedDay, todayKey, clearedDays]);
  const streak = clearedDays.length;

  /* ----- task ops ----- */
  const saveTask = (data, existingId) => {
    if (existingId) {
      setTasks((ts) => ts.map((t) => (t.id === existingId ? { ...t, ...data } : t)));
    } else {
      setTasks((ts) => [...ts, { id: uid(), done: false, top3: false, ...data }]);
    }
    setEditor(null);
  };
  const toggleDone = (id) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const deleteTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const setTop3 = (id, val) => {
    setTasks((ts) => {
      const target = ts.find((t) => t.id === id);
      if (!target) return ts;
      if (val) {
        const count = ts.filter((t) => t.dateKey === target.dateKey && t.top3).length;
        if (count >= 3) return ts; /* 4th attempt: refused in silence — no error, no shake */
      }
      return ts.map((t) => (t.id === id ? { ...t, top3: val } : t));
    });
  };
  const moveTaskToDay = (id, dateKey) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, dateKey, top3: t.dateKey === dateKey ? t.top3 : false } : t)));

  /* ----- capture ops ----- */
  const addCapture = (c) => {
    setCaptures((cs) => [{ id: uid(), createdAt: Date.now(), ...c }, ...cs]);
    showToast(`Captured to Inbox · ${c.type}`);
  };
  const releaseCapture = (id) => setCaptures((cs) => cs.filter((c) => c.id !== id));
  const toggleListItem = (cid, ix) => setCaptures((cs) => cs.map((c) => {
    if (c.id !== cid) return c;
    const items = (c.items || []).map((it, i) => {
      const obj = typeof it === "string" ? { text: it, done: false } : it;
      return i === ix ? { ...obj, done: !obj.done } : obj;
    });
    return { ...c, items };
  }));
  const captureToTask = (c) => {
    setTasks((ts) => [...ts, { id: uid(), text: c.title || c.text, dateKey: todayKey, done: false, top3: false }]);
    releaseCapture(c.id);
    showToast("Moved to today · task");
  };
  const captureToVision = (c) => {
    const item = c.type === "image"
      ? { id: uid(), type: "image", content: c.imageUrl, tags: c.tags || [] }
      : c.type === "link"
        ? { id: uid(), type: "link", content: c.url, tags: c.tags || [] }
        : { id: uid(), type: "text", content: c.title || c.text, tags: c.tags || [] };
    setLooseItems((ls) => [item, ...ls]);
    releaseCapture(c.id);
    showToast("Moved to Vision — place it on a board when you like");
  };

  /* scroll locking lives inside each sheet (useBodyScrollLock) — never lock twice,
     or the outer cleanup restores "hidden" and the page stays frozen */

  /* tab changes slide in the direction of travel — same motion language as days/months */
  const TAB_ORDER = ["today", "vision", "finance", "goals"];
  const [tabSlide, setTabSlide] = useState(null); // {dir, k}
  const goTab = (t) => {
    if (t === tab) return;
    const dir = TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(tab) ? 1 : -1;
    setTab(t); setBoardOpen(null);
    setTabSlide({ dir, k: Date.now() });
  };

  /* ============================== render ============================== */
  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, display: "flex", justifyContent: "center", fontFamily: "'Inter','SF Pro Text',system-ui,sans-serif", color: T.ink, transition: "background .3s ease" }}>
      <GlobalStyle />

      <div style={{ width: "100%", maxWidth: 440, minHeight: "100vh", position: "relative", padding: "0 0 110px" }}>
        {!onboarded && (
          <CoachMarks step={coachStep} setStep={setCoachStep} tab={tab} goTab={goTab} onDone={() => setOnboarded(true)} />
        )}
        <div key={tabSlide ? tabSlide.k : tab}
          style={{ animation: tabSlide ? `${tabSlide.dir === 1 ? "slideFromRight" : "slideFromLeft"} .3s cubic-bezier(.3,.8,.4,1)` : undefined }}>
          {tab === "today" && (
            <TodayScreen {...{ tasks, top3, rest, doneTop3, selectedDay, setSelectedDay, todayKey, streak, captures, finance, goals, toggleDone, deleteTask, setTop3, moveTaskToDay, setEditor, setInboxOpen, setTab: goTab, openDetail: setDetailId, financeMonth, setFinanceMonth, profile, openProfile: () => setProfileOpen(true), dark, toggleTheme: () => setTheme(dark ? "light" : "dark") }} />
          )}
          {tab === "vision" && <VisionScreen {...{ boards, setBoards, looseItems, setLooseItems, boardOpen, setBoardOpen, showToast }} />}
          {tab === "finance" && <FinanceScreen {...{ finance, setFinance, mk: financeMonth, setMk: setFinanceMonth }} />}
          {tab === "goals" && <GoalsScreen {...{ goals, setGoals }} />}
        </div>

        {/* dock */}
        <Dock tab={tab} setTab={goTab} openInbox={() => setInboxOpen(true)} />

        {/* Inbox bottom sheet */}
        {inboxOpen && (
          <InboxSheet
            captures={captures} addCapture={addCapture} releaseCapture={releaseCapture} toggleListItem={toggleListItem}
            captureToTask={captureToTask} captureToVision={captureToVision}
            onSchedule={(c) => { setInboxOpen(false); setEditor({ initial: { text: c.title || c.text }, fromCaptureId: c.id }); }}
            onClose={() => setInboxOpen(false)} showToast={showToast}
          />
        )}

        {/* TaskEditor sheet */}
        {editor && (
          <TaskEditor
            initial={editor.initial} todayKey={todayKey}
            onSave={(data) => {
              saveTask(data, editor.initial?.id);
              if (editor.fromCaptureId) releaseCapture(editor.fromCaptureId);
            }}
            onToInbox={(text) => { addCapture({ type: "note", text, tags: [] }); setEditor(null); }}
            onClose={() => setEditor(null)}
          />
        )}

        {/* Profile & settings */}
        {profileOpen && (
          <SettingsSheet profile={profile} setProfile={setProfile} theme={theme} setTheme={setTheme}
            onClose={() => setProfileOpen(false)} showToast={showToast} />
        )}

        {/* Task detail — read-only; editing lives behind its own button */}
        {detailId && (() => {
          const t = tasks.find((x) => x.id === detailId);
          if (!t) { return null; }
          return (
            <TaskDetailSheet task={t}
              onEdit={() => { setDetailId(null); setEditor({ initial: t }); }}
              onToggleDone={() => toggleDone(t.id)}
              onClose={() => setDetailId(null)} />
          );
        })()}

        {/* toast — top, quiet */}
        {toast && (
          <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: T.ink, color: T.card, fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 100, boxShadow: T.shadow, zIndex: 200, animation: "toastIn .3s cubic-bezier(.34,1.3,.5,1)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.mint} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
