import { useRef, useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";

const DOUBLE_TAP_MS = 320;

/* A single tap toggles done/undone. Editing is reachable two ways: the
   visible pencil (discoverable), or double-click / double-tap on the text
   (same pattern as the Inbox). While editing, Enter saves, Escape cancels,
   and the trash removes the milestone. */
export function MilestoneRow({ m, isNext, onToggle, onEdit, onDelete, onTurnIntoTask }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.text);
  const lastTapRef = useRef(0);
  const deletingRef = useRef(false);

  const startEdit = () => { setDraft(m.text); setEditing(true); };
  const save = () => {
    if (deletingRef.current) return;
    const v = draft.trim();
    if (v && v !== m.text) onEdit(v);
    setEditing(false);
  };
  const handleClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) { lastTapRef.current = 0; startEdit(); }
    else { lastTapRef.current = now; onToggle(); }
  };

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0" }}>
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Milestone" enterKeyHint="done"
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onBlur={save}
          style={{ flex: 1, minWidth: 0, padding: "9px 11px", borderRadius: 10, border: `1.5px solid ${T.mint}`, outline: "none", background: T.bg, fontSize: 13.5, fontWeight: 500, color: T.ink }} />
        {onDelete && (
          <button aria-label="Delete milestone" title="Delete milestone"
            onPointerDown={() => { deletingRef.current = true; }}
            onClick={() => { onDelete(); setEditing(false); deletingRef.current = false; }}
            style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", background: T.bg, flexShrink: 0 }}>
            {Ic.trash(T.ink2, 16)}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <button onClick={handleClick} onDoubleClick={startEdit}
        style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "center", gap: 11, padding: "9px 2px", cursor: "pointer", textAlign: "left" }}>
        <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, border: m.done ? "none" : `1.6px solid ${isNext ? T.mint : T.ink3}`, background: m.done ? T.mint : "transparent", display: "grid", placeItems: "center", transition: "all .25s" }}>
          {m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: isNext ? 650 : 480, color: m.done ? T.ink3 : T.ink, textDecoration: m.done ? "line-through" : "none", overflowWrap: "break-word" }}>{m.text}</span>
        {isNext && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: T.mint, background: T.mintSoft, padding: "3px 8px", borderRadius: 100, flexShrink: 0 }}>NEXT</span>}
      </button>
      <button onClick={startEdit} aria-label={`Edit milestone: ${m.text}`} title="Edit" className="hoverable"
        style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
        {Ic.pencil(T.ink3)}
      </button>
      {!m.done && (
        <button onClick={onTurnIntoTask} aria-label="Turn into a task" title="Turn into a task" className="hoverable"
          style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" />
          </svg>
        </button>
      )}
    </div>
  );
}
