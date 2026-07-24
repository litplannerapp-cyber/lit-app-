import { T } from "../theme";

/* Rendered once at the app's top level (not per-screen) so theme + profile
   access is consistent across every tab, not just Today. */
export function TopBar({ dark, toggleTheme, profile, openProfile }) {
  return (
    <div style={{ position: "fixed", top: 26, right: 22, zIndex: 60, display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        style={{ width: 30, height: 30, borderRadius: 15, background: T.card, border: `1px solid ${T.stroke}`, boxShadow: T.shadowSm, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2 }}>
        {dark ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
          </svg>
        )}
      </button>
      <button onClick={openProfile} aria-label="Profile and settings"
        style={{ width: 30, height: 30, borderRadius: 15, background: T.coralGrad, color: "#fff", display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
        {(profile?.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
      </button>
    </div>
  );
}
