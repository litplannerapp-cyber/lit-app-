import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { getPushState, enablePush, disablePush, getDailyEnabled, setDailyEnabled } from "../lib/push";
import { T } from "../theme";
import { Ic, HaloMark } from "../icons/Icons";
import { Sheet } from "../components/Sheet";
import { Eyebrow } from "../components/Eyebrow";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const DELETE_CONFIRM_WORD = "DELETE";

/* Reminders on the web / PWA: one button that turns on web push for this
   device (must be a tap — iPhone ignores prompts that aren't), plus the
   8am / 7pm check-ins switch. Hidden in the native app, which schedules its
   own local notifications. */
function RemindersSetting({ userId, showToast }) {
  const [state, setState] = useState("loading"); // loading | on | off | denied | needs-install | unsupported
  const [busy, setBusy] = useState(false);
  const [daily, setDaily] = useState(true);
  useEffect(() => {
    let alive = true;
    getPushState().then((s) => { if (alive) setState(s); });
    getDailyEnabled(userId).then((d) => { if (alive) setDaily(d); }).catch(() => {});
    return () => { alive = false; };
  }, [userId]);

  const turnOn = async () => {
    setBusy(true);
    try {
      await enablePush(userId);
      setState("on");
      showToast("Reminders are on");
    } catch (e) {
      if (e?.message === "denied") setState("denied");
      else if (e?.message !== "dismissed") showToast("Couldn't turn reminders on — please try again");
    } finally { setBusy(false); }
  };
  const turnOff = async () => {
    setBusy(true);
    try { await disablePush(); setState("off"); showToast("Reminders are off on this device"); }
    catch { showToast("Couldn't turn reminders off — please try again"); }
    finally { setBusy(false); }
  };
  const toggleDaily = async () => {
    const next = !daily;
    setDaily(next);
    try { await setDailyEnabled(userId, next); } catch { setDaily(!next); showToast("Couldn't save that — please try again"); }
  };

  const note = (text) => <p style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.5, margin: "10px 2px 0" }}>{text}</p>;
  return (
    <div style={{ padding: 16, borderRadius: T.r, background: T.bg, marginBottom: 24 }}>
      {state === "on" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 650 }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: T.mint, display: "grid", placeItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
              </span>
              Reminders are on
            </span>
            <button onClick={turnOff} disabled={busy} style={{ fontSize: 12.5, fontWeight: 600, color: T.ink2, cursor: "pointer", padding: "6px 4px" }}>Turn off</button>
          </div>
          {note("You'll get a nudge at the time you set on a task, even with Lit closed.")}
          <button onClick={toggleDaily} role="switch" aria-checked={daily}
            style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "10px 2px 0", borderTop: `1px solid ${T.hairline}`, cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: T.ink }}>
            Morning plan (8am) and evening check-in (7pm)
            <span style={{ position: "relative", width: 38, height: 22, borderRadius: 11, background: daily ? T.coralGrad : T.stroke, transition: "background .2s", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: daily ? 19 : 3, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left .2s" }} />
            </span>
          </button>
        </>
      ) : state === "off" || state === "loading" ? (
        <>
          <button onClick={turnOn} disabled={busy || state === "loading"}
            style={{ width: "100%", padding: "13px 0", borderRadius: 15, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: busy || state === "loading" ? 0.6 : 1 }}>
            {busy ? "Turning on…" : "Turn on reminders"}
          </button>
          {note("Get a nudge at the time you set on a task — even with Lit closed — plus a gentle 8am plan and 7pm check-in.")}
        </>
      ) : state === "needs-install" ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 650 }}>First, add Lit to your Home Screen</div>
          {note("On iPhone, reminders only work when Lit is opened from the Home Screen. In Safari, tap Share → Add to Home Screen, open Lit from that icon, then come back here.")}
        </>
      ) : state === "denied" ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 650 }}>Notifications are blocked for Lit</div>
          {note(Capacitor.getPlatform() === "web" && /iphone|ipad/i.test(navigator.userAgent)
            ? "Open your iPhone's Settings → Notifications → Lit and turn on Allow Notifications, then come back here."
            : "Allow notifications for litplanner.app in your browser's site settings, then come back here.")}
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 650 }}>This browser can't show reminders</div>
          {note("Try Chrome on Android or desktop, or Safari on iPhone with Lit added to your Home Screen.")}
        </>
      )}
    </div>
  );
}

/* Hierarchy: Settings home (profile card → Account subview · Appearance · sign out · delete account).
   Appearance is its own first-class group with Light / Dark / System — not a
   toggle lost inside an account form. Email + code accounts have no password
   to change; email itself is also read-only here since changing it needs its
   own re-verification flow, not yet implemented. */
