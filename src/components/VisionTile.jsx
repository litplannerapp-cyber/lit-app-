import { useRef, useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { LinkPreview } from "./LinkPreview";

export function VisionTile({ item, subtitle, onDelete, onPin, onEdit, onEditTags, onTap, isCover, draggable, onDragStart, onDragOver, onDrop, boardColor }) {
  const [confirm, setConfirm] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const canEdit = !!(onEdit && (item.type === "text" || item.type === "link"));
  /* the board's own color, so tags read as "part of this board" — falls
     back to mint for loose items not on any board yet */
  const tagColor = boardColor || T.mint;

  /* a single tap on the quote/link still does whatever onTap does (e.g.
     opening the "move to another board" sheet) — but a SECOND tap within
     320ms opens editing instead. Since the single-tap action can cover the
     tile (a modal), that action is delayed by the same window so a real
     double-tap has a chance to cancel it, rather than the first tap
     already navigating away before the second tap can land. */
  const handleContentTap = (e) => {
    e.stopPropagation();
    if (!canEdit) { onTap && onTap(); return; }
    const now = Date.now();
    if (now - lastTap.current < 320) {
      e.preventDefault();
      clearTimeout(tapTimer.current);
      lastTap.current = 0;
      onEdit();
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => { onTap && onTap(); }, 320);
    }
  };

  /* tags work the same way for every item type — image, link, or text —
     unlike content editing, which only makes sense for text/link */
  const addTag = (e) => {
    e.stopPropagation();
    const t = tagDraft.trim().replace(/^#/, "").replace(/\s+/g, "-");
    if (t && onEditTags) onEditTags({ tags: [...new Set([...(item.tags || []), t])] });
    setTagDraft(""); setAddingTag(false);
  };
  const removeTag = (e, t) => { e.stopPropagation(); if (onEditTags) onEditTags({ tags: (item.tags || []).filter((x) => x !== t) }); };

  return (
    <div draggable={draggable} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      onClick={() => onTap && onTap()}
      style={{ breakInside: "avoid", marginBottom: 12, borderRadius: 18, overflow: "hidden", background: T.card, boxShadow: T.shadowSm, position: "relative" }}>
      {item.type === "image" && <img src={item.content} alt="" style={{ width: "100%", display: "block" }} />}
      {item.type === "text" && (
        <p className="fr" onClick={handleContentTap} onDoubleClick={(e) => { e.stopPropagation(); canEdit && onEdit(); }}
          style={{ fontStyle: "italic", fontSize: 15, lineHeight: 1.55, margin: 0, padding: "18px 16px", color: T.ink, cursor: canEdit ? "pointer" : "default" }}>{item.content}</p>
      )}
      {item.type === "link" && (
        <div onClick={handleContentTap} onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); canEdit && onEdit(); }}>
          <LinkPreview url={item.content} />
        </div>
      )}
      {subtitle && <div style={{ fontSize: 10.5, color: T.ink3, padding: "0 14px 10px" }}>{subtitle}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px 12px", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
        {(item.tags || []).map((t) => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, color: tagColor, fontWeight: 600, background: `${tagColor}1a`, padding: "3px 7px 3px 9px", borderRadius: 100 }}>
            #{t}
            <button onClick={(e) => removeTag(e, t)} aria-label={`Remove tag ${t}`} style={{ display: "grid", placeItems: "center", cursor: "pointer", opacity: 0.6 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </span>
        ))}
        {onEditTags && (addingTag ? (
          <input autoFocus value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} enterKeyHint="done"
            onKeyDown={(e) => { if (e.key === "Enter") addTag(e); if (e.key === "Escape") setAddingTag(false); }}
            onBlur={() => { if (!tagDraft.trim()) setAddingTag(false); }}
            placeholder="tag" style={{ width: 64, padding: "3px 8px", borderRadius: 100, border: "none", outline: "none", background: T.bg, fontSize: 10.5, color: T.ink }} />
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setAddingTag(true); }} aria-label="Add tag"
            style={{ fontSize: 10.5, color: T.ink3, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: T.bg, cursor: "pointer" }}>
            + #tag
          </button>
        ))}
      </div>
      {onDelete && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 5 }}>
          {item.type === "image" && onPin && (
            <button onClick={(e) => { e.stopPropagation(); onPin(); }} aria-label="Set as board cover" style={{ width: 26, height: 26, borderRadius: 9, background: "rgba(253,250,245,.9)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              {Ic.pin(isCover, isCover ? T.coral : T.ink2)}
            </button>
          )}
          {confirm ? (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ height: 26, padding: "0 10px", borderRadius: 9, background: T.ink, color: T.card, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Remove?</button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setConfirm(true); }} aria-label="Delete item" style={{ width: 26, height: 26, borderRadius: 9, background: "rgba(253,250,245,.9)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              {Ic.x(T.ink2, 13)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
