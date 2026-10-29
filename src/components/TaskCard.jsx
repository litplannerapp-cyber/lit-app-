import { useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Check } from "./Check";

/* the brand gradient used for the "this is one of your three" outline —
   a fixed identity colour, intentionally not T.coralGrad, same in both
   themes (see the spec this was built to). */
const PRIORITY_OUTLINE = "linear-gradient(135deg, #F4B16B, #ED7B65 52%, #E35F87)";
const CARD_RADIUS = 18;

export function TaskCard({ t, big, toggleDone, deleteTask, setTop3, setEditor, openDetail, onPressDrag, dragging }) {
  const [leaving, setLeaving] = useState(false);
  const remove = () => { setLeaving(true); setTimeout(() => deleteTask(t.id), 260); };
  return (
    <div
      style={{
        position: "relative", zIndex: 0,
        display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
        userSelect: "none", WebkitUserSelect: "none",
        opacity: dragging ? 0.35 : 1, pointerEvents: dragging ? "none" : "auto",
        padding: "13px 14px",
        borderRadius: CARD_RADIUS,
        background: T.card,
        boxShadow: T.shadowSm,
        borderLeft: t.group ? `3px solid ${t.group.color}` : "3px solid transparent",
        animation: leaving ? "fadeSlideOut .26s ease forwards" : undefined,
        transition: "opacity .2s",
      }}>
      {/* priority outline — a separate absolutely-positioned layer so fading it
          in/out when a task is starred/unstarred never resizes the card or
          repaints its content. The padding-box/border-box double background is
          the standard CSS trick for a gradient border that still respects the
          card's own radius; the row above establishes its own stacking context
          (position: relative + z-index: 0) so this layer's negative z-index
          keeps it behind the checkbox/text/buttons (z-index: auto) and only
          on top of the row's own flat background, never covering content. */}
      <span aria-hidden="true" style={{
        position: "absolute", zIndex: -1, inset: 0, borderRadius: CARD_RADIUS, pointerEvents: "none",
        border: "1.5px solid transparent",
        background: `linear-gradient(${T.card}, ${T.card}) padding-box, ${PRIORITY_OUTLINE} border-box`,
        opacity: t.top3 ? (t.done ? 0.5 : 1) : 0,
        transition: "opacity .25s ease",
      }} />
      <span onPointerDown={onPressDrag} data-noswipe aria-label="Drag to move"
        style={{ touchAction: "none", cursor: "grab", flexShrink: 0, padding: "6px 2px", display: "grid", placeItems: "center", color: T.ink3 }}>
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.5" /><circle cx="7.5" cy="2.5" r="1.5" />
          <circle cx="2.5" cy="8" r="1.5" /><circle cx="7.5" cy="8" r="1.5" />
          <circle cx="2.5" cy="13.5" r="1.5" /><circle cx="7.5" cy="13.5" r="1.5" />
        </svg>
      </span>
      <Check done={t.done} onToggle={() => toggleDone(t.id)} />
      <div onClick={() => openDetail(t.id)} role="button" aria-label={`Open ${t.text}`}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
          {t.priority && !t.done && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.coral, flexShrink: 0, marginTop: 7 }} aria-label="Priority" />}
          <span style={{ fontSize: big ? 16.5 : 15.5, fontWeight: big ? 600 : 500, color: t.done ? T.ink3 : T.ink, textDecoration: t.done ? "line-through" : "none", textDecorationColor: T.ink3, lineHeight: 1.45, overflowWrap: "break-word", minWidth: 0 }}>
            {t.text}
          </span>
        </div>
        {(t.time || t.period) && (
          <div style={{ fontSize: 12, fontWeight: 600, color: T.coral, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.coral} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            {t.time}{t.time && t.endTime && `–${t.endTime}`}
            {t.period && <span style={{ textTransform: "capitalize", color: T.ink3, fontWeight: 500 }}>{t.time ? "· " : ""}{t.period}</span>}
            {t.reminder && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="Reminder set">
                <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8Z" /><path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
            )}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[
          { key: "star", el: Ic.star(t.top3, t.top3 ? T.coral : T.ink3), fn: () => setTop3(t.id, !t.top3), label: t.top3 ? "Remove from top 3" : "Add to top 3" },
          { key: "edit", el: Ic.pencil(T.ink3), fn: () => setEditor({ initial: t }), label: "Edit task" },
          { key: "del", el: Ic.x(T.ink3), fn: remove, label: "Delete task" },
        ].map((a) => (
          <button key={a.key} onClick={a.fn} aria-label={a.label} style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer" }}>
            {a.el}
          </button>
        ))}
      </div>
    </div>
  );
}
