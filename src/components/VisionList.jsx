import { useEffect, useRef, useState } from "react";
import { T } from "../theme";
import { parseVisionList, visionListContent } from "../utils/visionList";
import { ListSections } from "./ListSections";

/* the body of a "list" vision item: title + progress, tickable rows, and
   an always-there "Add item" input (Enter keeps focus so several items can
   be typed in a row). onChange receives the new JSON content string; with
   no onChange (e.g. the tag-filter view) the list is read-only. */
export function VisionList({ content, onChange, autoFocusAdd, accent = T.coral, compact = false, topPad = 18 }) {
  const list = parseVisionList(content);
  const done = list.items.filter((i) => i.done).length;
  const [draft, setDraft] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const addRef = useRef(null);
  useEffect(() => { if (autoFocusAdd && onChange) addRef.current?.focus(); }, [autoFocusAdd, onChange]);

  const save = (next) => onChange && onChange(visionListContent(next));
  const toggle = (ix) => save({ ...list, items: list.items.map((it, i) => (i === ix ? { ...it, done: !it.done } : it)) });
  const remove = (ix) => save({ ...list, items: list.items.filter((_, i) => i !== ix) });
  const add = () => {
    const t = draft.trim(); if (!t) return;
    save({ ...list, items: [...list.items, { text: t, done: false }] });
    setDraft("");
  };
  const saveTitle = () => {
    const t = titleDraft.trim();
    if (t && t !== list.title) save({ ...list, title: t });
    setEditingTitle(false);
  };
  const stop = (e) => e.stopPropagation();

  if (compact) {
    return (
      <div style={{ padding: "14px 40px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <ListIcon c={accent} />
          <span style={{ fontSize: 14.5, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{list.title}</span>
        </div>
        <div style={{ fontSize: 12, color: T.ink3, marginTop: 4 }}>{list.items.length ? `${done}/${list.items.length} done` : "No items yet"}</div>
      </div>
    );
  }

  return (
    <div onClick={stop} style={{ padding: `${topPad}px 14px 12px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ListIcon c={accent} />
        {editingTitle ? (
          <input autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} enterKeyHint="done" aria-label="List name"
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setTitleDraft(list.title); setEditingTitle(false); } }}
            onBlur={saveTitle}
            style={{ flex: 1, minWidth: 0, padding: "4px 8px", borderRadius: 8, border: `1.5px solid ${accent}`, outline: "none", background: T.bg, fontSize: 15, fontWeight: 600, color: T.ink }} />
        ) : (
          <button onClick={() => { if (!onChange) return; setTitleDraft(list.title); setEditingTitle(true); }} aria-label={onChange ? `Rename list ${list.title}` : undefined}
            style={{ flex: 1, minWidth: 0, textAlign: "left", fontSize: 15, fontWeight: 600, color: T.ink, cursor: onChange ? "text" : "default", overflowWrap: "break-word" }}>
            {list.title}
          </button>
        )}
        {list.items.length > 0 && <span style={{ fontSize: 11.5, fontWeight: 600, color: done === list.items.length ? T.mint : T.ink3, flexShrink: 0 }}>{done}/{list.items.length}</span>}
      </div>

      <ListSections items={list.items} title={list.title} gap={8} renderItem={(it, ix) => (
        <div key={ix} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
          <button onClick={() => onChange && toggle(ix)} aria-label={`${it.done ? "Untick" : "Tick"} ${it.text}`} disabled={!onChange}
            style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, cursor: onChange ? "pointer" : "default", display: "grid", placeItems: "center",
              border: it.done ? "none" : `1.6px solid ${T.ink3}`, background: it.done ? T.coralGrad : "transparent", transition: "all .2s" }}>
            {it.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
          </button>
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.35, color: it.done ? T.ink3 : T.ink, textDecoration: it.done ? "line-through" : "none", overflowWrap: "break-word" }}>{it.text}</span>
          {onChange && (
            <button onClick={() => remove(ix)} aria-label={`Remove ${it.text}`} style={{ width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}
        </div>
      )} />

      {onChange && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input ref={addRef} value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="enter" placeholder="Add item…" aria-label={`Add item to ${list.title}`}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 10, border: "none", outline: "none", background: T.bg, fontSize: 13.5, color: T.ink }} />
          {draft.trim() && (
            <button onPointerDown={(e) => { e.preventDefault(); add(); }} aria-label="Add item"
              style={{ padding: "0 11px", borderRadius: 10, background: accent, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Add</button>
          )}
        </div>
      )}
    </div>
  );
}

export const ListIcon = ({ c, s = 15 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
  </svg>
);
