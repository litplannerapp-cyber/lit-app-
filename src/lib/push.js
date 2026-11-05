/* Web push for reminders (web / PWA only — the native app schedules its own
   local notifications). The server side is the send-reminders Supabase
   function; this file only turns a device's subscription on or off.

   iPhone rule: web push only exists once Lit is opened from the Home Screen
   (iOS 16.4+), and the permission prompt only shows after a tap — so
   enablePush() must be called from a button's click handler. */
import { supabase } from "./supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const FLAG = "lit-push-on";

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

const pushApiPresent = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/* true while this device has an active push subscription — the in-tab
   timers in useNotifications stand down then, so nothing arrives twice */
export const pushIsOn = () => { try { return localStorage.getItem(FLAG) === "1"; } catch { return false; } };
const setFlag = (on) => { try { on ? localStorage.setItem(FLAG, "1") : localStorage.removeItem(FLAG); } catch { /* storage blocked */ } };

/* The service worker's scope is /app/, but Lit is opened at /app (the
   manifest's start_url), which is outside that scope — so
   navigator.serviceWorker.ready never settles there. Look the registration
   up by its scope instead, and give up after a few seconds when there is no
   service worker at all (dev server, blocked SW) so the button never hangs. */
const SW_SCOPE = "/app/";
const swReady = async () => {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (reg?.active) return reg;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("no-service-worker");
};

const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

/** "on" | "off" | "denied" | "needs-install" | "unsupported" */
export async function getPushState() {
  if (!pushApiPresent() || !VAPID_PUBLIC_KEY) return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await swReady();
    const sub = await reg.pushManager.getSubscription();
    const on = !!sub && Notification.permission === "granted";
    setFlag(on);
    return on ? "on" : "off";
  } catch {
    return "off";
  }
}

export async function enablePush(userId) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "denied" : "dismissed");
  const reg = await swReady();
  const sub = (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  const { endpoint, keys } = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: navigator.userAgent.slice(0, 200) },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Dublin";
  const { error: prefErr } = await supabase.from("reminder_prefs").upsert({ user_id: userId, timezone, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (prefErr) throw prefErr;
  setFlag(true);
}

export async function disablePush() {
  try {
    const reg = await swReady();
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
  } finally {
    setFlag(false);
  }
}

export async function getDailyEnabled(userId) {
  const { data } = await supabase.from("reminder_prefs").select("daily_enabled").eq("user_id", userId).maybeSingle();
  return data ? data.daily_enabled !== false : true;
}
export async function setDailyEnabled(userId, enabled) {
  const { error } = await supabase.from("reminder_prefs").update({ daily_enabled: enabled, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) throw error;
}
