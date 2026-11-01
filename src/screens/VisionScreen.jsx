import { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, useDndContext, useDraggable,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { pointerWithinOrClosestCenter } from "../utils/dnd";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { VisionTile } from "../components/VisionTile";
import { LinkPreview } from "../components/LinkPreview";
import { useImagePicker } from "../hooks/useImagePicker";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { uid } from "../utils/date";
import { PALETTE } from "../constants";
import { BoardView } from "./vision/BoardView";
import { VisionList } from "../components/VisionList";
import { BoardEditSheet } from "./vision/BoardEditSheet";

const LOOSE_PREFIX = "loose:";

/* a board tile — sortable among the other boards (drag the grip handle to
   reorder in any direction) and, at the same time, a drop target for a
   loose item dragged in from the tray below. useSortable already wraps
   useDroppable, so one hook covers both jobs; useDndContext reads which
   id is globally being dragged/hovered so the tile can show the right
   highlight without the parent threading that down by hand. */
function BoardTile({ board, onOpen, onEdit, onDelete, reducedMotion }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: board.id });
  const { active, over } = useDndContext();
  const isDropTarget = !!active && active.id !== board.id && over?.id === board.id;
  const cover = board.coverUrl || board.items.find((i) => i.type === "image")?.content;

  return (
    <div ref={setNodeRef} style={{
      position: "relative",
      transform: CSS.Transform.toString(transform),
      transition: reducedMotion ? undefined : transition,
      opacity: isDragging ? 0.4 : 1,
      zIndex: isDragging ? 1 : "auto",
    }}>
      <button onClick={onOpen}
        style={{
          width: "100%", aspectRatio: "1", borderRadius: T.r, overflow: "hidden", position: "relative", cursor: "pointer",
          boxShadow: isDropTarget ? T.shadow : T.shadowSm,
          outline: isDropTarget ? `2px solid ${T.coral}` : "none", outlineOffset: 2,
          background: cover ? "none" : `${board.color}33`, textAlign: "left", display: "block",
          transition: reducedMotion ? undefined : "box-shadow .15s ease, outline .15s ease",
        }}>
        {cover && <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: cover ? "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.45))" : "none" }} />
        <div style={{ position: "absolute", left: 14, bottom: 12, right: 14 }}>
          <div className="fr" style={{ fontSize: 18, fontWeight: 600, color: cover ? "#fff" : T.ink }}>{board.name}</div>
          <div style={{ fontSize: 11.5, color: cover ? "rgba(255,255,255,.8)" : T.ink2, marginTop: 2 }}>{board.items.length} item{board.items.length !== 1 ? "s" : ""}</div>
        </div>
      </button>
      <button ref={setActivatorNodeRef} {...listeners} {...attributes}
        aria-label={`Reorder ${board.name}. Press space to pick up, arrow keys to move, space to drop, escape to cancel.`}
        style={{
          position: "absolute", top: 10, left: 10, width: 28, height: 28, borderRadius: 10,
          background: "rgba(253,250,245,.92)", display: "grid", placeItems: "center", boxShadow: T.shadowSm,
          color: cover ? T.ink2 : T.ink3, cursor: isDragging ? "grabbing" : "grab", touchAction: "none",
        }}>
        {Ic.grip("currentColor")}
      </button>
      {/* edit (name + colour) and delete — always visible, top-right */}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
        {confirmDel ? (
          <button autoFocus onClick={() => { setConfirmDel(false); onDelete(); }} onBlur={() => setConfirmDel(false)}
            style={{ height: 30, padding: "0 12px", borderRadius: 10, background: T.ink, color: T.card, fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: T.shadowSm }}>
            Delete board?
          </button>
        ) : (
          <>
            <button onClick={onEdit} aria-label={`Edit ${board.name}`} style={tileIconBtn}>{Ic.pencil("#5A524C")}</button>
            <button onClick={() => setConfirmDel(true)} aria-label={`Delete ${board.name}`} style={tileIconBtn}>{Ic.trash("#5A524C", 16)}</button>
          </>
        )}
      </div>
    </div>
  );
}

