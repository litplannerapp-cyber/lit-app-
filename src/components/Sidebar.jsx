import { T } from "../theme";
import { Ic, HaloMark } from "../icons/Icons";

/* Desktop doesn't get a phone simulated in the middle of the screen — it gets
   a real left-nav, the pattern every desktop-class app (Linear, Notion, Things
   Mac) uses. Same four destinations as the mobile dock, plus the Inbox capture
   and the theme/profile controls that live in TopBar on mobile. */
export function Sidebar({ tab, setTab, openInbox, captureCount = 0, dark, toggleTheme, profile, openProfile }) {
  const navItem = (key, label, icon) => {
    const active = tab === key;
    return (
      <button key={key} onClick={() => setTab(key)} data-dockitem={key} className="navitem"
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", borderRadius: 14, cursor: "pointer", textAlign: "left",
          background: active ? T.coralSoft : "transparent", opacity: active ? 1 : 0.7, transition: "background .2s ease, opacity .2s ease" }}>
        {icon(active ? T.coral : T.ink2)}
        <span style={{ fontSize: 14, fontWeight: 600, color: active ? T.coral : T.ink2 }}>{label}</span>
      </button>
    );
  };
  const iconToday = (c) => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
  const iconVision = (c) => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="2.5" /><rect x="13" y="3" width="8" height="8" rx="2.5" /><rect x="3" y="13" width="8" height="8" rx="2.5" /><rect x="13" y="13" width="8" height="8" rx="2.5" /></svg>);
  const iconFinance = (c) => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M4 19V10M10 19V5M16 19v-7M22 19H2" /></svg>);
  const iconGoals = (c) => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={c} /></svg>);

  return (
    <div style={{ width: 240, flexShrink: 0, padding: "32px 18px", display: "flex", flexDirection: "column", borderRight: `1px solid ${T.stroke}`, position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px", marginBottom: 30 }}>
        <HaloMark size={28} />
        <span className="fr" style={{ fontSize: 18, fontWeight: 700 }}>Lit</span>
      </div>

      <button data-coach="inbox" onClick={openInbox} aria-label="Open Inbox"
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", borderRadius: 14, background: T.coralGrad, color: "#fff", fontSize: 14, fontWeight: 650, cursor: "pointer", marginBottom: 22, boxShadow: "0 8px 20px rgba(255,107,94,.32)", position: "relative" }}>
        {Ic.tray("#fff")} Capture
        {captureCount > 0 && (
          <span style={{ marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10, background: "rgba(255,255,255,.3)", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", padding: "0 5px" }}>{captureCount}</span>
        )}
      </button>

      <div data-coach="dock" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItem("today", "Today", iconToday)}
        {navItem("vision", "Vision", iconVision)}
        {navItem("finance", "Finance", iconFinance)}
        {navItem("goals", "Goals", iconGoals)}
      </div>

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="hoverable"
          style={{ width: 36, height: 36, borderRadius: 12, background: T.bg, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2 }}>
          {dark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>
          )}
        </button>
        <button onClick={openProfile} className="hoverable" style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: 28, height: 28, borderRadius: 10, background: T.coralGrad, color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {(profile?.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.ink2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.name || "Profile"}</span>
        </button>
      </div>
    </div>
  );
}
