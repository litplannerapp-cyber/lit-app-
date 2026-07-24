import { useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { LinkPreview } from "./LinkPreview";

export function VisionTile({ item, subtitle, onDelete, onPin, onEdit, isCover, draggable, onDragStart, onDragOver, onDrop }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div draggable={draggable} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      style={{ breakInside: "avoid", marginBottom: 12, borderRadius: 18, overflow: "hidden", background: T.card, boxShadow: T.shadowSm, position: "relative" }}>
      {item.type === "image" && <img src={item.content} alt="" style={{ width: "100%", display: "block" }} />}
      {item.type === "text" && (
        <p className="fr" style={{ fontStyle: "italic", fontSize: 15, lineHeight: 1.55, margin: 0, padding: "18px 16px", color: T.ink }}>{item.content}</p>
      )}
      {item.type === "link" && <LinkPreview url={item.content} />}
      {subtitle && <div style={{ fontSize: 10.5, color: T.ink3, padding: "0 14px 10px" }}>{subtitle}</div>}
      {(item.tags || []).length > 0 && (
        <div style={{ display: "flex", gap: 5, padding: "0 14px 12px", flexWrap: "wrap" }}>
          {item.tags.map((t) => <span key={t} style={{ fontSize: 10.5, color: T.mint, fontWeight: 600 }}>#{t}</span>)}
        </div>
      )}
      {onDelete && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 5 }}>
          {item.type === "image" && onPin && (
            <button onClick={(e) => { e.stopPropagation(); onPin(); }} aria-label="Set as board cover" style={{ width: 26, height: 26, borderRadius: 9, background: "rgba(253,250,245,.9)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              {Ic.pin(isCover, isCover ? T.coral : T.ink2)}
            </button>
          )}
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label="Edit item" style={{ width: 26, height: 26, borderRadius: 9, background: "rgba(253,250,245,.9)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              {Ic.pencil(T.ink2)}
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