const tileIconBtn = {
  width: 30, height: 30, borderRadius: 10, background: "rgba(253,250,245,.92)", display: "grid", placeItems: "center",
  cursor: "pointer", boxShadow: "0 2px 8px -3px rgba(0,0,0,.25)",
};

/* a loose item waiting to be placed — plain draggable (not sortable, the
   tray itself isn't reorderable), and still a normal click target for the
   existing tap-to-place sheet: a short tap never moves far/long enough to
   cross the sensors' activation constraints below, so both keep working
   on the same element. */
function LooseDraggableItem({ item, onTap, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: LOOSE_PREFIX + item.id });
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={onTap}
      aria-label={`${item.type === "image" ? "Image" : item.type === "link" ? "Link" : item.type === "list" ? "List" : "Note"}. Press space to pick up and drag to a board, arrow keys to move, space to drop, escape to cancel. Or activate to choose a board.`}
      style={{
        width: 160, minHeight: 84, borderRadius: 16, overflow: "hidden", background: T.card, boxShadow: T.shadowSm,
        cursor: "pointer", border: `1.4px dashed ${T.ink3}`, touchAction: "manipulation",
        opacity: isDragging ? 0.4 : 1,
        transform: CSS.Translate.toString(transform),
      }}>
      {item.type === "image" && <img src={item.content} alt="" style={{ width: "100%", height: 92, objectFit: "cover", display: "block" }} />}
      {item.type === "text" && (
        <p className="fr" style={{ ...LOOSE_TEXT, color: T.ink }}>{item.content}</p>
      )}
      {item.type === "link" && <div style={{ pointerEvents: "none" }}><LinkPreview url={item.content} /></div>}
      {item.type === "list" && <VisionList compact content={item.content} />}
    </div>
      {/* delete — outside the draggable so a tap never starts a drag */}
      <div style={{ position: "absolute", top: 6, right: 6 }}>
        {confirmDel ? (
          <button autoFocus onClick={() => { setConfirmDel(false); onDelete(); }} onBlur={() => setConfirmDel(false)}
            style={{ height: 28, padding: "0 10px", borderRadius: 9, background: T.ink, color: T.card, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Delete?</button>
        ) : (
          <button onClick={() => setConfirmDel(true)} aria-label="Delete item"
            style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(253,250,245,.92)", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 2px 8px -3px rgba(0,0,0,.25)" }}>
            {Ic.trash("#5A524C", 15)}
          </button>
        )}
      </div>
    </div>
  );
}

/* loose notes read like the rest of the app — same Fraunces font as every
   other vision item, upright (not italic) and at body size for legibility,
   with room on the right for the trash button. `color` is deliberately not
   baked in here: T is a module-level binding the app reassigns on every
   theme change, and this object is created once at import time, so a color
   captured here would freeze at whatever theme was active on first load —
   each caller below reads T.ink live instead. */
const LOOSE_TEXT = {
  fontSize: 15, fontWeight: 500, lineHeight: 1.4, margin: 0, padding: "14px 40px 14px 14px",
  display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "break-word",
};

/* Loose-first: anything you add lands unassigned. Drag it (any device —
   mouse, touch or keyboard) or tap it to place it on a board. Boards are
   editable and reorderable the same way. */
