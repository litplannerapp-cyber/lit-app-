import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { NotificationBadge } from "./NotificationBadge";

/* Desktop's big capture button — the heart of Lit, given the same place
   it has on the phone: centre stage. A glass capsule floats at the bottom
   centre of the content area with a large coral thought-bubble orb, a
   gentle breathing halo, and a line that tells you where your head is at
   ("3 thoughts waiting" / "Your head is clear").

   It's also a drop target: dragging a task from Today onto it sends the
   task back to the Inbox, same as the dock button on the phone. */
export function CaptureButton({ onOpen, count = 0, sidebarWidth = 256 }) {
  const sub = count > 0 ? `${count} ${count === 1 ? "thought" : "thoughts"} waiting` : "Your head is clear";
  return (
    <div style={{ position: "fixed", bottom: 26, left: `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px) / 2)`, transform: "translateX(-50%)", zIndex: 60, pointerEvents: "none" }}>
      <button data-drop="inbox" data-coach="capture" onClick={onOpen} className="capture-capsule" title="Capture a thought (C)"
        style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 18, padding: "9px 26px 9px 9px", borderRadius: 999, cursor: "pointer",
          background: T.dockBg, backdropFilter: "blur(22px) saturate(1.5)", WebkitBackdropFilter: "blur(22px) saturate(1.5)",
          border: `1px solid ${T.stroke}`, boxShadow: "0 18px 50px -12px rgba(46,42,38,.35), 0 2px 8px rgba(46,42,38,.08)" }}>
        <span className="capture-orb" style={{ position: "relative", width: 74, height: 74, borderRadius: "50%", background: T.coralGrad, display: "grid", placeItems: "center", flexShrink: 0,
          boxShadow: "0 10px 26px -6px rgba(255,107,94,.65), inset 0 1px 0 rgba(255,255,255,.35)" }}>
          <span aria-hidden="true" className="capture-halo" />
          <span style={{ display: "grid", transform: "scale(1.65)" }}>{Ic.thought("#fff")}</span>
          <NotificationBadge count={count} size={26} />
        </span>
        <span style={{ textAlign: "left", minWidth: 0 }}>
          <span className="fr" style={{ display: "block", fontSize: 21, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>Empty your head</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12.5, fontWeight: 550, color: count > 0 ? T.coral : T.mint, whiteSpace: "nowrap" }}>
            {sub}
            <span style={{ fontSize: 10.5, fontWeight: 700, color: T.ink3, padding: "1px 6px", borderRadius: 6, border: `1px solid ${T.stroke}` }}>C</span>
          </span>
        </span>
      </button>
    </div>
  );
}
