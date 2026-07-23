import { useRef, useState } from "react";
import { T } from "../../theme";
import { Card } from "../../components/Card";
import { Eyebrow } from "../../components/Eyebrow";
import { VisionTile } from "../../components/VisionTile";
import { useImagePicker } from "../../hooks/useImagePicker";

export function BoardView({ board, boards, onBack, showToast, onDeleteVisionItem, onReorderItems, onMoveItem, onAddImage, onPinCover }) {
  const dragIx = useRef(null);
  const [moveItem, setMoveItem] = useState(null);
  const [openPicker, pickerInput] = useImagePicker((dataUrl) => {
    onAddImage(board.id, dataUrl);
    showToast(`Image added to ${board.name}`);
  });

  const reorder = (from, to) => onReorderItems(board.id, from, to);
  const moveTo = (item, targetId) => {
    onMoveItem(item.id, targetId === "loose" ? null : targetId);
    setMoveItem(null);
  };

  return (
    <div style={{ padding: "26px 22px 0" }} className="rise">
      {pickerInput}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button onClick={onBack} style={{ fontSize: 13.5, fontWeight: 600, color: T.ink2, cursor: "pointer" }}>← Boards</button>
        <button onClick={openPicker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 100, background: T.card, boxShadow: T.shadowSm, fontSize: 12.5, fontWeight: 600, color: T.ink2, cursor: "pointer" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.ink2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="M21 15l-5-5L5 21" />
          </svg>
          Upload image
        </button>
      </div>
      <h1 className="fr" style={{ fontSize: 30, fontWeight: 500, margin: "0 0 18px" }}>{board.name}</h1>
      <div style={{ columnCount: 2, columnGap: 12 }}>
        {board.items.map((item, ix) => (
          <div key={item.id} onClick={() => item.type !== "link" && setMoveItem(item)}>
            <VisionTile item={item} draggable
              onDragStart={() => (dragIx.current = ix)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIx.current != null && dragIx.current !== ix) reorder(dragIx.current, ix); dragIx.current = null; }}
              onDelete={() => onDeleteVisionItem(item.id)}
              onPin={() => onPinCover(board.id, item.content)}
              isCover={board.coverUrl === item.content}
            />
          </div>
        ))}
      </div>
      {board.items.length === 0 && (
        <p className="fr" style={{ fontStyle: "italic", color: T.ink2, textAlign: "center", padding: "40px 0" }}>An empty board is a quiet invitation.</p>
      )}
      {moveItem && (
        <div onClick={() => setMoveItem(null)} style={{ position: "fixed", inset: 0, background: "rgba(46,42,38,.3)", zIndex: 90, display: "grid", placeItems: "end center" }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, borderRadius: "24px 24px 0 0", padding: 22 }}>
            <Eyebrow style={{ marginBottom: 12 }}>Move to</Eyebrow>
            {boards.filter((b) => b.id !== board.id).map((b) => (
              <button key={b.id} onClick={() => moveTo(moveItem, b.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, textAlign: "left", padding: "13px 4px", fontSize: 15, fontWeight: 500, cursor: "pointer", borderBottom: `1px solid ${T.hairline}` }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: b.color }} />{b.name}
              </button>
            ))}
            <button onClick={() => moveTo(moveItem, "loose")} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 4px", fontSize: 15, fontWeight: 500, color: T.ink2, cursor: "pointer", borderBottom: `1px solid ${T.hairline}` }}>
              Take it off this board (back to loose)
            </button>
            <button onClick={() => setMoveItem(null)} style={{ marginTop: 14, fontSize: 13.5, color: T.ink2, fontWeight: 600, cursor: "pointer" }}>Keep it here</button>
          </Card>
        </div>
      )}
    </div>
  );
}