export function VisionScreen({ boards, looseItems, boardOpen, setBoardOpen, showToast,
  onAddLooseItem, onPlaceOnBoard, onCreateBoard, onUpdateBoard, onDeleteBoard, onDeleteVisionItem,
  onReorderBoardItems, onReorderBoards, onMoveVisionItem, onAddImageToBoard, onPinCover, onEditVisionItem, onAddItemToBoard }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [quick, setQuick] = useState("");
  const [newBoard, setNewBoard] = useState(false); // "New board" sheet open
  const [tagFilter, setTagFilter] = useState(null);
  const [placing, setPlacing] = useState(null); // loose item being placed (tap flow)
  const [editingBoard, setEditingBoard] = useState(null); // board id in edit sheet
  const [activeDragId, setActiveDragId] = useState(null);
  const [openPicker, pickerInput] = useImagePicker((dataUrl) => {
    onAddLooseItem({ id: uid(), type: "image", content: dataUrl, tags: [] });
    showToast("Image added — place it on a board");
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    /* a short press before the drag arms, so a normal scroll gesture still
       works everywhere else on the page */
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const allTags = [...new Set([...boards.flatMap((b) => b.items), ...looseItems].flatMap((i) => i.tags || []))];

  const addQuick = () => {
    const v = quick.trim(); if (!v) return;
    const tags = (v.match(/#[\w-]+/g) || []).map((t) => t.slice(1));
    const content = v.replace(/#[\w-]+/g, "").trim();
    const isImg = /^https?:\/\/\S+\.(png|jpe?g|webp|gif)/i.test(v);
    const isLink = /^https?:\/\/\S+$/i.test(v);
    const item = { id: uid(), type: isImg ? "image" : isLink ? "link" : "text", content: isImg || isLink ? v.split(" ")[0] : content, tags };
    onAddLooseItem(item);
    setQuick(""); showToast("Added — place it on a board when you like");
  };

  const placeOnBoard = (itemId, boardId) => {
    onPlaceOnBoard(itemId, boardId);
    setPlacing(null);
    showToast(`Placed on ${boards.find((b) => b.id === boardId)?.name || "board"}`);
  };

  const createBoard = (name, color) => {
    onCreateBoard(name, color);
    setNewBoard(false);
    showToast(`Board "${name}" created`);
  };
  const deleteBoard = (id) => {
    const b = boards.find((x) => x.id === id);
    onDeleteBoard(id);
    showToast(b?.items.length ? "Board deleted — its items are back in “Not on a board yet”" : "Board deleted");
  };

  const handleDragStart = (e) => setActiveDragId(e.active.id);
  const handleDragCancel = () => setActiveDragId(null);
  const handleDragEnd = (e) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    if (activeId.startsWith(LOOSE_PREFIX)) {
      const itemId = activeId.slice(LOOSE_PREFIX.length);
      const targetBoardId = String(over.id);
      if (boards.some((b) => b.id === targetBoardId)) placeOnBoard(itemId, targetBoardId);
      return;
    }
    if (active.id === over.id) return;
    const oldIndex = boards.findIndex((b) => b.id === active.id);
    const newIndex = boards.findIndex((b) => b.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) onReorderBoards(oldIndex, newIndex);
  };

  if (boardOpen) {
    const board = boards.find((b) => b.id === boardOpen);
    if (board) return <BoardView board={board} boards={boards} onBack={() => setBoardOpen(null)} showToast={showToast}
      onDeleteVisionItem={onDeleteVisionItem} onReorderItems={onReorderBoardItems} onMoveItem={onMoveVisionItem}
      onAddImage={onAddImageToBoard} onPinCover={onPinCover} onEditItem={onEditVisionItem} onAddItem={onAddItemToBoard} />;
  }

  const filteredItems = tagFilter
    ? [
        ...looseItems.filter((i) => (i.tags || []).includes(tagFilter)).map((i) => ({ ...i, boardName: "Not placed yet" })),
        ...boards.flatMap((b) => b.items.filter((i) => (i.tags || []).includes(tagFilter)).map((i) => ({ ...i, boardName: b.name }))),
      ]
    : null;

  const activeBoard = activeDragId && !String(activeDragId).startsWith(LOOSE_PREFIX) ? boards.find((b) => b.id === activeDragId) : null;
  const activeLooseItem = activeDragId && String(activeDragId).startsWith(LOOSE_PREFIX)
    ? looseItems.find((i) => i.id === String(activeDragId).slice(LOOSE_PREFIX.length))
    : null;

  return (
    <div style={{ padding: isDesktop ? "26px 22px 0" : "84px 22px 0" }} className="rise">
      {pickerInput}
      <Eyebrow>Why you're doing all of this</Eyebrow>
      <h1 className="fr" style={{ fontSize: 34, fontWeight: 500, margin: "6px 0 20px" }}>Vision</h1>

      {/* quick capture — no board decision needed */}
      <div data-coach="vision-quick" style={{ display: "flex", gap: 8 }}>
        <input value={quick} onChange={(e) => setQuick(e.target.value)} enterKeyHint="done"
          onKeyDown={(e) => e.key === "Enter" && addQuick()}
          placeholder="A quote, a link, an image URL…"
          style={{ flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: 16, border: "none", outline: "none", background: T.card, boxShadow: T.shadowSm, fontSize: 14 }} />
        <button onClick={openPicker} aria-label="Upload an image" style={{ width: 48, borderRadius: 16, background: T.card, boxShadow: T.shadowSm, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={T.ink2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <button onPointerDown={(e) => { e.preventDefault(); addQuick(); }} style={{ padding: "0 16px", borderRadius: 16, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>Add</button>
      </div>

      {/* tags cross boards */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          {allTags.map((t) => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)}
              style={{ padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", background: tagFilter === t ? T.mint : T.mintSoft, color: tagFilter === t ? "#fff" : T.mint }}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {filteredItems ? (
        <div style={{ columnCount: 2, columnGap: 12, marginTop: 20 }}>
          {filteredItems.map((i) => <VisionTile key={i.id} item={i} subtitle={i.boardName} />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={pointerWithinOrClosestCenter}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          {/* loose items — waiting to be placed */}
          {looseItems.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <Eyebrow>Not on a board yet</Eyebrow>
                <span style={{ fontSize: 11, color: T.ink3 }}>drag to a board, or tap to place</span>
              </div>
              <div data-noswipe style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
                {looseItems.map((item) => (
                  <LooseDraggableItem key={item.id} item={item} onTap={() => setPlacing(item)}
                    onDelete={() => { onDeleteVisionItem(item.id); showToast("Deleted"); }} />
                ))}
              </div>
            </div>
          )}

          {/* boards grid — 2 columns on desktop, 1 on mobile; every board is
              sortable among the others (drag its grip handle, in any
              direction) and a drop target for a loose item dragged in */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, marginBottom: 12 }}>
            <Eyebrow>Your boards</Eyebrow>
            <button onClick={() => setNewBoard(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 100, background: T.coralGrad, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: T.shadowSm }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              New board
            </button>
          </div>
          {boards.length === 0 && (
            <button onClick={() => setNewBoard(true)}
              style={{ width: "100%", padding: "26px 18px", borderRadius: T.r, border: `1.6px dashed ${T.ink3}`, cursor: "pointer", textAlign: "center", color: T.ink2 }}>
              <div className="fr" style={{ fontSize: 19, fontWeight: 600, color: T.ink }}>Create your first board</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>A trip, a home, a goal — give it a name and a colour.</div>
            </button>
          )}
          <SortableContext items={boards.map((b) => b.id)} strategy={rectSortingStrategy}>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 12 }}>
              {boards.map((b) => (
                <BoardTile key={b.id} board={b} reducedMotion={reducedMotion}
                  onOpen={() => setBoardOpen(b.id)}
                  onEdit={() => setEditingBoard(b.id)}
                  onDelete={() => deleteBoard(b.id)} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
            {activeBoard && (
              <div style={{ width: 160, aspectRatio: "1", borderRadius: T.r, overflow: "hidden", boxShadow: "0 20px 44px -16px rgba(46,42,38,.4)", background: (activeBoard.coverUrl || activeBoard.items.find((i) => i.type === "image")?.content) ? "none" : `${activeBoard.color}33`, position: "relative" }}>
                {(activeBoard.coverUrl || activeBoard.items.find((i) => i.type === "image")?.content) && (
                  <img src={activeBoard.coverUrl || activeBoard.items.find((i) => i.type === "image")?.content} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div style={{ position: "absolute", left: 14, bottom: 12, right: 14, color: "#fff", fontWeight: 600, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,.4)" }}>{activeBoard.name}</div>
              </div>
            )}
            {activeLooseItem && (
              <div style={{ width: 160, borderRadius: 16, overflow: "hidden", background: T.card, boxShadow: "0 20px 44px -16px rgba(46,42,38,.4)" }}>
                {activeLooseItem.type === "image" && <img src={activeLooseItem.content} alt="" style={{ width: "100%", height: 92, objectFit: "cover", display: "block" }} />}
                {activeLooseItem.type === "text" && <p className="fr" style={{ ...LOOSE_TEXT, color: T.ink }}>{activeLooseItem.content}</p>}
                {activeLooseItem.type === "link" && <div style={{ pointerEvents: "none" }}><LinkPreview url={activeLooseItem.content} /></div>}
                {activeLooseItem.type === "list" && <VisionList compact content={activeLooseItem.content} />}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* tap-to-place sheet (mobile-friendly alternative to drag) */}
      {placing && createPortal(
        <div onClick={() => setPlacing(null)} style={{ position: "fixed", inset: 0, background: "rgba(46,42,38,.3)", zIndex: 90, display: "grid", placeItems: isDesktop ? "center center" : "end center" }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: isDesktop ? 420 : 440, borderRadius: isDesktop ? 22 : "24px 24px 0 0", padding: 22, boxShadow: isDesktop ? "0 30px 80px rgba(0,0,0,.28)" : undefined, animation: isDesktop ? "modalIn .28s cubic-bezier(.3,.9,.4,1)" : undefined }}>
            <Eyebrow style={{ marginBottom: 12 }}>Place on a board</Eyebrow>
            {boards.length === 0 && <p style={{ fontSize: 13.5, color: T.ink2, margin: "0 0 6px" }}>No boards yet — create one first.</p>}
            {boards.map((b) => (
              <button key={b.id} onClick={() => placeOnBoard(placing.id, b.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, textAlign: "left", padding: "13px 4px", fontSize: 15, fontWeight: 500, cursor: "pointer", borderBottom: `1px solid ${T.hairline}` }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: b.color }} />{b.name}
              </button>
            ))}
            <button onClick={() => { setPlacing(null); setNewBoard(true); }} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, textAlign: "left", padding: "13px 4px", fontSize: 15, fontWeight: 600, color: T.coral, cursor: "pointer", borderBottom: `1px solid ${T.hairline}` }}>
              + New board
            </button>
            <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
              <button onClick={() => { onDeleteVisionItem(placing.id); setPlacing(null); showToast("Deleted"); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, color: T.ink2, fontWeight: 600, cursor: "pointer" }}>{Ic.trash(T.ink2, 15)}Delete</button>
              <button onClick={() => setPlacing(null)} style={{ fontSize: 13.5, color: T.ink3, fontWeight: 600, cursor: "pointer" }}>Leave it loose</button>
            </div>
          </Card>
        </div>,
        document.body,
      )}

      {/* board edit sheet */}
      {editingBoard && (
        <BoardEditSheet
          board={boards.find((b) => b.id === editingBoard)}
          onSave={(name, color) => { onUpdateBoard(editingBoard, { name, color }); setEditingBoard(null); }}
          onDelete={() => { deleteBoard(editingBoard); setEditingBoard(null); }}
          onClose={() => setEditingBoard(null)}
        />
      )}

      {/* new board sheet — name + colour */}
      {newBoard && (
        <BoardEditSheet isNew board={null} initialColor={PALETTE[boards.length % PALETTE.length]}
          onSave={createBoard}
          onClose={() => setNewBoard(false)}
        />
      )}
    </div>
  );
}
