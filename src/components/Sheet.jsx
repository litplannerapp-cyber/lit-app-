import { T } from "../theme";
import { Ic } from "../icons/Icons";

export function Sheet({ title, subtitle, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(24,21,18,0.4)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "flex-end", backdropFilter: "blur(7px)", animation: "fadeIn .22s ease" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, maxHeight: "88vh", background: T.card, borderRadius: "28px 28px 0 0", borderTop: `1px solid ${T.stroke}`, padding: "16px 22px 40px", overflowY: "auto", overscrollBehavior: "contain", animation: "sheetUp .34s cubic-bezier(.32,1.1,.4,1)", WebkitOverflowScrolling: "touch" }}>
        <div style={{ width: 40, height: 4.5, borderRadius: 3, background: T.hairline, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: title ? 16 : 4 }}>
          <div style={{ minWidth: 0 }}>
            {title && <h2 className="fr" style={{ fontSize: 23, fontWeight: 600, margin: 0 }}>{title}</h2>}
            {subtitle && <p style={{ fontSize: 12.5, color: T.ink3, margin: "3px 0 0" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 12, background: T.bg, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            {Ic.x(T.ink2)}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
