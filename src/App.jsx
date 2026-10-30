import { useCallback, useEffect, useRef, useState } from "react";
import { T, applyTheme } from "./theme";
import { GlobalStyle } from "./components/GlobalStyle";
import { Dock } from "./components/Dock";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { Ic } from "./icons/Icons";
import { TodayScreen } from "./screens/TodayScreen";
import { VisionScreen } from "./screens/VisionScreen";
import { FinanceScreen } from "./screens/FinanceScreen";
import { GoalsScreen } from "./screens/GoalsScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { InboxSheet } from "./sheets/InboxSheet";
import { TaskEditor } from "./sheets/TaskEditor";
import { SettingsSheet } from "./sheets/SettingsSheet";
import { TaskDetailSheet } from "./sheets/TaskDetailSheet";
import { ListEditorSheet } from "./sheets/ListEditorSheet";
import { CoachMarks } from "./onboarding/CoachMarks";
import { useAuth } from "./hooks/useAuth";
import { useNotifications } from "./hooks/useNotifications";
import { useAppBadge } from "./hooks/useAppBadge";
import { NotificationBadge } from "./components/NotificationBadge";
import { Spinner } from "./components/Spinner";
import { toDateKey, uid } from "./utils/date";
import { toMonthKey } from "./utils/finance";
import { byPeriodAndTime, isListDone } from "./utils/task";
import * as db from "./lib/db";

const ONBOARDED_KEY = "lit_onboarded";
const THEME_KEY = "lit_theme";

/* a real loading indicator, not the brand mark — the halo alone reads as a
   spinner before it reads as a logo, which is exactly the mixup to avoid */
function LoadingScreen() {
  return (
    <div className="full-screen-center" style={{ background: T.pageBg, display: "grid", placeItems: "center" }}>
      <div className="rise"><Spinner size={28} /></div>
    </div>
  );
}

