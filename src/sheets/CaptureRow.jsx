import { useState } from "react";
import { T } from "../theme";

export function CaptureRow({ c, expanded, onToggle, onTask, onVision, onSchedule, onRelease, onToggleItem, onEdit }) {
  const [leaving, setLeaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const editableField = c.type === "task" ? "title" : "text";
  const [draft, setDraft] = useState(c[editableField] || "");
  const release = () => { setLeaving(true); setTimeout(onRelease, 260); };
  const listItems = (c.items || []).map((i) => (typeof i === "string" ? { text: i, done: false } : i));
  const label = c.type === "list" && c.title
    ? `${c.title} · ${listItems.filter((i) => i.done).length}/${listItems.length}`
    : c.title || c.text || c.url || "Image";
  const canVision = ["note", "image", "link", "text"].includes(c.type);
  const canEdit = c.type === "note" || c.type === "task";
  const act = (txt, fn, color = T.ink2, bg = T.bg) => (
    <button onClick={fn} style={{ padding: "7px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: bg, color, cursor: "pointer" }}>{txt}</button>
  );

  const startEdit = () => { setDraft(c[editableField] || ""); setEditing(true); };
  const saveEdit = () => {
    const v = draft.trim();
    if (v) onEdit({ [editableField]: v });
    setEditing(false);
  };

  return (
    <div style={{ background: T.card, borderRadius: 16, padding: "12px 14px", marginBottom: 8, boxShadow: T.shadowSm, animation: leaving ? "fadeSlideOut .26s ease forwards" : undefined }}>
      {editing ? (
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.coral, background: T.coralSoft, padding: "3px 8px", borderRadius: 100 }}>{c.type}</span>
          <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
            style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 12, border: "none", outline: "none", resize: "none", background: T.bg, fontSize: 13.5, lineHeight: 1.5, color: T.ink }} />
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {act("Save", saveEdit, "#fff", T.coralGrad)}
            {act("Cancel", () => setEditing(false))}
          </div>
        </div>
      ) : (
        <>
          <button onClick={onToggle} style={{ display: "flex", width: "100%", alignItems: expanded ? "flex-start" : "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.coral, background: T.coralSoft, padding: "3px 8px", borderRadius: 100, flexShrink: 0 }}>{c.type}</span>
            <span style={expanded
              ? { flex: 1, fontSize: 13.5, fontWeight: 500, whiteSpace: "pre-wrap", overflowWrap: "break-word" }
              : { flex: 1, fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {label}
            </span>
            {(c.tags || []).slice(0, 2).map((t) => <span key={t} style={{ fontSize: 11, color: T.mint }}>#{t}</span>)}
          </button>
          {c.type === "image" && c.imageUrl && expanded && <img src={c.imageUrl} alt="" style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 180, objectFit: "cover" }} />}
          {c.type === "list" && expanded && (
            <div style={{ margin: "10px 0 0" }}>
              {(c.items || []).map((raw, ix) => {
                const it = typeof raw === "string" ? { text: raw, done: false } : raw;
                return (
                  <button key={ix} onClick={() => onToggleItem(ix)}
                    style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "7px 2px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, border: it.done ? "none" : `1.6px solid ${T.ink3}`, background: it.done ? T.coralGrad : "transparent", display: "grid", placeItems: "center", transition: "all .25s" }}>
                      {it.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: it.done ? T.ink3 : T.ink, textDecoration: it.done ? "line-through" : "none", textDecorationColor: T.ink3 }}>{it.text}</span>
                  </button>
                );
              })}
            </div>
          )}
          {expanded && (
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {canEdit && act("Edit", startEdit)}
              {act("→ Task", onTask, "#fff", T.coralGrad)}
              {canVision && act("→ Vision", onVision, T.mint, T.mintSoft)}
              {act("Schedule", onSchedule, T.sky, T.skySoft)}
              {act("Release", release)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
