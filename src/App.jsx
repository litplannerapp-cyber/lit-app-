import { useCallback, useEffect, useRef, useState } from "react";
import { T, applyTheme } from "./theme";
import { GlobalStyle } from "./components/GlobalStyle";
import { Dock } from "./components/Dock";
import { TopBar } from "./components/TopBar";
import { HaloMark } from "./icons/Icons";
import { TodayScreen } from "./screens/TodayScreen";
import { VisionScreen } from "./screens/VisionScreen";
import { FinanceScreen } from "./screens/FinanceScreen";
import { GoalsScreen } from "./screens/GoalsScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { InboxSheet } from "./sheets/InboxSheet";
import { TaskEditor } from "./sheets/TaskEditor";
import { SettingsSheet } from "./sheets/SettingsSheet";
import { TaskDetailSheet } from "./sheets/TaskDetailSheet";
import { CoachMarks } from "./onboarding/CoachMarks";
import { useAuth } from "./hooks/useAuth";
import { toDateKey, uid } from "./utils/date";
import { toMonthKey } from "./utils/finance";
import { byPeriodAndTime } from "./utils/task";
import * as db from "./lib/db";

const ONBOARDED_KEY = "lit_onboarded";
const THEME_KEY = "lit_theme";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, display: "grid", placeItems: "center" }}>
      <div className="rise"><HaloMark size={64} /></div>
    </div>
  );
}

