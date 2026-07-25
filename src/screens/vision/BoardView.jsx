import { useRef, useState } from "react";
import { T } from "../../theme";
import { Card } from "../../components/Card";
import { Eyebrow } from "../../components/Eyebrow";
import { VisionTile } from "../../components/VisionTile";
import { useImagePicker } from "../../hooks/useImagePicker";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { uid } from "../../utils/date";

export function BoardView({ board, boards, onBack, showToast, onDeleteVisionItem, onReorderItems, onMoveItem, onAddImage, onPinCover, onEditItem, onAddItem }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const dragIx = useRef(null);
  const [moveItem, setMoveItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [quick, setQuick] = useState("");
  const [openPicker, pickerInput] = useImagePicker((dataUrl) => {
    onAddImage(board.id, dataUrl);
    showToast(`Image added to ${board.name}`);
  });

  /* add a quote or link directly into this board — same auto-detect as the
     top-level Vision quick-capture, but it lands here instead of loose */
  const addQuickToBoard = () => {
    const v = quick.trim(); if (!v) return;
    const tags = (v.match(/#[\w-]+/g) || []).map((t) => t.slice(1));
    const content = v.replace(/#[\w-]+/g, "").trim();
    const isLink = /^https?:\/\/\S+$/i.test(v);
    const item = { id: uid(), type: isLink ? "link" : "text", content: isLink ? v.split(" ")[0] : content, tags };
    onAddItem(board.id, item);
    setQuick("");
    showToast(isLink ? "Link added" : "Added to board");
  };

  const reorder = (from, to) => onReorderItems(board.id, from, to);
  const moveTo = (item, targetId) => {
    onMoveItem(item.id, targetId === "loose" ? null : targetId);
    setMoveItem(null);
  };
  const editItem = (id, changes) => onEditItem(id, changes);
  const startEdit = (item) => { setEditDraft(item.content || ""); setEditingItem(item); };
  const saveEdit = () => {
    const v = editDraft.trim();
    if (v) editItem(editingItem.id, { content: v });
    setEditingItem(null);
  };

  return (
    <div style={{ padding: isDesktop ? "26px 22px 0" : "84px 22px 0" }} className="rise">
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
      <h1 className="fr" style={{ fontSize: 30, fontWeight: 500, margin: "0 0 14px" }}>{board.name}</h1>

      {/* text/link quick-add — scoped to this board, not the loose tray */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={quick} onChange={(e) => setQuick(e.target.value)} enterKeyHint="done"
          onKeyDown={(e) => e.key === "Enter" && addQuickToBoard()}
          placeholder="Add a quote or paste a link…"
          style={{ flex: 1, minWidth: 0, padding: "13px 16px", borderRadius: 15, border: "none", outline: "none", background: T.bg, fontSize: 14 }} />
        <button onPointerDown={(e) => { e.preventDefault(); addQuickToBoard(); }}
          style={{ padding: "0 16px", borderRadius: 15, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
          Add
        </button>
      </div>

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
              onEdit={(item.type === "text" || item.type === "link") ? () => startEdit(item) : null}
            />
          </div>
        ))}
      </div>
      {board.items.length === 0 && (
        <p className="fr" style={{ fontStyle: "italic", color: T.ink2, textAlign: "center", padding: "40px 0" }}>An empty board is a quiet invitation.</p>
      )}
      {moveItem && (
        <div onClick={() => setMoveItem(null)} style={{ position: "fixed", inset: 0, background: "rgba(46,42,38,.3)", zIndex: 90, display: "grid", placeItems: isDesktop ? "center center" : "end center" }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: isDesktop ? 420 : 440, borderRadius: isDesktop ? 22 : "24px 24px 0 0", padding: 22, boxShadow: isDesktop ? "0 30px 80px rgba(0,0,0,.28)" : undefined, animation: isDesktop ? "modalIn .28s cubic-bezier(.3,.9,.4,1)" : undefined }}>
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
      {editingItem && (
        <div onClick={() => setEditingItem(null)} style={{ position: "fixed", inset: 0, background: "rgba(46,42,38,.3)", zIndex: 90, display: "grid", placeItems: isDesktop ? "center center" : "end center" }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: isDesktop ? 420 : 440, borderRadius: isDesktop ? 22 : "24px 24px 0 0", padding: 22, boxShadow: isDesktop ? "0 30px 80px rgba(0,0,0,.28)" : undefined, animation: isDesktop ? "modalIn .28s cubic-bezier(.3,.9,.4,1)" : undefined }}>
            <Eyebrow style={{ marginBottom: 12 }}>Edit {editingItem.type}</Eyebrow>
            {editingItem.type === "link" ? (
              <input autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)} enterKeyHint="done"
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                placeholder="https://…"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "none", outline: "none", background: T.bg, fontSize: 14, color: T.ink }} />
            ) : (
              <textarea autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)} rows={4}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "none", outline: "none", resize: "none", background: T.bg, fontSize: 14, lineHeight: 1.5, color: T.ink }} />
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onPointerDown={(e) => { e.preventDefault(); saveEdit(); }} style={{ padding: "10px 18px", borderRadius: 100, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Save</button>
              <button onClick={() => setEditingItem(null)} style={{ padding: "10px 18px", borderRadius: 100, background: T.bg, color: T.ink2, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
