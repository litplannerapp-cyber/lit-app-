import { T } from "../theme";
import { HaloMark } from "../icons/Icons";

/* Desktop doesn't get a phone simulated in the middle of the screen — it gets
   a real left-nav, the pattern every desktop-class app (Linear, Notion, Things
   Mac) uses. Navigation recedes visually (smaller items, reduced opacity, a
   faint background tint) so the main content stays the focus — Capture lives
   outside the sidebar entirely, as a quiet fixed icon in the corner. */
export function Sidebar({ tab, setTab, dark, toggleTheme, profile, openProfile }) {
  const navItem = (key, label, icon) => {
    const active = tab === key;
    return (
      <button key={key} onClick={() => setTab(key)} data-dockitem={key} className="navitem"
        style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", height: 36, padding: "0 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
          background: active ? T.coralSoft : "transparent", opacity: active ? 1 : 0.62, transition: "background .2s ease, opacity .2s ease" }}>
        {icon(active ? T.coral : T.ink2)}
        <span style={{ fontSize: 13.5, fontWeight: active ? 650 : 550, color: active ? T.coral : T.ink2 }}>{label}</span>
      </button>
    );
  };
  const iconToday = (c) => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
  const iconVision = (c) => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="2.5" /><rect x="13" y="3" width="8" height="8" rx="2.5" /><rect x="3" y="13" width="8" height="8" rx="2.5" /><rect x="13" y="13" width="8" height="8" rx="2.5" /></svg>);
  const iconFinance = (c) => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M4 19V10M10 19V5M16 19v-7M22 19H2" /></svg>);
  const iconGoals = (c) => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={c} /></svg>);

  return (
    <div style={{ width: 232, flexShrink: 0, padding: "26px 16px", display: "flex", flexDirection: "column",
      background: dark ? "rgba(0,0,0,.12)" : "rgba(46,42,38,.02)", borderRight: `1px solid ${T.stroke}`, position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px", marginBottom: 26 }}>
        <HaloMark size={24} />
        <span className="fr" style={{ fontSize: 16.5, fontWeight: 700 }}>Lit</span>
      </div>

      <div data-coach="dock" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItem("today", "Today", iconToday)}
        {navItem("vision", "Vision", iconVision)}
        {navItem("finance", "Finance", iconFinance)}
        {navItem("goals", "Goals", iconGoals)}
      </div>

      {/* deliberately no filler content below — Linear, Notion, and Things
          all leave this quiet; the subtle bg tint above keeps it from
          reading as a rendering gap rather than intentional space */}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="hoverable"
          style={{ width: 34, height: 34, borderRadius: 10, background: T.card, border: `1px solid ${T.stroke}`, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2, flexShrink: 0 }}>
          {dark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>
          )}
        </button>
        <button onClick={openProfile} className="hoverable" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9, padding: "5px 8px", borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: 26, height: 26, borderRadius: 9, background: T.coralGrad, color: "#fff", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>
            {(profile?.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.name || "Profile"}</span>
        </button>
      </div>
    </div>
  );
}
