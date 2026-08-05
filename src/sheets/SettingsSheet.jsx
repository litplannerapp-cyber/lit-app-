import { useState } from "react";
import { T } from "../theme";
import { Ic, HaloMark } from "../icons/Icons";
import { Sheet } from "../components/Sheet";
import { Eyebrow } from "../components/Eyebrow";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const DELETE_CONFIRM_WORD = "DELETE";

/* Hierarchy: Settings home (profile card → Account subview · Appearance · sign out · delete account).
   Appearance is its own first-class group with Light / Dark / System — not a
   toggle lost inside an account form. Email + code accounts have no password
   to change; email itself is also read-only here since changing it needs its
   own re-verification flow, not yet implemented. */
export function SettingsSheet({ profile, onSaveName, onSignOut, onDeleteAccount, theme, setTheme, onClose, showToast }) {
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
        <p style={{ fontSize: 10.5, color: T.ink3, margin: "3px 0 0" }}>calm by design</p>
      </div>
    </Sheet>
  );
}
