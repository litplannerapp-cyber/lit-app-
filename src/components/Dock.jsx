import { useRef } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { NotificationBadge } from "./NotificationBadge";

/* scrubbing: drag a finger along the dock and the app slides to whichever
   tab is under it — same sliding motion as tapping */
export function Dock({ tab, setTab, openInbox, unreadCount = 0 }) {
  const tabRef = useRef(tab); tabRef.current = tab;
  const scrub = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const it = el && el.closest ? el.closest("[data-dockitem]") : null;
    if (!it) return;
    const k = it.getAttribute("data-dockitem");
    if (k && k !== tabRef.current) setTab(k);
  };
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse") return;
    const move = (ev) => scrub(ev.clientX, ev.clientY);
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const item = (key, label, icon) => {
    const active = tab === key;
    return (
      <button onClick={() => setTab(key)} data-dockitem={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "5px 0" }}>
        <span style={{ padding: "5px 13px", borderRadius: 12, background: active ? T.coralSoft : "transparent", opacity: active ? 1 : 0.5, transition: "background .25s ease, opacity .25s ease, transform .25s cubic-bezier(.34,1.4,.5,1)", transform: active ? "translateY(-1px)" : "none", display: "inline-flex" }}>
          {icon(active ? T.coral : T.ink)}
        </span>
        <span style={{ fontSize: 10, fontWeight: 650, color: active ? T.coral : T.ink3, transition: "color .25s" }}>{label}</span>
      </button>
    );
  };
  const iconToday = (c) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>);
  const iconVision = (c) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="2.5" /><rect x="13" y="3" width="8" height="8" rx="2.5" /><rect x="3" y="13" width="8" height="8" rx="2.5" /><rect x="13" y="13" width="8" height="8" rx="2.5" />
    </svg>);
  const iconFinance = (c) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />
    </svg>);
  const iconGoals = (c) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={c} />
    </svg>);

  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 440, padding: "0 18px 20px", zIndex: 50 }}>
      <div data-coach="dock" onPointerDown={onPointerDown} style={{ display: "flex", alignItems: "center", background: T.dockBg, backdropFilter: "blur(22px) saturate(1.5)", borderRadius: 26, boxShadow: T.shadow, border: `1px solid ${T.stroke}`, padding: "8px 10px", touchAction: "none" }}>
        {item("today", "Today", iconToday)}
        {item("vision", "Vision", iconVision)}
        <button data-coach="inbox" data-drop="inbox" onClick={openInbox} aria-label="Open Inbox"
          style={{ position: "relative", width: 54, height: 54, borderRadius: 20, background: T.coralGrad, display: "grid", placeItems: "center", cursor: "pointer", margin: "0 8px", boxShadow: "0 8px 22px rgba(255,107,94,.4)", flexShrink: 0, transform: "translateY(-14px)" }}>
          {Ic.tray("#fff")}
          <NotificationBadge count={unreadCount} size={21} />
        </button>
        {item("finance", "Finance", iconFinance)}
        {item("goals", "Goals", iconGoals)}
      </div>
    </div>
  );
}
