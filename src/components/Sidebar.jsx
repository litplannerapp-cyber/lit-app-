import { T } from "../theme";
import { HaloMark, Ic } from "../icons/Icons";

/* Desktop navigation: a real left rail pinned to the window edge, the
   pattern desktop-class apps use (Linear, Things, Notion). It holds the
   whole app's frame — brand, the four spaces, the Inbox with its count, and theme/profile at the foot — so the
   content area to its right can use the full width of the screen.

   The Inbox row is also the drop target for dragging a task back to the
   Inbox (data-drop="inbox"), and the coach-mark anchor (data-coach). */
export function Sidebar({ tab, setTab, dark, toggleTheme, profile, openProfile, openInbox, inboxCount }) {
  const navItem = (key, label, icon, hint) => {
    const active = tab === key;
    return (
      <button key={key} onClick={() => setTab(key)} data-dockitem={key} className="navitem" aria-current={active ? "page" : undefined}
        title={hint ? `${label} (${hint})` : label}
        style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, width: "100%", height: 40, padding: "0 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
          background: active ? T.card : "transparent", boxShadow: active ? T.shadowSm : "none", transition: "background .2s ease, box-shadow .2s ease" }}>
        {active && <span aria-hidden="true" style={{ position: "absolute", left: -16, top: 10, bottom: 10, width: 3, borderRadius: "0 3px 3px 0", background: T.coralGrad }} />}
        {icon(active ? T.coral : T.ink2)}
        <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 650 : 520, color: active ? T.ink : T.ink2 }}>{label}</span>
        {hint && <span aria-hidden="true" className="kbd" style={{ fontSize: 10.5, fontWeight: 600, color: T.ink3, opacity: active ? 0 : 0.8 }}>{hint}</span>}
      </button>
    );
  };
  const iconToday = (c) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
  const iconVision = (c) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="2.5" /><rect x="13" y="3" width="8" height="8" rx="2.5" /><rect x="3" y="13" width="8" height="8" rx="2.5" /><rect x="13" y="13" width="8" height="8" rx="2.5" /></svg>);
  const iconFinance = (c) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M4 19V10M10 19V5M16 19v-7M22 19H2" /></svg>);
  const iconGoals = (c) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={c} /></svg>);

  return (
    <aside style={{ width: 256, flexShrink: 0, padding: "24px 16px 20px", display: "flex", flexDirection: "column",
      background: dark ? "rgba(0,0,0,.14)" : "rgba(46,42,38,.025)", borderRight: `1px solid ${T.stroke}`, position: "sticky", top: 0, height: "100vh", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px", marginBottom: 30 }}>
        <HaloMark size={26} />
        <span className="fr" style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Lit</span>
      </div>

      <nav data-coach="dock" aria-label="Spaces" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {navItem("today", "Today", iconToday, "1")}
        {navItem("vision", "Vision", iconVision, "2")}
        {navItem("finance", "Finance", iconFinance, "3")}
        {navItem("goals", "Goals", iconGoals, "4")}
      </nav>

      <div style={{ height: 1, background: T.hairline, margin: "16px 10px" }} />

      <button data-coach="inbox" data-drop="inbox" onClick={openInbox} className="navitem" title="Inbox"
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 40, padding: "0 12px", borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
        {Ic.thought(T.ink2)}
        <span style={{ flex: 1, fontSize: 14, fontWeight: 520, color: T.ink2 }}>Inbox</span>
        {inboxCount > 0 && (
          <span style={{ minWidth: 22, height: 20, padding: "0 7px", borderRadius: 10, background: T.coralSoft, color: T.coral, fontSize: 11.5, fontWeight: 700, display: "grid", placeItems: "center" }}>{inboxCount}</span>
        )}
      </button>

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, paddingTop: 16, borderTop: `1px solid ${T.hairline}` }}>
        <button onClick={openProfile} className="hoverable" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: 32, height: 32, borderRadius: 11, background: T.coralGrad, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {(profile?.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 650, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.name || "Profile"}</span>
            <span style={{ display: "block", fontSize: 11.5, color: T.ink3 }}>Settings</span>
          </span>
        </button>
        <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"} className="hoverable"
          style={{ width: 34, height: 34, borderRadius: 11, background: T.card, border: `1px solid ${T.stroke}`, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2, flexShrink: 0 }}>
          {dark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>
          )}
        </button>
      </div>
    </aside>
  );
}
