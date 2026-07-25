import { useState } from "react";
import { T } from "../../theme";
import { Card } from "../../components/Card";
import { Eyebrow } from "../../components/Eyebrow";
import { PALETTE } from "../../constants";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export function BoardEditSheet({ board, onSave, onDelete, onClose }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const [name, setName] = useState(board?.name || "");
  const [color, setColor] = useState(board?.color || PALETTE[0]);
  const [confirmDel, setConfirmDel] = useState(false);
  if (!board) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(46,42,38,.34)", zIndex: 95, display: "grid", placeItems: isDesktop ? "center center" : "end center" }}>
      <Card onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: isDesktop ? 420 : 440, borderRadius: isDesktop ? 22 : "24px 24px 0 0", padding: 22, boxShadow: isDesktop ? "0 30px 80px rgba(0,0,0,.28)" : undefined, animation: isDesktop ? "modalIn .28s cubic-bezier(.3,.9,.4,1)" : undefined }}>
        <Eyebrow style={{ marginBottom: 12 }}>Edit board</Eyebrow>
        <input value={name} onChange={(e) => setName(e.target.value)} enterKeyHint="done"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim(), color)}
          placeholder="Board name"
          style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "none", outline: "none", background: T.bg, fontSize: 15, fontWeight: 600 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {PALETTE.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Board color ${c}`}
              style={{ width: 26, height: 26, borderRadius: 13, background: c, cursor: "pointer", outline: color === c ? `2.5px solid ${T.ink}` : "none", outlineOffset: 2 }} />
          ))}
        </div>
        <button onClick={() => name.trim() && onSave(name.trim(), color)}
          style={{ width: "100%", marginTop: 18, padding: "14px 0", borderRadius: 15, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>
          Save board
        </button>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          {confirmDel ? (
            <button onClick={onDelete} style={{ fontSize: 13, fontWeight: 700, color: T.ink, cursor: "pointer" }}>Remove board? Items go back to loose</button>
          ) : (
            <button onClick={() => setConfirmDel(true)} style={{ fontSize: 13, fontWeight: 600, color: T.ink3, cursor: "pointer" }}>Remove this board</button>
          )}
        </div>
      </Card>
    </div>
  );
}
