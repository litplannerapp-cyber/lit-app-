import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

const GENERIC_MORNING_ID = 900001;
const GENERIC_EVENING_ID = 900002;

/* LocalNotifications ids must be 32-bit ints; task ids are Supabase uuids
   (or short base36 strings before the round-trip), so hash them into one. */
const idForTask = (taskId) => {
  let h = 0;
  for (let i = 0; i < taskId.length; i++) h = (Math.imul(31, h) + taskId.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
};

const fireAt = (dateKey, time) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};

async function requestPermission() {
  if (isNative) {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") await LocalNotifications.requestPermissions();
  } else if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

async function showWebNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, { body });
  } else {
    new Notification(title, { body });
  }
}

/* Web has no true background scheduling without a push server, so this only
   fires while the tab stays open — native uses @capacitor/local-notifications
   instead, which keeps firing even with the app closed. */
const webTimers = new Map(); // id -> timeoutId
const MAX_TIMEOUT = 2 ** 31 - 1;

function scheduleWeb(id, when, title, body) {
  cancelWeb(id);
  const ms = when.getTime() - Date.now();
  if (ms <= 0 || ms > MAX_TIMEOUT) return;
  const timer = setTimeout(() => { webTimers.delete(id); showWebNotification(title, body); }, ms);
  webTimers.set(id, timer);
}
function cancelWeb(id) {
  const timer = webTimers.get(id);
  if (timer) { clearTimeout(timer); webTimers.delete(id); }
}

function nextOccurrence(hour, minute) {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}
function scheduleNextGenericWeb(hour, minute, title, body, id) {
  const when = nextOccurrence(hour, minute);
  cancelWeb(id);
  const timer = setTimeout(() => {
    webTimers.delete(id);
    showWebNotification(title, body);
    scheduleNextGenericWeb(hour, minute, title, body, id); // chain into the next day
  }, when.getTime() - Date.now());
  webTimers.set(id, timer);
}

function scheduleGenericReminders() {
  if (isNative) {
    import("@capacitor/local-notifications").then(({ LocalNotifications }) => LocalNotifications.schedule({
      notifications: [
        { id: GENERIC_MORNING_ID, title: "Good morning", body: "Plan your day with Lit.", schedule: { on: { hour: 8, minute: 0 }, repeats: true, allowWhileIdle: true } },
        { id: GENERIC_EVENING_ID, title: "Evening check-in", body: "How did today go?", schedule: { on: { hour: 19, minute: 0 }, repeats: true, allowWhileIdle: true } },
      ],
    })).catch(console.error);
  } else {
    scheduleNextGenericWeb(8, 0, "Good morning", "Plan your day with Lit.", GENERIC_MORNING_ID);
    scheduleNextGenericWeb(19, 0, "Evening check-in", "How did today go?", GENERIC_EVENING_ID);
  }
}

async function scheduleTaskReminder(id, when, title) {
  if (isNative) {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id }] });
    await LocalNotifications.schedule({ notifications: [{ id, title, body: "Reminder", schedule: { at: when } }] });
  } else {
    scheduleWeb(id, when, title, "Reminder");
  }
}
async function cancelTaskReminder(id) {
  if (isNative) {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } else {
    cancelWeb(id);
  }
}

/* Schedules a real notification for every reminder-flagged task at its exact
   dateKey + time, in addition to the fixed 8am/7pm daily reminders. Keyed by
   task.id so edits reschedule and done/delete/deselect cancel cleanly. */
export function useNotifications(tasks) {
  const scheduledRef = useRef(new Map()); // task.id -> fire time (ms), to detect no-op re-renders

  useEffect(() => {
    requestPermission().catch(console.error);
    scheduleGenericReminders();
  }, []);

  useEffect(() => {
    const scheduled = scheduledRef.current;
    const stillWanted = new Set();

    for (const t of tasks) {
      if (!t.reminder || t.done || !t.time || !t.dateKey) continue;
      const when = fireAt(t.dateKey, t.time);
      if (when.getTime() <= Date.now()) continue;
      stillWanted.add(t.id);
      const key = when.getTime();
      if (scheduled.get(t.id) === key) continue; // unchanged, leave the existing schedule alone
      scheduled.set(t.id, key);
      scheduleTaskReminder(idForTask(t.id), when, t.text).catch(console.error);
    }

    for (const taskId of scheduled.keys()) {
      if (!stillWanted.has(taskId)) {
        scheduled.delete(taskId);
        cancelTaskReminder(idForTask(taskId)).catch(console.error);
      }
    }
  }, [tasks]);
}