export default function LitApp() {
  const { user, loading: authLoading, sendOtp, verifyOtp, signOut, deleteAccount } = useAuth();

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
  const isDesktop = useMediaQuery("(min-width: 900px)");

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
  const [editingListCaptureId, setEditingListCaptureId] = useState(null); // capture id open in the list editor, reached from a scheduled task's pencil
  const [toast, setToast] = useState(null); // null | { msg, action? }
  const [boardOpen, setBoardOpen] = useState(null);
  const toastTimer = useRef();
  const deleteUndoRef = useRef(null); // { capture, timer } while a deleted Inbox item's Undo window is open
  const goalDeleteUndoRef = useRef(null); // { goal, timer } while a deleted goal's Undo window is open
  /* moveVisionItem's toast "Undo" button calls moveVisionItem again, but
     only after the user reads the toast — by then several renders may have
     passed. A plain closure over `boards`/`looseItems` from the render that
     created the toast would see that render's snapshot (item still on its
     original board, pre-optimistic-update), so the undo's own from === to
     check would wrongly short-circuit and do nothing. These refs always
     hold the latest state, independent of which render's closure reads them. */
  const boardsRef = useRef(boards); boardsRef.current = boards;
  const looseItemsRef = useRef(looseItems); looseItemsRef.current = looseItems;

  /* opts.action adds an inline Undo-style link to the toast; opts.duration
     overrides the default auto-dismiss time (used for the longer
     delete-undo window below). Existing callers that just pass a string
     are unaffected. */
  const showToast = useCallback((msg, opts) => {
    setToast({ msg, action: opts?.action });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), opts?.duration ?? 2400);
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
  /* a scheduled list's completion is derived straight from its items on
     every render, never trusted from the stored tasks.done copy alone —
     the ring and every main checkbox read this, so a list can't get stuck
     "not done" because the sync write to the DB failed, was never run, or
     the row predates this logic entirely (tasks.done is still written
     whenever a list's items change — see applyListItemsChange — purely so
     any other reader of the DB sees the same thing; the UI itself never
     depends on that write having succeeded). A zero-item list has no
     items to derive from, so it keeps whatever `done` is actually stored
     — it's a plain, directly-toggled task at that point. */
  const captureById = new Map(captures.map((c) => [c.id, c]));
  const effectiveTasks = tasks.map((t) => {
    if (!t.captureId) return t;
    const capture = captureById.get(t.captureId);
    if (capture?.type !== "list") return t;
    const items = capture.items || [];
    if (items.length === 0) return t;
    return { ...t, done: isListDone(items) };
  });
  const dayTasks = effectiveTasks.filter((t) => t.dateKey === selectedDay);
  const top3 = dayTasks.filter((t) => t.top3).sort(byPeriodAndTime);
  const rest = dayTasks.filter((t) => !t.top3);
  const doneTop3 = top3.filter((t) => t.done).length;

  /* a capture stops showing up in the Inbox the moment some task links back
     to it (t.captureId) — scheduled, not deleted. This is computed from the
     link itself, never stored as a second "scheduled" flag on the capture,
     so it can't drift out of sync with what's actually scheduled. */
  const scheduledCaptureIds = new Set(tasks.filter((t) => t.captureId).map((t) => t.captureId));
  const inboxCaptures = captures.filter((c) => !scheduledCaptureIds.has(c.id));

  /* streak: quiet, never resets — only pauses */
  useEffect(() => {
    if (dataLoaded && selectedDay === todayKey && top3.length === 3 && doneTop3 === 3 && !clearedDays.includes(todayKey)) {
      setClearedDays((c) => [...c, todayKey]);
      db.dbInsertClearedDay(user.id, todayKey).catch(console.error);
    }
  }, [doneTop3, top3.length, selectedDay, todayKey, clearedDays, dataLoaded, user]);
  const streak = clearedDays.length;

  useNotifications(effectiveTasks);
  useAppBadge(inboxCaptures.length);

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
  /* dragging a task onto the Inbox trigger: same idea as clearing the date
     in the editor, reached by drag instead — the task loses its date and
     becomes a plain capture. Reuses addCapture/deleteTask so the Supabase
     sync (insert capture, delete task) stays in one place. */
  const taskToInbox = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    addCapture({ type: "note", text: t.text, tags: [] });
    deleteTask(id);
    showToast("Moved to Inbox");
  };

  /* ----- capture ops -----
     Every write here is optimistic (local state updates before Supabase
     confirms), so every one of them rolls the optimistic change back and
     tells the person calmly if the Supabase call actually fails — a
     capture that only "saved" locally and silently vanishes on next
     reload (no error, no trace) is worse than a visible failure. */
  const addCapture = (c, onSaved) => {
    const temp = { id: uid(), createdAt: Date.now(), ...c };
    setCaptures((cs) => [temp, ...cs]);
    showToast(`Captured to Inbox · ${c.type}`);
    db.dbInsertCapture(user.id, temp).then((real) => {
      setCaptures((cs) => cs.map((x) => (x.id === temp.id ? real : x)));
      onSaved?.(real);
    }).catch((e) => {
      console.error(e);
      setCaptures((cs) => cs.filter((x) => x.id !== temp.id));
      showToast("Couldn't save that to the cloud — please try again");
    });
  };
  const releaseCapture = (id) => {
    const prev = captures.find((c) => c.id === id);
    setCaptures((cs) => cs.filter((c) => c.id !== id));
    db.dbDeleteCapture(id).catch((e) => {
      console.error(e);
      if (prev) setCaptures((cs) => [prev, ...cs]);
      showToast("Couldn't delete that — please try again");
    });
  };
  /* the Inbox trash button's delete — same end effect as releaseCapture
     (removed locally, deleted in Supabase) but given a 5s grace window
     with a toast "Undo" instead of deleting the instant it's tapped, so a
     mis-tap isn't destructive. If a second delete happens while one is
     still pending, the first one is committed immediately rather than
     silently dropped — there's only ever one toast on screen at a time. */
  const deleteCapture = (c) => {
    if (deleteUndoRef.current) {
      clearTimeout(deleteUndoRef.current.timer);
      db.dbDeleteCapture(deleteUndoRef.current.capture.id).catch(console.error);
    }
    setCaptures((cs) => cs.filter((x) => x.id !== c.id));
    const timer = setTimeout(() => {
      deleteUndoRef.current = null;
      db.dbDeleteCapture(c.id).catch(console.error);
    }, 5000);
    deleteUndoRef.current = { capture: c, timer };
    showToast("Deleted ·", {
      duration: 5000,
      action: () => {
        clearTimeout(timer);
        deleteUndoRef.current = null;
        setCaptures((cs) => [c, ...cs]);
      },
    });
  };
  /* a scheduled list's done-state is derived from its items, never set
     directly — the main checkbox only ever reflects it (see TaskCard). So
     every write that can change a list's items also recomputes its linked
     task(s)' `done` here and carries both to the server in the one
     set_capture_items_and_sync_done call, with one combined rollback if
     that call fails. A capture with no task scheduled from it (still
     sitting in the Inbox) has no linked task, so this is a no-op on the
     tasks side for it — same items edit, same code path either way. */
  const applyListItemsChange = (cid, items, { title } = {}) => {
    const prevCapture = captures.find((c) => c.id === cid);
    if (!prevCapture) return;
    const linkedTasks = tasks.filter((t) => t.captureId === cid);
    const prevDoneByTaskId = new Map(linkedTasks.map((t) => [t.id, t.done]));
    /* a zero-item list has no derived state of its own — it's a normal
       task, toggled directly — so going to zero items must leave whatever
       `done` the task already had alone instead of forcing it open. */
    const shouldSyncDone = items.length > 0 && linkedTasks.length > 0;
    const nextDone = shouldSyncDone ? isListDone(items) : null;

    setCaptures((cs) => cs.map((c) => (c.id === cid ? { ...c, items, ...(title !== undefined ? { title } : {}) } : c)));
    if (shouldSyncDone) setTasks((ts) => ts.map((t) => (t.captureId === cid ? { ...t, done: nextDone } : t)));

    const save = title !== undefined ? db.dbSaveListEdits(cid, title, items) : db.dbSetListItems(cid, items);
    save.catch((e) => {
      console.error(e);
      setCaptures((cs) => cs.map((c) => (c.id === cid ? prevCapture : c)));
      if (shouldSyncDone) setTasks((ts) => ts.map((t) => (prevDoneByTaskId.has(t.id) ? { ...t, done: prevDoneByTaskId.get(t.id) } : t)));
      showToast("Couldn't save that change — please try again");
    });
  };
  const toggleListItem = (cid, ix) => {
    const capture = captures.find((c) => c.id === cid);
    if (!capture) return;
    const items = (capture.items || []).map((it, i) => {
      const obj = typeof it === "string" ? { text: it, done: false } : it;
      return i === ix ? { ...obj, done: !obj.done } : obj;
    });
    applyListItemsChange(cid, items);
  };
  const updateCapture = (id, changes) => {
    const prev = captures.find((c) => c.id === id);
    if (!prev) return;
    if (changes.items !== undefined) {
      applyListItemsChange(id, changes.items, changes.title !== undefined ? { title: changes.title } : {});
      return;
    }
    setCaptures((cs) => cs.map((c) => (c.id === id ? { ...c, ...changes } : c)));
    db.dbUpdateCapture(id, changes).catch((e) => {
      console.error(e);
      setCaptures((cs) => cs.map((c) => (c.id === id ? prev : c)));
      showToast("Couldn't save that change — please try again");
    });
  };
  /* fetches an Open Graph preview for a "link" capture (server-side —
     browsers can't read another site's HTML) and caches it onto the row.
     Best-effort: on failure the capture just keeps showing its plain URL,
     which is already the correct fallback, so no toast here. */
  const fetchLinkPreview = (captureId, url) => {
    db.fetchLinkPreview(url).then((preview) => {
      setCaptures((cs) => cs.map((c) => (c.id === captureId
        ? { ...c, previewTitle: preview.title, previewImage: preview.image, previewSite: preview.site }
        : c)));
      db.dbUpdateCapture(captureId, {
        preview_title: preview.title ?? null,
        preview_image: preview.image ?? null,
        preview_site: preview.site ?? null,
        preview_fetched_at: new Date().toISOString(),
      }).catch(console.error);
    }).catch(console.error);
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
    const prevLoose = looseItems, prevBoards = boards;
    setLooseItems((ls) => ls.filter((i) => i.id !== itemId));
    setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, items: [item, ...b.items] } : b)));
    db.dbMoveVisionItem(itemId, boardId).catch((e) => {
      console.error(e);
      setLooseItems(prevLoose); setBoards(prevBoards);
      showToast("Couldn't save that — please try again");
    });
  };
  const createBoard = (name, color) => {
    const temp = { id: uid(), name, color, coverUrl: null, items: [], position: Date.now() };
    setBoards((bs) => [...bs, temp]);
    db.dbInsertBoard(user.id, temp).then((real) => {
      setBoards((bs) => bs.map((b) => (b.id === temp.id ? { ...real, items: b.items } : b)));
    }).catch(console.error);
  };
  const reorderBoards = (from, to) => {
    const prev = boards;
    const arr = [...boards];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    const base = Date.now();
    const withPositions = arr.map((b, i) => ({ ...b, position: base + i }));
    setBoards(withPositions);
    db.dbUpdateBoardPositions(user.id, withPositions).catch((e) => {
      console.error(e);
      setBoards(prev);
      showToast("Couldn't save the new order — please try again");
    });
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
    const prev = boards;
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    const items = [...board.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    const base = Date.now();
    const withPositions = items.map((it, i) => ({ ...it, position: base - i }));
    setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, items: withPositions } : b)));
    db.dbUpdateVisionItemPositions(user.id, withPositions, boardId).catch((e) => {
      console.error(e);
      setBoards(prev);
      showToast("Couldn't save the new order — please try again");
    });
  };
  /* moves an item between boards, or to/from the loose tray (targetBoardId
     null = loose). Used by board-view drag/menu "move out" and "move to",
     and by dragging an item onto the top "move out of this board" zone —
     never by placeOnBoard, which stays the loose-tray-specific, simpler
     path (no source board to find). */
  const moveVisionItem = (itemId, targetBoardId) => {
    const boardsNow = boardsRef.current, looseNow = looseItemsRef.current;
    let item = null, sourceBoardId = null;
    for (const b of boardsNow) {
      const hit = b.items.find((i) => i.id === itemId);
      if (hit) { item = hit; sourceBoardId = b.id; break; }
    }
    if (!item) item = looseNow.find((i) => i.id === itemId) || null;
    if (!item || sourceBoardId === targetBoardId) return;
    const prevBoards = boardsNow, prevLoose = looseNow;
    setBoards((bs) => bs.map((b) => ({ ...b, items: b.items.filter((i) => i.id !== itemId) })));
    setLooseItems((ls) => ls.filter((i) => i.id !== itemId));
    if (targetBoardId) setBoards((bs) => bs.map((b) => (b.id === targetBoardId ? { ...b, items: [item, ...b.items] } : b)));
    else setLooseItems((ls) => [item, ...ls]);
    const destLabel = targetBoardId ? (boardsNow.find((b) => b.id === targetBoardId)?.name || "board") : "Not on a board yet";
    db.dbMoveVisionItem(itemId, targetBoardId).then(() => {
      showToast(`Moved to ${destLabel} ·`, { duration: 5000, action: () => moveVisionItem(itemId, sourceBoardId) });
    }).catch((e) => {
      console.error(e);
      setBoards(prevBoards); setLooseItems(prevLoose);
      showToast("Couldn't save that — please try again");
    });
  };
  const editVisionItem = (id, changes) => {
    setBoards((bs) => bs.map((b) => ({ ...b, items: b.items.map((i) => (i.id === id ? { ...i, ...changes } : i)) })));
    db.dbUpdateVisionItem(id, changes).catch(console.error);
  };
  const addImageToBoard = (boardId, dataUrl) => {
    const item = { id: uid(), type: "image", content: dataUrl, tags: [] };
    setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, items: [item, ...b.items] } : b)));
    db.dbInsertVisionItem(user.id, item, boardId, Date.now()).then((real) => {
      setBoards((bs) => bs.map((b) => (b.id === boardId ? { ...b, items: b.items.map((i) => (i.id === item.id ? real : i)) } : b)));
    }).catch(console.error);
  };
  const addItemToBoard = (boardId, item) => {
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
  const editMilestone = (goalId, mid, text) => {
    setGoals((gs) => gs.map((g) => (g.id === goalId ? { ...g, milestones: g.milestones.map((m) => (m.id === mid ? { ...m, text } : m)) } : g)));
    db.dbUpdateMilestone(mid, { text }).catch(console.error);
  };
  const createGoal = ({ title, targetDate, milestones }) => {
    const temp = { id: uid(), title, targetDate, milestones: milestones.map((text) => ({ id: uid(), text, done: false })) };
    setGoals((gs) => [...gs, temp]);
    db.dbInsertGoal(user.id, temp).then((real) => {
      setGoals((gs) => gs.map((g) => (g.id === temp.id ? real : g)));
    }).catch(console.error);
  };
  /* same grace-window delete as the Inbox trash (deleteCapture below): the
     goal (and, via milestones.goal_id's on-delete-cascade, its milestones)
     leaves local state immediately — card collapses, "At a glance" and any
     other view computed from `goals` just stop seeing it, nothing else in
     the app stores a goal id to go stale — but the actual Supabase delete
     only fires once the 5s toast expires without an Undo. Undo is just
     splicing the in-memory snapshot back at its original index, never a
     re-fetch or a re-create. */
  const deleteGoal = (id) => {
    const ix = goals.findIndex((g) => g.id === id);
    if (ix === -1) return;
    const g = goals[ix];
    if (goalDeleteUndoRef.current) {
      clearTimeout(goalDeleteUndoRef.current.timer);
      db.dbDeleteGoal(goalDeleteUndoRef.current.goal.id).catch(console.error);
    }
    setGoals((gs) => gs.filter((x) => x.id !== id));
    const timer = setTimeout(() => {
      goalDeleteUndoRef.current = null;
      db.dbDeleteGoal(id).catch(console.error);
    }, 5000);
    goalDeleteUndoRef.current = { goal: g, timer };
    showToast("Goal deleted ·", {
      duration: 5000,
      action: () => {
        clearTimeout(timer);
        goalDeleteUndoRef.current = null;
        setGoals((gs) => {
          const copy = [...gs];
          copy.splice(Math.min(ix, copy.length), 0, g);
          return copy;
        });
      },
    });
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
  /* GlobalStyle has to be mounted here too, not just in the main return below —
     these are the screens shown BEFORE that return is ever reached, and without
     it every className this file and its children use (fonts, animations, the
     fixed-position/height rules these screens rely on to fill the viewport)
     silently does nothing. That's what broke the sign-in screen last time. */
  if (authLoading) return <><GlobalStyle /><LoadingScreen /></>;
  if (!user) return <><GlobalStyle /><SignInScreen onSendCode={sendOtp} onVerifyCode={verifyOtp} /></>;
  if (!dataLoaded) return <><GlobalStyle /><LoadingScreen /></>;

  /* ============================== render ============================== */
  const mainContent = (
    <div key={tabSlide ? tabSlide.k : tab}
      style={{ animation: tabSlide ? `${tabSlide.dir === 1 ? "slideFromRight" : "slideFromLeft"} .3s cubic-bezier(.3,.8,.4,1)` : undefined }}>
      {tab === "today" && (
        <TodayScreen {...{ tasks: effectiveTasks, top3, rest, doneTop3, selectedDay, setSelectedDay, todayKey, streak, finance, goals, toggleDone, deleteTask, setTop3, moveTaskToDay, taskToInbox, setEditor, setTab: goTab, openDetail: setDetailId, financeMonth, setFinanceMonth, profile, captures, toggleListItem, onEditList: setEditingListCaptureId }} />
      )}
      {tab === "vision" && (
        <VisionScreen {...{ boards, looseItems, boardOpen, setBoardOpen, showToast,
          onAddLooseItem: addLooseItem, onPlaceOnBoard: placeOnBoard, onCreateBoard: createBoard, onUpdateBoard: updateBoard,
          onDeleteBoard: deleteBoard, onDeleteVisionItem: deleteVisionItem, onReorderBoardItems: reorderBoardItems, onReorderBoards: reorderBoards,
          onMoveVisionItem: moveVisionItem, onAddImageToBoard: addImageToBoard, onPinCover: pinCover, onEditVisionItem: editVisionItem, onAddItemToBoard: addItemToBoard }} />
      )}
      {tab === "finance" && (
        <FinanceScreen {...{ finance, mk: financeMonth, setMk: setFinanceMonth,
          onSetIncome: setIncome, onTogglePaid: togglePaid, onAddExtra: addExtra, onAddBill: addBill,
          onAddExpense: addExpense, onCarryExpenses: carryExpenses }} />
      )}
      {tab === "goals" && (
        <GoalsScreen {...{ goals, onToggleMilestone: toggleMilestone, onAddMilestone: addMilestone, onEditMilestone: editMilestone, onCreateGoal: createGoal, onDeleteGoal: deleteGoal, setEditor }} />
      )}
    </div>
  );

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: T.pageBg, display: "flex", justifyContent: "center", fontFamily: "'Inter','SF Pro Text',system-ui,sans-serif", color: T.ink, transition: "background .3s ease" }}>
      <GlobalStyle />

      {isDesktop ? (
        <div style={{ display: "flex", width: "100%", maxWidth: 1160, minHeight: "100vh" }}>
          <Sidebar tab={tab} setTab={goTab}
            dark={dark} toggleTheme={() => setTheme(dark ? "light" : "dark")} profile={profile} openProfile={() => setProfileOpen(true)} />

          {/* Capture: a small, quiet icon in the corner — not a glowing pill
              fighting the sidebar for attention. Fixed to the viewport corner,
              sitting in the content column's own top padding, so it never
              collides with a screen's own header row (e.g. Vision's board view). */}
          <button data-coach="inbox" data-drop="inbox" onClick={() => setInboxOpen(true)} aria-label="Open Inbox" className="pressable"
            style={{ position: "fixed", top: 28, right: 40, zIndex: 45, width: 40, height: 40, borderRadius: 13, background: T.card, border: `1px solid ${T.stroke}`, boxShadow: T.shadowSm, display: "grid", placeItems: "center", cursor: "pointer" }}>
            {Ic.tray(T.ink2)}
            <NotificationBadge count={inboxCaptures.length} size={19} />
          </button>

          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 48px 80px" }}>
              {!onboarded && <CoachMarks step={coachStep} setStep={setCoachStep} tab={tab} goTab={goTab} onDone={finishOnboarding} />}
              {mainContent}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 440, minHeight: "100vh", position: "relative", padding: "0 0 110px" }}>
          <TopBar dark={dark} toggleTheme={() => setTheme(dark ? "light" : "dark")} profile={profile} openProfile={() => setProfileOpen(true)} />
          {!onboarded && <CoachMarks step={coachStep} setStep={setCoachStep} tab={tab} goTab={goTab} onDone={finishOnboarding} />}
          {mainContent}
          <Dock tab={tab} setTab={goTab} openInbox={() => setInboxOpen(true)} unreadCount={inboxCaptures.length} />
        </div>
      )}

      {/* sheets, modals, toast — identical regardless of layout; Sheet itself
          adapts from bottom-sheet (mobile) to centered modal (desktop) */}
      <>
        {inboxOpen && (
          <InboxSheet
            captures={inboxCaptures} addCapture={addCapture} releaseCapture={deleteCapture} toggleListItem={toggleListItem} updateCapture={updateCapture}
            captureToVision={captureToVision} fetchLinkPreview={fetchLinkPreview}
            onSchedule={(c) => {
              setInboxOpen(false);
              /* same fallback chain as the capture's own display label
                 (CaptureRow) — a link capture usually has no title/text at
                 all, only a url, and the pre-filled title must never come
                 up empty: TaskEditor silently refuses to save an empty
                 title, so Schedule would otherwise do nothing for it. */
              setEditor({ initial: { text: c.title || c.text || c.url || "Image" }, fromCaptureId: c.id });
            }}
            onClose={() => setInboxOpen(false)} showToast={showToast}
          />
        )}

        {/* TaskEditor sheet */}
        {editor && (
          <TaskEditor
            initial={editor.initial} todayKey={todayKey}
            onSave={(data) => {
              /* Schedule: keep the capture as the task's single source of
                 truth for list items / link preview — link to it instead of
                 copying its title and deleting it. editor.initial?.captureId
                 covers re-editing an already-scheduled task (clearing the
                 date etc.), where the link must be preserved too. */
              const captureId = editor.fromCaptureId ?? editor.initial?.captureId ?? null;
              saveTask(captureId ? { ...data, captureId } : data, editor.initial?.id);
            }}
            onToInbox={(text) => {
              if (editor.initial?.captureId) {
                /* already backed by a capture — deleting the task severs the
                   link, and the original capture (with its items/url intact)
                   reappears in the Inbox on its own. Creating a second,
                   title-only capture here would just duplicate it. */
                deleteTask(editor.initial.id);
              } else {
                addCapture({ type: "note", text, tags: [] });
                /* editing an EXISTING task and clearing its date: the task
                   becomes a capture, so the original scheduled task must go —
                   otherwise it would exist twice (as a task and as a capture) */
                if (editor.initial?.id) deleteTask(editor.initial.id);
              }
              setEditor(null);
              showToast("Moved to Inbox");
            }}
            onClose={() => setEditor(null)}
          />
        )}

        {/* Profile & settings */}
        {profileOpen && (
          <SettingsSheet profile={profile} onSaveName={saveProfileName} onSignOut={signOut} onDeleteAccount={deleteAccount} theme={theme} setTheme={setTheme}
            onClose={() => setProfileOpen(false)} showToast={showToast} />
        )}

        {/* Task detail — read-only; editing lives behind its own button */}
        {detailId && (() => {
          const t = effectiveTasks.find((x) => x.id === detailId);
          if (!t) { return null; }
          return (
            <TaskDetailSheet task={t}
              onEdit={() => { setDetailId(null); setEditor({ initial: t }); }}
              onToggleDone={() => toggleDone(t.id)}
              onClose={() => setDetailId(null)} />
          );
        })()}

        {/* Editing a scheduled list's items — same sheet and same updateCapture
            the Inbox itself uses, operating on the one capture row that both
            views share. */}
        {editingListCaptureId && (() => {
          const capture = captures.find((c) => c.id === editingListCaptureId);
          if (!capture) { setEditingListCaptureId(null); return null; }
          return (
            <ListEditorSheet capture={capture}
              onSave={(changes) => { updateCapture(editingListCaptureId, changes); setEditingListCaptureId(null); }}
              onClose={() => setEditingListCaptureId(null)} />
          );
        })()}

        {/* toast — top, quiet */}
        {toast && (
          <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: T.ink, color: T.card, fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 100, boxShadow: T.shadow, zIndex: 10000, animation: "toastIn .3s cubic-bezier(.34,1.3,.5,1)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)" }}>
            {!toast.action && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.mint} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
            <span>{toast.msg}</span>
            {toast.action && (
              <button onClick={() => { clearTimeout(toastTimer.current); toast.action(); setToast(null); }}
                style={{ fontWeight: 700, color: T.mint, textDecoration: "underline", cursor: "pointer" }}>
                Undo
              </button>
            )}
          </div>
        )}
      </>
    </div>
  );
}
