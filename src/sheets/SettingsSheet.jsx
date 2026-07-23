import { useState } from "react";
import { T } from "../theme";
import { Ic, HaloMark } from "../icons/Icons";
import { Sheet } from "../components/Sheet";
import { Eyebrow } from "../components/Eyebrow";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

/* Hierarchy: Settings home (profile card → Account subview · Appearance · sign out).
   Appearance is its own first-class group with Light / Dark / System — not a
   toggle lost inside an account form. Google-only accounts have no password to
   change and no free-text email (both are owned by the Google identity). */
export function SettingsSheet({ profile, onSaveName, onSignOut, theme, setTheme, onClose, showToast }) {
  useBodyScrollLock(true);
  const [view, setView] = useState("home"); // "home" | "account"
  const [name, setName] = useState(profile.name);

  const initials = (profile.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const saveAccount = () => {
    if (name.trim()) onSaveName(name.trim());
    showToast("Profile updated");
    setView("home");
  };

  if (view === "account") {
    return (
      <Sheet onClose={onClose} title="Account">
        <button onClick={() => setView("home")} style={{ fontSize: 13.5, fontWeight: 600, color: T.ink2, cursor: "pointer", marginBottom: 16 }}>← Settings</button>

        <Eyebrow style={{ marginBottom: 10 }}>Details</Eyebrow>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" enterKeyHint="done"
          style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "none", outline: "none", background: T.bg, fontSize: 14, marginBottom: 10 }} />
        <input value={profile.email} disabled placeholder="Email"
          style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "none", outline: "none", background: T.bg, fontSize: 14, marginBottom: 10, color: T.ink3 }} />
        <p style={{ fontSize: 11.5, color: T.ink3, margin: "0 0 16px" }}>Your email comes from your Google account and can't be changed here.</p>
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
          <span style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, fontSize: 11, color: T.mint, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: T.mint }} /> Signed in with Google
          </span>
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

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 28 }}>
        <HaloMark size={32} />
        <div className="fr" style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: T.ink2 }}>Lit</div>
        <p style={{ fontSize: 10.5, color: T.ink3, margin: "3px 0 0" }}>calm by design</p>
      </div>
    </Sheet>
  );
}