export function SettingsSheet({ profile, userId, onSaveName, onSignOut, onDeleteAccount, theme, setTheme, onClose, showToast }) {
  useBodyScrollLock(true);
  const [view, setView] = useState("home"); // "home" | "account" | "delete"
  const [name, setName] = useState(profile.name);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const initials = (profile.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const saveAccount = () => {
    if (name.trim()) onSaveName(name.trim());
    showToast("Profile updated");
    setView("home");
  };

  const canDelete = confirmText.trim().toUpperCase() === DELETE_CONFIRM_WORD;
  const confirmDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDeleteAccount();
      /* no navigation needed here — the auth state change this triggers
         (session cleared) takes App.jsx back to SignInScreen on its own */
    } catch (err) {
      setDeleting(false);
      setDeleteError(err?.message || "Couldn't delete your account — check your connection and try again.");
    }
  };

  if (view === "delete") {
    return (
      <Sheet onClose={deleting ? () => {} : onClose} title="Delete account">
        <button onClick={() => setView("home")} disabled={deleting} style={{ fontSize: 13.5, fontWeight: 600, color: T.ink2, cursor: deleting ? "default" : "pointer", marginBottom: 16, opacity: deleting ? 0.5 : 1 }}>← Settings</button>

        <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.55, margin: "0 0 14px" }}>
          This permanently deletes your account and everything in it — tasks, Inbox captures, Vision boards, goals, finance entries, and your sign-in itself. This can't be undone.
        </p>
        <div style={{ padding: "12px 14px", borderRadius: 14, background: T.coralSoft, marginBottom: 18 }}>
          <p style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.5, margin: 0 }}>
            <strong>If you're subscribed to Lit Plus</strong>, deleting your account does not cancel it — that's handled separately by Apple or Google. Cancel your subscription first in your Apple ID or Google Play settings to stop future billing.
          </p>
        </div>

        <Eyebrow style={{ marginBottom: 8 }}>Type {DELETE_CONFIRM_WORD} to confirm</Eyebrow>
        <input autoFocus value={confirmText} onChange={(e) => setConfirmText(e.target.value)} disabled={deleting}
          placeholder={DELETE_CONFIRM_WORD} autoCapitalize="characters" autoCorrect="off" spellCheck={false}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: `1px solid ${T.stroke}`, outline: "none", background: T.bg, fontSize: 14, marginBottom: 10, letterSpacing: "0.04em" }} />

        {deleteError && <p style={{ fontSize: 12.5, color: T.coral, margin: "0 0 10px" }}>{deleteError}</p>}

        <button onClick={confirmDelete} disabled={!canDelete || deleting}
          style={{ width: "100%", padding: "14px 0", borderRadius: 15, background: T.ink, color: T.card, fontWeight: 600, fontSize: 14,
            cursor: canDelete && !deleting ? "pointer" : "default", opacity: canDelete ? 1 : 0.4, transition: "opacity .2s" }}>
          {deleting ? "Deleting…" : "Permanently delete my account"}
        </button>
      </Sheet>
    );
  }

  if (view === "account") {
    return (
      <Sheet onClose={onClose} title="Account">
        <button onClick={() => setView("home")} style={{ fontSize: 13.5, fontWeight: 600, color: T.ink2, cursor: "pointer", marginBottom: 16 }}>← Settings</button>

        <Eyebrow style={{ marginBottom: 10 }}>Details</Eyebrow>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" enterKeyHint="done"
          style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "none", outline: "none", background: T.bg, fontSize: 14, marginBottom: 10 }} />
        <input value={profile.email} disabled placeholder="Email"
          style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "none", outline: "none", background: T.bg, fontSize: 14, marginBottom: 10, color: T.ink3 }} />
        <p style={{ fontSize: 11.5, color: T.ink3, margin: "0 0 16px" }}>This is the email you sign in with — changing it isn't supported yet.</p>
        <button onClick={saveAccount} style={{ width: "100%", padding: "14px 0", borderRadius: 15, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          Save changes
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} title="Settings">
      {/* profile card → account */}
      <button onClick={() => setView("account")}
        style={{ display: "flex", width: "100%", alignItems: "center", gap: 14, padding: "16px", borderRadius: T.r, background: T.bg, cursor: "pointer", textAlign: "left", marginBottom: 24 }}>
        <span style={{ width: 50, height: 50, borderRadius: 18, background: T.coralGrad, color: "#fff", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>{initials}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 700 }}>{profile.name}</span>
          <span style={{ display: "block", fontSize: 12.5, color: T.ink3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.email}</span>
        </span>
        {Ic.chevR(T.ink3)}
      </button>

      {/* appearance — first-class group */}
      <Eyebrow style={{ marginBottom: 10 }}>Appearance</Eyebrow>
      <div style={{ display: "flex", gap: 8, padding: 4, borderRadius: 16, background: T.bg, marginBottom: 24 }}>
        {[["light", "Light"], ["dark", "Dark"], ["system", "System"]].map(([k, label]) => (
          <button key={k} onClick={() => setTheme(k)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 650, cursor: "pointer", transition: "all .2s",
              background: theme === k ? T.card : "transparent",
              boxShadow: theme === k ? T.shadowSm : "none",
              color: theme === k ? T.ink : T.ink3 }}>
            {label}
          </button>
        ))}
      </div>

      {/* reminders — web / PWA only; the native app handles its own */}
      {!Capacitor.isNativePlatform() && userId && (
        <>
          <Eyebrow style={{ marginBottom: 10 }}>Reminders</Eyebrow>
          <RemindersSetting userId={userId} showToast={showToast} />
        </>
      )}

      <button onClick={onSignOut} style={{ display: "block", width: "100%", padding: "13px 0", borderRadius: 15, background: T.bg, fontSize: 13.5, color: T.ink2, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
        Sign out
      </button>

      {/* kept visually apart from Sign out — this one's irreversible */}
      <button onClick={() => { setConfirmText(""); setDeleteError(""); setView("delete"); }}
        style={{ display: "block", width: "100%", marginTop: 10, padding: "13px 0", fontSize: 12.5, color: T.ink3, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
        Delete account
      </button>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 28 }}>
        <HaloMark size={32} />
        <div className="fr" style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: T.ink2 }}>Lit</div>
        <p style={{ fontSize: 10.5, color: T.ink3, margin: "3px 0 0" }}>light your mind</p>
      </div>
    </Sheet>
  );
}
