import { useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Check } from "./Check";

/* the brand gradient used for the "this is one of your three" outline —
   a fixed identity colour, intentionally not T.coralGrad, same in both
   themes (see the spec this was built to). */
const PRIORITY_OUTLINE = "linear-gradient(135deg, #F4B16B, #ED7B65 52%, #E35F87)";
const CARD_RADIUS = 18;

const normalizeItems = (items) => (items || []).map((it) => (typeof it === "string" ? { text: it, done: false } : it));

export function TaskCard({ t, big, toggleDone, deleteTask, setTop3, setEditor, openDetail, onPressDrag, dragging, captures, toggleListItem, onEditList }) {
  const [leaving, setLeaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const remove = () => { setLeaving(true); setTimeout(() => deleteTask(t.id), 260); };

  /* a scheduled task can point back at the Inbox capture it came from
     (t.captureId) — when it does, that capture is the one source of truth
     for list items / link preview, never copied onto the task, so a
     scheduled list or link still behaves exactly like it does in the
     Inbox and can't drift out of sync with it. */
  const capture = t.captureId ? captures?.find((c) => c.id === t.captureId) : null;
  const isList = capture?.type === "list";
  const isLink = capture?.type === "link";
  const listItems = isList ? normalizeItems(capture.items) : [];
  const doneCount = listItems.filter((i) => i.done).length;
  const headerText = isList ? `${capture.title || "List"} · ${doneCount}/${listItems.length}` : t.text;

  const handleContentClick = () => {
    if (isList || isLink) setExpanded((e) => !e);
    else openDetail(t.id);
  };
  const handlePencil = () => {
    if (isList) onEditList(capture.id);
    else setEditor({ initial: t });
  };

  return (
    <div
      style={{
        position: "relative", zIndex: 0,
        display: "flex", alignItems: expanded ? "flex-start" : "center", gap: 10, marginBottom: 10,
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
      {/* a scheduled list has no single "done" state of its own — each item
          does — so it drops the task checkbox in favour of per-item ticks,
          same as the Inbox */}
      {!isList && <Check done={t.done} onToggle={() => toggleDone(t.id)} />}
      <div onClick={handleContentClick} role="button" aria-label={`${(isList || isLink) ? (expanded ? "Collapse" : "Expand") : "Open"} ${headerText}`}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
          {t.priority && !t.done && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.coral, flexShrink: 0, marginTop: 7 }} aria-label="Priority" />}
          <span style={{ fontSize: big ? 16.5 : 15.5, fontWeight: big ? 600 : 500, color: t.done ? T.ink3 : T.ink, textDecoration: t.done ? "line-through" : "none", textDecorationColor: T.ink3, lineHeight: 1.45, overflowWrap: "break-word", minWidth: 0 }}>
            {headerText}
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

        {expanded && isList && (
          <div style={{ margin: "10px 0 0" }} onClick={(e) => e.stopPropagation()}>
            {listItems.map((it, ix) => (
              <button key={ix} onClick={() => toggleListItem(capture.id, ix)}
                style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "7px 2px", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, border: it.done ? "none" : `1.6px solid ${T.ink3}`, background: it.done ? T.coralGrad : "transparent", display: "grid", placeItems: "center", transition: "all .25s" }}>
                  {it.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: it.done ? T.ink3 : T.ink, textDecoration: it.done ? "line-through" : "none", textDecorationColor: T.ink3 }}>{it.text}</span>
              </button>
            ))}
            {listItems.length === 0 && <p style={{ fontSize: 12.5, color: T.ink3, margin: "4px 2px" }}>No items yet.</p>}
          </div>
        )}

        {expanded && isLink && (
          <a href={capture.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            style={{ display: "block", marginTop: 10, borderRadius: 12, overflow: "hidden", background: T.bg, textDecoration: "none" }}>
            {capture.previewImage && (
              <img src={capture.previewImage} alt="" style={{ width: "100%", display: "block", maxHeight: 140, objectFit: "cover" }} />
            )}
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {capture.previewTitle || capture.url}
              </div>
              <div style={{ fontSize: 11, color: T.ink3, marginTop: 2 }}>{capture.previewSite || (capture.url || "").replace(/^https?:\/\//, "").split("/")[0]}</div>
            </div>
          </a>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[
          { key: "star", el: Ic.star(t.top3, t.top3 ? T.coral : T.ink3), fn: () => setTop3(t.id, !t.top3), label: t.top3 ? "Remove from top 3" : "Add to top 3" },
          { key: "edit", el: Ic.pencil(T.ink3), fn: handlePencil, label: isList ? "Edit list" : "Edit task" },
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
