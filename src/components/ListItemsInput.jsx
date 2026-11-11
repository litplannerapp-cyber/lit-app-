import { useLayoutEffect, useRef } from "react";
import { T } from "../theme";

/* List rows that behave like iPhone Reminders: Return makes the next row,
   Backspace on an empty row removes it, pasting several lines makes
   several rows, × removes a row. Shared by the New task sheet and the
   Inbox composer. items is an array of strings (always at least one).
   firstRef, if given, is pointed at the first row so a "List name" field
   can hand the focus over on Return. */
export function ListItemsInput({ items, onChange, firstRef, onSubmit }) {
  const itemRefs = useRef([]);
  /* focus moves in a layout effect, right after the new row renders and
     before the next key is handled — so fast typing never spills the
     next letters into the previous row */
  const pendingFocus = useRef(null);
  const focusRow = (i) => { pendingFocus.current = i; };
  useLayoutEffect(() => {
    if (pendingFocus.current == null) return;
    itemRefs.current[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  });

  const setRow = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  const rowKeyDown = (i, e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onSubmit) { e.preventDefault(); onSubmit(); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      onChange([...items.slice(0, i + 1), "", ...items.slice(i + 1)]);
      focusRow(i + 1);
    } else if (e.key === "Backspace" && items[i] === "" && items.length > 1) {
      e.preventDefault();
      onChange(items.filter((_, j) => j !== i));
      focusRow(Math.max(0, i - 1));
    }
  };
  const rowPaste = (i, e) => {
    const lines = e.clipboardData.getData("text").split(/\r?\n/).map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    onChange([...items.slice(0, i), ...(items[i] ? [items[i]] : []), ...lines, ...items.slice(i + 1)]);
    focusRow(i + lines.length);
  };

  return (
    <div style={{ padding: "6px 6px 6px 14px", borderRadius: 15, background: T.bg }}>
      {items.map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span aria-hidden="true" style={{ width: 17, height: 17, borderRadius: 6, border: `1.6px solid ${T.ink3}`, flexShrink: 0, opacity: v ? 1 : 0.5 }} />
          <input ref={(el) => { itemRefs.current[i] = el; if (i === 0 && firstRef) firstRef.current = el; }} value={v} onChange={(e) => setRow(i, e.target.value)}
            onKeyDown={(e) => rowKeyDown(i, e)} onPaste={(e) => rowPaste(i, e)} enterKeyHint="next"
            placeholder={i === 0 ? "First item" : "Add item"} aria-label={`Item ${i + 1}`}
            style={{ flex: 1, minWidth: 0, padding: "10px 4px", border: "none", outline: "none", background: "transparent", fontSize: 14.5, fontWeight: 500, color: T.ink,
              borderBottom: i < items.length - 1 ? `1px solid ${T.hairline}` : "none" }} />
          {items.length > 1 && (
            <button aria-label={`Remove ${v || "item"}`} onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}
        </div>
      ))}
      <button onClick={() => { onChange([...items, ""]); focusRow(items.length); }}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0 8px", fontSize: 13.5, fontWeight: 650, color: T.coral, cursor: "pointer" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        Add item
      </button>
    </div>
  );
}
