// Sends Lit's reminders as web push notifications, so they arrive even when
// the app is closed. Called every minute by pg_cron (see supabase/push_cron.sql)
// with a shared secret — not by browsers — so deploy with --no-verify-jwt.
//
// For each person with at least one push subscription:
//   • task reminders: tasks with reminder = true, not done, dated today in
//     the person's time zone, whose time has come (sent once per date+time,
//     tracked in tasks.reminder_sent_for; anything more than 30 min late is
//     marked as handled without sending, so turning reminders on never
//     floods the phone with old ones)
//   • the daily check-ins at 08:00 and 19:00 local (reminder_prefs), once a day
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…),
// CRON_SECRET. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const LATE_LIMIT_MIN = 30;
const minutes = (hm: string) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };

function localNow(timeZone: string) {
  let tz = timeZone;
  try { new Intl.DateTimeFormat("en-CA", { timeZone: tz }); } catch { tz = "Europe/Dublin"; }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, hm: `${parts.hour}:${parts.minute}` };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return json({ error: "unauthorised" }, 401);

  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@litplanner.app",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: subs, error: subErr } = await db.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth");
  if (subErr) return json({ error: subErr.message }, 500);
  if (!subs?.length) return json({ users: 0, sent: 0 });

  const byUser = new Map<string, typeof subs>();
  for (const s of subs) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);
  const userIds = [...byUser.keys()];
  const { data: prefsRows } = await db.from("reminder_prefs").select("*").in("user_id", userIds);
  const prefsByUser = new Map((prefsRows ?? []).map((p) => [p.user_id, p]));

  let sent = 0, removed = 0;
  const pushTo = async (userId: string, msg: { title: string; body: string; tag: string; url?: string }) => {
    for (const s of byUser.get(userId) ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ url: "/app", ...msg }), { TTL: 3600 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) { await db.from("push_subscriptions").delete().eq("id", s.id); removed++; }
        else console.error("push failed", code, (e as Error).message);
      }
    }
  };

  for (const userId of userIds) {
    const prefs = prefsByUser.get(userId);
    const { dateKey, hm } = localNow(prefs?.timezone ?? "Europe/Dublin");
    const nowMin = minutes(hm);

    // task reminders
    const { data: tasks } = await db.from("tasks")
      .select("id, text, time, date_key, reminder_sent_for")
      .eq("user_id", userId).eq("reminder", true).eq("done", false).eq("date_key", dateKey).not("time", "is", null);
    for (const t of tasks ?? []) {
      if (!/^\d{1,2}:\d{2}/.test(t.time)) continue;
      const time = t.time.slice(0, 5).padStart(5, "0");
      const key = `${t.date_key} ${time}`;
      if (t.reminder_sent_for === key || minutes(time) > nowMin) continue;
      if (nowMin - minutes(time) <= LATE_LIMIT_MIN) await pushTo(userId, { title: t.text, body: `Reminder · ${time}`, tag: `task-${t.id}` });
      await db.from("tasks").update({ reminder_sent_for: key }).eq("id", t.id);
    }

    // daily check-ins (08:00 and 19:00, within a 30-minute window)
    if (prefs && prefs.daily_enabled !== false) {
      if (nowMin >= 480 && nowMin < 510 && prefs.last_morning_on !== dateKey) {
        await pushTo(userId, { title: "Good morning", body: "Pick your three for today.", tag: "morning" });
        await db.from("reminder_prefs").update({ last_morning_on: dateKey }).eq("user_id", userId);
      }
      if (nowMin >= 1140 && nowMin < 1170 && prefs.last_evening_on !== dateKey) {
        await pushTo(userId, { title: "Evening check-in", body: "How did today go? Empty your head before bed.", tag: "evening" });
        await db.from("reminder_prefs").update({ last_evening_on: dateKey }).eq("user_id", userId);
      }
    }
  }
  return json({ users: userIds.length, sent, removed });
});
