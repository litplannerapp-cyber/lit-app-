import { useState } from "react";
import {
  DndContext, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, useDndContext, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { pointerWithinOrClosestCenter } from "../../utils/dnd";
import { T } from "../../theme";
import { Ic } from "../../icons/Icons";
import { Card } from "../../components/Card";
import { Eyebrow } from "../../components/Eyebrow";
import { VisionTile } from "../../components/VisionTile";
import { useImagePicker } from "../../hooks/useImagePicker";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { uid } from "../../utils/date";

const MOVE_OUT_ID = "move-out-of-board";

/* the drop target shown at the top of the board while an item is being
   dragged — the tray and other boards aren't on screen in this drilled-in
   view, so this stands in for "drop it back in Not on a board yet" */
function MoveOutZone() {
  const { active, over } = useDndContext();
  const { setNodeRef } = useDroppable({ id: MOVE_OUT_ID });
  if (!active) return null;
  const isOver = over?.id === MOVE_OUT_ID;
  return (
    <div ref={setNodeRef} className="rise"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        minHeight: 52, borderRadius: 16, marginBottom: 14, padding: "10px 16px",
        border: `1.8px dashed ${isOver ? T.coral : T.ink3}`, background: isOver ? T.coralSoft : "transparent",
        color: isOver ? T.coral : T.ink2, fontSize: 13, fontWeight: 600, transition: "all .15s",
      }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
      Move out of this board
    </div>
  );
}

function SortableVisionTile({ item, reducedMotion, children }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition: reducedMotion ? undefined : transition, opacity: isDragging ? 0.4 : 1 }}>
      {children({ setActivatorNodeRef, listeners, attributes, isDragging })}
    </div>
  );
}

export function BoardView({ board, boards, onBack, showToast, onDeleteVisionItem, onReorderItems, onMoveItem, onAddImage, onPinCover, onEditItem, onAddItem }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [moveItem, setMoveItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [quick, setQuick] = useState("");
  const [openPicker, pickerInput] = useImagePicker((dataUrl) => {
    onAddImage(board.id, dataUrl);
    showToast(`Image added to ${board.name}`);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over) return;
    if (over.id === MOVE_OUT_ID) {
      const item = board.items.find((i) => i.id === active.id);
      if (item) onMoveItem(item.id, null);
      return;
    }
    if (active.id === over.id) return;
    const oldIndex = board.items.findIndex((i) => i.id === active.id);
    const newIndex = board.items.findIndex((i) => i.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) onReorderItems(board.id, oldIndex, newIndex);
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

      <DndContext sensors={sensors} collisionDetection={pointerWithinOrClosestCenter} onDragEnd={handleDragEnd}>
        <MoveOutZone />
        <SortableContext items={board.items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div style={{ columnCount: 2, columnGap: 12 }}>
            {board.items.map((item) => (
              <SortableVisionTile key={item.id} item={item} reducedMotion={reducedMotion}>
                {({ setActivatorNodeRef, listeners, attributes, isDragging }) => (
                  <VisionTile item={item}
                    dragHandle={{ setActivatorNodeRef, listeners, attributes, isDragging }}
                    onDelete={() => onDeleteVisionItem(item.id)}
                    onPin={() => onPinCover(board.id, item.content)}
                    isCover={board.coverUrl === item.content}
                    onEdit={(item.type === "text" || item.type === "link") ? () => startEdit(item) : null}
                    onEditTags={(changes) => onEditItem(item.id, changes)}
                    onTap={() => item.type !== "link" && setMoveItem(item)}
                    onMenu={() => setMoveItem(item)}
                    boardColor={board.color}
                  />
                )}
              </SortableVisionTile>
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
            <button onClick={() => moveTo(moveItem, "loose")} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, textAlign: "left", padding: "13px 4px", fontSize: 15, fontWeight: 500, color: T.ink2, cursor: "pointer", borderBottom: `1px solid ${T.hairline}` }}>
              {Ic.x(T.ink2, 15)} Remove from board — back to Not on a board yet
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