export default function LitApp() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  const todayKey = toDateKey();
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light"); // "light" | "dark" | "system"
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);
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

  const [dataLoaded, setDataLoaded] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [onboarded, setOnboardedState] = useState(() => localStorage.getItem(ONBOARDED_KEY) === "true"); /* first login → walkthrough shows once, then persisted (localStorage for instant/offline-safe gating, Supabase profile for cross-device) */
  const [coachStep, setCoachStep] = useState(-1); /* -1 = welcome brand moment, 0+ = pointer tour */
  const [tab, setTab] = useState("today");
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [tasks, setTasks] = useState([]);
  const [captures, setCaptures] = useState([]);
  const [boards, setBoards] = useState([]);
  const [looseItems, setLooseItems] = useState([]);
  const [goals, setGoals] = useState([]);
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

  /* ----- load everything once signed in ----- */
  useEffect(() => {
    if (!user) { setDataLoaded(false); return; }
    let cancelled = false;
    (async () => {
      const defaultName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
      await db.ensureProfile(user.id, defaultName);
      const data = await db.fetchAll(user.id);
      if (cancelled) return;
      setProfileName(data.profile?.name || defaultName);
      const onboardedRemote = !!data.profile?.onboarded;
      if (onboardedRemote) localStorage.setItem(ONBOARDED_KEY, "true");
      /* trust either source — a device that already finished the tour should
         never see it again even if the Supabase write silently failed, and a
         fresh device picks it up from the account once fetchAll returns */
      setOnboardedState((prev) => prev || onboardedRemote);
      setTasks(data.tasks);
      setCaptures(data.captures);
      setBoards(data.boards);
      setLooseItems(data.looseItems);
      setGoals(data.goals);
      setFinance(data.finance);
      setClearedDays(data.clearedDays);
      setDataLoaded(true);
    })().catch((e) => { console.error(e); setDataLoaded(true); });
    return () => { cancelled = true; };
  }, [user]);

  const profile = { name: profileName, email: user?.email || "" };

  /* ----- derived ----- */
  const dayTasks = tasks.filter((t) => t.dateKey === selectedDay);
  const top3 = dayTasks.filter((t) => t.top3).sort(byPeriodAndTime);
  const rest = dayTasks.filter((t) => !t.top3);
  const doneTop3 = top3.filter((t) => t.done).length;

  /* streak: quiet, never resets — only pauses */
  useEffect(() => {
    if (dataLoaded && selectedDay === todayKey && top3.length === 3 && doneTop3 === 3 && !clearedDays.includes(todayKey)) {
      setClearedDays((c) => [...c, todayKey]);
      db.dbInsertClearedDay(user.id, todayKey).catch(console.error);
    }
  }, [doneTop3, top3.length, selectedDay, todayKey, clearedDays, dataLoaded, user]);
  const streak = clearedDays.length;

  /* ----- task ops ----- */
  const saveTask = (data, existingId) => {
    /* "Mark as priority" in the form is a real promotion to the day's Top 3,
       not just a cosmetic dot — same 3-slot rule and silent refusal as the
       star button on a task card. Unchecking it never demotes on its own;
       that stays the star/drag's job. */
    let top3;
    if (data.priority) {
      const occupied = tasks.filter((t) => t.dateKey === data.dateKey && t.top3 && t.id !== existingId).length;
      top3 = occupied < 3;
    } else if (existingId) {
      top3 = tasks.find((t) => t.id === existingId)?.top3 || false;
    } else {
      top3 = false;
    }

    if (existingId) {
      const merged = { ...tasks.find((t) => t.id === existingId), ...data, top3 };
      setTasks((ts) => ts.map((t) => (t.id === existingId ? merged : t)));
      db.dbReplaceTask(existingId, merged, user.id).catch(console.error);
    } else {
      const temp = { id: uid(), done: false, ...data, top3 };
      setTasks((ts) => [...ts, temp]);
      db.dbInsertTask(user.id, temp).then((real) => {
        setTasks((ts) => ts.map((t) => (t.id === temp.id ? real : t)));
      }).catch(console.error);
    }
    setEditor(null);
  };
  const toggleDone = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    db.dbUpdateTask(id, { done: !t.done }).catch(console.error);
  };
  const deleteTask = (id) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    db.dbDeleteTask(id).catch(console.error);
  };
  const setTop3 = (id, val) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    if (val) {
      const count = tasks.filter((t) => t.dateKey === target.dateKey && t.top3).length;
      if (count >= 3) return; /* 4th attempt: refused in silence — no error, no shake */
    }
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, top3: val } : t)));
    db.dbUpdateTask(id, { top3: val }).catch(console.error);
  };
  const moveTaskToDay = (id, dateKey) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextTop3 = target.dateKey === dateKey ? target.top3 : false;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, dateKey, top3: nextTop3 } : t)));
    db.dbUpdateTask(id, { date_key: dateKey, top3: nextTop3 }).catch(console.error);
  };

  /* ----- capture ops ----- */
  const addCapture = (c) => {
    const temp = { id: uid(), createdAt: Date.now(), ...c };
    setCaptures((cs) => [temp, ...cs]);
    showToast(`Captured to Inbox · ${c.type}`);
    db.dbInsertCapture(user.id, temp).then((real) => {
      setCaptures((cs) => cs.map((x) => (x.id === temp.id ? real : x)));
    }).catch(console.error);
  };
  const releaseCapture = (id) => {
    setCaptures((cs) => cs.filter((c) => c.id !== id));
    db.dbDeleteCapture(id).catch(console.error);
  };
  const toggleListItem = (cid, ix) => {
    const capture = captures.find((c) => c.id === cid);
    if (!capture) return;
    const items = (capture.items || []).map((it, i) => {
      const obj = typeof it === "string" ? { text: it, done: false } : it;
      return i === ix ? { ...obj, done: !obj.done } : obj;
    });
    setCaptures((cs) => cs.map((c) => (c.id === cid ? { ...c, items } : c)));
    db.dbUpdateCapture(cid, { items }).catch(console.error);
  };
  const updateCapture = (id, changes) => {
    setCaptures((cs) => cs.map((c) => (c.id === id ? { ...c, ...changes } : c)));
    db.dbUpdateCapture(id, changes).catch(console.error);
  };
  const captureToTask = (c) => {
    const temp = { id: uid(), text: c.title || c.text, dateKey: todayKey, done: false, top3: false };
    setTasks((ts) => [...ts, temp]);
    db.dbInsertTask(user.id, temp).then((real) => {
      setTasks((ts) => ts.map((t) => (t.id === temp.id ? real : t)));
    }).catch(console.error);
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
    db.dbInsertVisionItem(user.id, item, null, Date.now()).then((real) => {
      setLooseItems((ls) => ls.map((x) => (x.id === item.id ? real : x)));
    }).catch(console.error);
    releaseCapture(c.id);
    showToast("Moved to Vision — place it on a board when you like");
  };

  /* ----- vision (boards + loose items) ops ----- */
  const addLooseItem = (item) => {
    setLooseItems((ls) => [item, ...ls]);
    db.dbInsertVisionItem(user.id, item, null, Date.now()).then((real) => {
      setLooseItems((ls) => ls.map((x) => (x.id === item.id ? real : x)));
    }).catch(console.error);
  };
  const placeOnBoard = (itemId, boardId) => {
    const item = looseItems.find((i) => i.id === itemId);
    if (!item) return;
    setLooseItems((ls) => ls.filter((i) => i.id !== itemId));
    setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, items: [item, ...b.items] } : b)));
    db.dbMoveVisionItem(itemId, boardId).catch(console.error);
  };
  const createBoard = (name, color) => {
    const temp = { id: uid(), name, color, coverUrl: null, items: [] };
    setBoards((bs) => [...bs, temp]);
    db.dbInsertBoard(user.id, temp).then((real) => {
      setBoards((bs) => bs.map((b) => (b.id === temp.id ? { ...real, items: b.items } : b)));
    }).catch(console.error);
  };
  const updateBoard = (id, patch) => {
    setBoards((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const row = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.color !== undefined) row.color = patch.color;
    if (patch.coverUrl !== undefined) row.cover_url = patch.coverUrl;
    db.dbUpdateBoard(id, row).catch(console.error);
  };
  const deleteBoard = (id) => {
    const b = boards.find((x) => x.id === id);
    setBoards((bs) => bs.filter((x) => x.id !== id));
    if (b?.items.length) setLooseItems((ls) => [...b.items, ...ls]);
    db.dbDeleteBoard(id).catch(console.error); /* vision_items.board_id is ON DELETE SET NULL — they come back loose server-side too */
  };
  const deleteVisionItem = (id) => {
    setLooseItems((ls) => ls.filter((i) => i.id !== id));
    setBoards((bs) => bs.map((b) => ({ ...b, items: b.items.filter((i) => i.id !== id) })));
    db.dbDeleteVisionItem(id).catch(console.error);
  };
  const pinCover = (boardId, content) => {
    const board = boards.find((b) => b.id === boardId);
    const nextCover = board?.coverUrl === content ? null : content;
    setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, coverUrl: nextCover } : b)));
    db.dbUpdateBoard(boardId, { cover_url: nextCover }).catch(console.error);
  };
  const reorderBoardItems = (boardId, from, to) => {
    setBoards((bs) => bs.map((b) => {
      if (b.id !== boardId) return b;
      const items = [...b.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      const base = Date.now();
      db.dbUpdateVisionItemPositions(items.map((it, i) => ({ id: it.id, position: base - i }))).catch(console.error);
      return { ...b, items };
    }));
  };
  const moveVisionItem = (itemId, targetBoardId) => {
    let item = null;
    for (const b of boards) {
      const hit = b.items.find((i) => i.id === itemId);
      if (hit) { item = hit; break; }
    }
    if (!item) return;
    setBoards((bs) => bs.map((b) => ({ ...b, items: b.items.filter((i) => i.id !== itemId) })));
    if (targetBoardId) setBoards((bs) => bs.map((b) => (b.id === targetBoardId ? { ...b, items: [item, ...b.items] } : b)));
    else setLooseItems((ls) => [item, ...ls]);
    db.dbMoveVisionItem(itemId, targetBoardId).catch(console.error);
  };
  const addImageToBoard = (boardId, dataUrl) => {
    const item = { id: uid(), type: "image", content: dataUrl, tags: [] };
    setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, items: [item, ...b.items] } : b)));
    db.dbInsertVisionItem(user.id, item, boardId, Date.now()).then((real) => {
      setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, items: b.items.map((i) => (i.id === item.id ? real : i)) } : b)));
    }).catch(console.error);
  };

  /* ----- goals ops ----- */
  const toggleMilestone = (goalId, mid) => {
    const goal = goals.find((g) => g.id === goalId);
    const ms = goal?.milestones.find((m) => m.id === mid);
    if (!ms) return;
    setGoals((gs) => gs.map((g) => (g.id === goalId ? { ...g, milestones: g.milestones.map((m) => (m.id === mid ? { ...m, done: !m.done } : m)) } : g)));
    db.dbUpdateMilestone(mid, { done: !ms.done }).catch(console.error);
  };
  const addMilestone = (goalId, text) => {
    const temp = { id: uid(), text, done: false };
    setGoals((gs) => gs.map((g) => (g.id === goalId ? { ...g, milestones: [...g.milestones, temp] } : g)));
    db.dbInsertMilestone(user.id, goalId, text).then((real) => {
      setGoals((gs) => gs.map((g) => (g.id === goalId ? { ...g, milestones: g.milestones.map((m) => (m.id === temp.id ? real : m)) } : g)));
    }).catch(console.error);
  };
  const createGoal = ({ title, targetDate, milestones }) => {
    const temp = { id: uid(), title, targetDate, milestones: milestones.map((text) => ({ id: uid(), text, done: false })) };
    setGoals((gs) => [...gs, temp]);
    db.dbInsertGoal(user.id, temp).then((real) => {
      setGoals((gs) => gs.map((g) => (g.id === temp.id ? real : g)));
    }).catch(console.error);
  };

  /* ----- finance ops ----- */
  const setIncome = (income) => {
    setFinance((f) => ({ ...f, income }));
    db.dbSetIncome(user.id, income).catch(console.error);
  };
  const togglePaid = (bill) => {
    const patch = bill.recurring
      ? { paid_months: { ...(bill.paidMonths || {}), [financeMonth]: !bill.paidMonths?.[financeMonth] } }
      : { paid: !bill.paid };
    setFinance((f) => ({
      ...f,
      bills: f.bills.map((x) => x.id !== bill.id ? x
        : bill.recurring ? { ...x, paidMonths: { ...(x.paidMonths || {}), [financeMonth]: !x.paidMonths?.[financeMonth] } }
        : { ...x, paid: !x.paid }),
    }));
    db.dbUpdateBillPaid(bill.id, bill.recurring, patch).catch(console.error);
  };
  const addExtra = (extra) => {
    const temp = { id: uid(), ...extra };
    setFinance((f) => ({ ...f, extras: [...f.extras, temp] }));
    db.dbInsertExtra(user.id, temp).then((real) => {
      setFinance((f) => ({ ...f, extras: f.extras.map((e) => (e.id === temp.id ? real : e)) }));
    }).catch(console.error);
  };
  const addBill = (bill) => {
    const temp = { id: uid(), ...bill, ...(bill.recurring ? { paidMonths: {} } : { paid: false }) };
    setFinance((f) => ({ ...f, bills: [...f.bills, temp] }));
    db.dbInsertBill(user.id, temp).then((real) => {
      setFinance((f) => ({ ...f, bills: f.bills.map((b) => (b.id === temp.id ? real : b)) }));
    }).catch(console.error);
  };
  const addExpense = (expense) => {
    const key = expense.name.trim().toLowerCase();
    const existing = finance.expenses.find((e) => e.monthKey === expense.monthKey && e.name.toLowerCase() === key);
    if (existing) {
      const updated = { ...existing, amount: existing.amount + expense.amount, count: (existing.count || 1) + 1 };
      setFinance((f) => ({ ...f, expenses: f.expenses.map((e) => (e.id === existing.id ? updated : e)) }));
      db.dbUpdateExpense(existing.id, { amount: updated.amount, count: updated.count }).catch(console.error);
    } else {
      const temp = { id: uid(), ...expense, count: 1 };
      setFinance((f) => ({ ...f, expenses: [...f.expenses, temp] }));
      db.dbInsertExpense(user.id, temp).then((real) => {
        setFinance((f) => ({ ...f, expenses: f.expenses.map((e) => (e.id === temp.id ? real : e)) }));
      }).catch(console.error);
    }
  };
  const carryExpenses = (expensesToCarry, nextMk, fromMk) => {
    const temps = expensesToCarry.map((e) => ({ ...e, id: uid(), monthKey: nextMk, carriedFrom: fromMk }));
    setFinance((f) => ({ ...f, expenses: [...f.expenses, ...temps] }));
    temps.forEach((t) => {
      db.dbInsertExpense(user.id, t).then((real) => {
        setFinance((f) => ({ ...f, expenses: f.expenses.map((e) => (e.id === t.id ? real : e)) }));
      }).catch(console.error);
    });
  };

  /* ----- profile / onboarding ops ----- */
  const saveProfileName = (name) => {
    setProfileName(name);
    db.saveProfileName(user.id, name).catch(console.error);
  };
  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setOnboardedState(true);
    db.saveOnboarded(user.id, true).catch(console.error);
  };

  /* tab changes slide in the direction of travel — same motion language as days/months */
  const TAB_ORDER = ["today", "vision", "finance", "goals"];
  const [tabSlide, setTabSlide] = useState(null); // {dir, k}
  const goTab = (t) => {
    if (t === tab) return;
    const dir = TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(tab) ? 1 : -1;
    setTab(t); setBoardOpen(null);
    setTabSlide({ dir, k: Date.now() });
  };

  /* ============================== auth gate ============================== */
  if (authLoading) return <LoadingScreen />;
  if (!user) return <SignInScreen onSignIn={signInWithGoogle} />;
  if (!dataLoaded) return <LoadingScreen />;

  /* ============================== render ============================== */
  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, display: "flex", justifyContent: "center", fontFamily: "'Inter','SF Pro Text',system-ui,sans-serif", color: T.ink, transition: "background .3s ease" }}>
      <GlobalStyle />

      <div style={{ width: "100%", maxWidth: 440, minHeight: "100vh", position: "relative", padding: "0 0 110px" }}>
        <TopBar dark={dark} toggleTheme={() => setTheme(dark ? "light" : "dark")} profile={profile} openProfile={() => setProfileOpen(true)} />
        {!onboarded && (
          <CoachMarks step={coachStep} setStep={setCoachStep} tab={tab} goTab={goTab} onDone={finishOnboarding} />
        )}
        <div key={tabSlide ? tabSlide.k : tab}
          style={{ animation: tabSlide ? `${tabSlide.dir === 1 ? "slideFromRight" : "slideFromLeft"} .3s cubic-bezier(.3,.8,.4,1)` : undefined }}>
          {tab === "today" && (
            <TodayScreen {...{ tasks, top3, rest, doneTop3, selectedDay, setSelectedDay, todayKey, streak, captures, finance, goals, toggleDone, deleteTask, setTop3, moveTaskToDay, setEditor, setInboxOpen, setTab: goTab, openDetail: setDetailId, financeMonth, setFinanceMonth, profile }} />
          )}
          {tab === "vision" && (
            <VisionScreen {...{ boards, looseItems, boardOpen, setBoardOpen, showToast,
              onAddLooseItem: addLooseItem, onPlaceOnBoard: placeOnBoard, onCreateBoard: createBoard, onUpdateBoard: updateBoard,
              onDeleteBoard: deleteBoard, onDeleteVisionItem: deleteVisionItem, onReorderBoardItems: reorderBoardItems,
              onMoveVisionItem: moveVisionItem, onAddImageToBoard: addImageToBoard, onPinCover: pinCover }} />
          )}
          {tab === "finance" && (
            <FinanceScreen {...{ finance, mk: financeMonth, setMk: setFinanceMonth,
              onSetIncome: setIncome, onTogglePaid: togglePaid, onAddExtra: addExtra, onAddBill: addBill,
              onAddExpense: addExpense, onCarryExpenses: carryExpenses }} />
          )}
          {tab === "goals" && (
            <GoalsScreen {...{ goals, onToggleMilestone: toggleMilestone, onAddMilestone: addMilestone, onCreateGoal: createGoal }} />
          )}
        </div>

        {/* dock */}
        <Dock tab={tab} setTab={goTab} openInbox={() => setInboxOpen(true)} />

        {/* Inbox bottom sheet */}
        {inboxOpen && (
          <InboxSheet
            captures={captures} addCapture={addCapture} releaseCapture={releaseCapture} toggleListItem={toggleListItem} updateCapture={updateCapture}
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
          <SettingsSheet profile={profile} onSaveName={saveProfileName} onSignOut={signOut} theme={theme} setTheme={setTheme}
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
