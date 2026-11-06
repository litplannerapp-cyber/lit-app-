import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { useMediaQuery } from "../hooks/useMediaQuery";

/* side: on desktop, open as a full-height panel from the right edge (the
   Inbox) instead of a centred modal — the page stays visible beside it,
   like a drawer in Linear or Things. On phones every sheet is the same
   bottom sheet. */
export function Sheet({ title, subtitle, children, onClose, side = false }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const drawer = isDesktop && side;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: drawer ? "rgba(24,21,18,0.22)" : "rgba(24,21,18,0.4)", zIndex: 9999, display: "flex", justifyContent: drawer ? "flex-end" : "center", alignItems: drawer ? "stretch" : isDesktop ? "center" : "flex-end", backdropFilter: drawer ? "blur(2px)" : "blur(7px)", WebkitBackdropFilter: drawer ? "blur(2px)" : "blur(7px)", animation: "fadeIn .22s ease" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={drawer ? {
          width: "100%", maxWidth: 480, height: "100%", background: T.card, borderLeft: `1px solid ${T.stroke}`,
          boxShadow: "-24px 0 60px rgba(0,0,0,.16)", animation: "drawerIn .32s cubic-bezier(.3,.9,.3,1)", display: "flex", flexDirection: "column", overflow: "hidden",
        } : isDesktop ? {
          width: "100%", maxWidth: 520, maxHeight: "82vh", background: T.card, borderRadius: 26, border: `1px solid ${T.stroke}`,
          boxShadow: "0 30px 80px rgba(0,0,0,.28)", animation: "modalIn .28s cubic-bezier(.3,.9,.4,1)", display: "flex", flexDirection: "column", overflow: "hidden",
        } : {
          width: "100%", maxWidth: 440, maxHeight: "88dvh", background: T.card, borderRadius: "28px 28px 0 0", borderTop: `1px solid ${T.stroke}`,
          animation: "sheetUp .34s cubic-bezier(.32,1.1,.4,1)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
        {/* fixed header — never scrolls with the content, so the close button (and
            title) stay reachable no matter how long the sheet's content gets */}
        <div style={{ padding: drawer ? "16px 28px 0" : "16px 22px 0", flexShrink: 0 }}>
          {!isDesktop && <div style={{ width: 40, height: 4.5, borderRadius: 3, background: T.hairline, margin: "0 auto 16px" }} />}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: title ? 16 : 4, paddingTop: drawer ? 18 : isDesktop ? 6 : 0 }}>
            <div style={{ minWidth: 0 }}>
              {title && <h2 className="fr" style={{ fontSize: 23, fontWeight: 600, margin: 0 }}>{title}</h2>}
              {subtitle && <p style={{ fontSize: 12.5, color: T.ink3, margin: "3px 0 0" }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 12, background: T.bg, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
              {Ic.x(T.ink2)}
            </button>
          </div>
        </div>
        <div style={{ flex: "1 1 0%", height: 0, overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", padding: drawer ? "0 28px 40px" : "0 22px 40px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
