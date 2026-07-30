import { useRef, useState } from "react";
import { T } from "../theme";

const DOUBLE_TAP_MS = 320;

/* double-click (desktop) or double-tap (touch) to edit the milestone text —
   same interaction pattern as CaptureRow in the Inbox, so it feels
   consistent across the app. A single tap toggles done/undone as before. */
export function MilestoneRow({ m, isNext, onToggle, onEdit, onTurnIntoTask }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.text);
  const lastTapRef = useRef(0);

  const startEdit = () => { setDraft(m.text); setEditing(true); };
  const save = () => {
    const v = draft.trim();
    if (v) onEdit(v);
    setEditing(false);
  };
  const handleClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) { lastTapRef.current = 0; startEdit(); }
    else { lastTapRef.current = now; onToggle(); }
  };

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 2px" }}>
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onBlur={save}
          style={{ flex: 1, minWidth: 0, padding: "8px 11px", borderRadius: 10, border: "none", outline: "none", background: T.bg, fontSize: 13.5, fontWeight: 500, color: T.ink }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={handleClick} onDoubleClick={startEdit}
        style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "center", gap: 11, padding: "9px 2px", cursor: "pointer", textAlign: "left" }}>
        <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, border: m.done ? "none" : `1.6px solid ${isNext ? T.mint : T.ink3}`, background: m.done ? T.mint : "transparent", display: "grid", placeItems: "center", transition: "all .25s" }}>
          {m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: isNext ? 650 : 480, color: m.done ? T.ink3 : T.ink, textDecoration: m.done ? "line-through" : "none", overflowWrap: "break-word" }}>{m.text}</span>
        {isNext && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: T.mint, background: T.mintSoft, padding: "3px 8px", borderRadius: 100, flexShrink: 0 }}>NEXT</span>}
      </button>
      {!m.done && (
        <button onClick={onTurnIntoTask} aria-label="Turn into a task" className="hoverable"
          style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" />
          </svg>
        </button>
      )}
    </div>
  );
}
