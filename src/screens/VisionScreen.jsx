import { useState } from "react";
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
import { BoardEditSheet } from "./vision/BoardEditSheet";

/* Loose-first: anything you add lands unassigned. Drag it (desktop)
   or tap it (mobile) to place it on a board. Boards are editable. */
export function VisionScreen({ boards, looseItems, boardOpen, setBoardOpen, showToast,
  onAddLooseItem, onPlaceOnBoard, onCreateBoard, onUpdateBoard, onDeleteBoard, onDeleteVisionItem,
  onReorderBoardItems, onReorderBoards, onMoveVisionItem, onAddImageToBoard, onPinCover, onEditVisionItem, onAddItemToBoard }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const [quick, setQuick] = useState("");
  const [newBoard, setNewBoard] = useState(false);
  const [newName, setNewName] = useState("");
  const [tagFilter, setTagFilter] = useState(null);
  const [placing, setPlacing] = useState(null); // loose item being placed (tap flow)
  const [editingBoard, setEditingBoard] = useState(null); // board id in edit sheet
  const [dragBoard, setDragBoard] = useState(null); // {ix, x, y} while a board is being held-and-dragged
  const [hoverBoardIx, setHoverBoardIx] = useState(null);
  const [openPicker, pickerInput] = useImagePicker((dataUrl) => {
    onAddLooseItem({ id: uid(), type: "image", content: dataUrl, tags: [] });
    showToast("Image added — place it on a board");
  });

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

  const createBoard = () => {
    const v = newName.trim(); if (!v) return;
    onCreateBoard(v, PALETTE[boards.length % PALETTE.length]);
    setNewName(""); setNewBoard(false);
  };

  /* Reordering boards is a deliberate hold — 3 full seconds on the grip
     before the drag activates — not an instant grab. That's wide margin
     against ever mistaking "I meant to open this board" for "I meant to
     move it": moving before the hold completes, or lifting early, just
     cancels, no reorder happens. Once activated, the same pointer-events
     technique as the Today screen's task drag takes over (works on touch,
     where native HTML5 drag-and-drop doesn't). */
  const HOLD_MS = 3000;
  const MOVE_CANCEL_PX = 12;
  const startBoardHold = (ix) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const pointerId = e.pointerId;
    const gripEl = e.currentTarget;
    const startX = e.clientX, startY = e.clientY;

    const cancelHold = () => {
      clearTimeout(holdTimer);
      window.removeEventListener("pointermove", preMove);
      window.removeEventListener("pointerup", preEnd);
      window.removeEventListener("pointercancel", preEnd);
    };
    const preMove = (ev) => {
      if (ev.pointerId !== pointerId) return;
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > MOVE_CANCEL_PX) cancelHold();
    };
    const preEnd = (ev) => { if (ev.pointerId === pointerId) cancelHold(); };
    window.addEventListener("pointermove", preMove);
    window.addEventListener("pointerup", preEnd);
    window.addEventListener("pointercancel", preEnd);

    const holdTimer = setTimeout(() => {
      cancelHold();
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      try { gripEl.setPointerCapture(pointerId); } catch {}
      setDragBoard({ ix, x: startX, y: startY });
      /* belt-and-braces, same as the task drag: force-end if pointerup is
         ever lost so the UI can't get stuck mid-gesture */
      const failSafe = setTimeout(() => end(), 8000);

      const move = (ev) => {
        if (ev.pointerId !== pointerId) return;
        setDragBoard((d) => d && { ...d, x: ev.clientX, y: ev.clientY });
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const card = under && under.closest ? under.closest("[data-board-ix]") : null;
        setHoverBoardIx(card ? Number(card.getAttribute("data-board-ix")) : null);
      };
      const touchBlock = (ev) => { if (ev.cancelable) ev.preventDefault(); };
      const end = () => {
        clearTimeout(failSafe);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        window.removeEventListener("touchmove", touchBlock);
        try { gripEl.releasePointerCapture(pointerId); } catch {}
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        setHoverBoardIx((hoverIx) => {
          if (hoverIx != null && hoverIx !== ix) onReorderBoards(ix, hoverIx);
          return null;
        });
        setDragBoard(null);
      };
      const up = (ev) => { if (ev.pointerId === pointerId) end(); };
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      window.addEventListener("touchmove", touchBlock, { passive: false });
    }, HOLD_MS);
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
        <>
          {/* loose items — waiting to be placed */}
          {looseItems.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <Eyebrow>Not on a board yet</Eyebrow>
                <span style={{ fontSize: 11, color: T.ink3 }}>drag to a board, or tap to place</span>
              </div>
              <div data-noswipe style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
                {looseItems.map((item) => (
                  <div key={item.id} draggable
                    onDragStart={(e) => e.dataTransfer.setData("looseId", item.id)}
                    onClick={() => setPlacing(item)}
                    style={{ flexShrink: 0, width: 138, borderRadius: 16, overflow: "hidden", background: T.card, boxShadow: T.shadowSm, cursor: "pointer", border: `1.4px dashed ${T.ink3}` }}>
                    {item.type === "image" && <img src={item.content} alt="" style={{ width: "100%", height: 92, objectFit: "cover", display: "block" }} />}
                    {item.type === "text" && (
                      <p className="fr" style={{ fontStyle: "italic", fontSize: 12.5, lineHeight: 1.45, margin: 0, padding: "12px 12px", color: T.ink, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.content}</p>
                    )}
                    {item.type === "link" && <div style={{ pointerEvents: "none" }}><LinkPreview url={item.content} /></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* boards grid — drop targets for loose items, and reorderable by
              a 3-second hold-then-drag on the grip (see startBoardHold) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
            {boards.map((b, ix) => {
              const cover = b.coverUrl || b.items.find((i) => i.type === "image")?.content;
              const isDragging = dragBoard?.ix === ix;
              const isHoverTarget = dragBoard != null && dragBoard.ix !== ix && hoverBoardIx === ix;
              return (
                <div key={b.id} data-board-ix={ix} style={{ position: "relative", opacity: isDragging ? 0.4 : 1,
                  outline: isHoverTarget ? `2px solid ${T.coral}` : "none", outlineOffset: 2, borderRadius: T.r, transition: "opacity .15s, outline .15s" }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const looseId = e.dataTransfer.getData("looseId");
                    if (looseId) placeOnBoard(looseId, b.id);
                  }}>
                  <button onClick={() => setBoardOpen(b.id)} style={{ width: "100%", aspectRatio: "1", borderRadius: T.r, overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: T.shadowSm, background: cover ? "none" : `${b.color}33`, textAlign: "left", display: "block" }}>
                    {cover && <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                    <div style={{ position: "absolute", inset: 0, background: cover ? "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.45))" : "none" }} />
                    <div style={{ position: "absolute", left: 14, bottom: 12, right: 14 }}>
                      <div className="fr" style={{ fontSize: 17, fontWeight: 600, color: cover ? "#fff" : T.ink }}>{b.name}</div>
                      <div style={{ fontSize: 11.5, color: cover ? "rgba(255,255,255,.8)" : T.ink2, marginTop: 2 }}>{b.items.length} item{b.items.length !== 1 ? "s" : ""}</div>
                    </div>
                  </button>
                  <button onClick={() => setEditingBoard(b.id)} aria-label={`Edit ${b.name}`}
                    style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 10, background: "rgba(253,250,245,.92)", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: T.shadowSm }}>
                    {Ic.pencil(T.ink2)}
                  </button>
                  {/* drag handle — same grip glyph as a task card; holding it
                      for 3s activates the reorder drag (startBoardHold) */}
                  <div aria-label={`Hold to move ${b.name}`} onPointerDown={startBoardHold(ix)}
                    style={{ position: "absolute", top: 10, left: 10, width: 28, height: 28, borderRadius: 10, background: "rgba(253,250,245,.92)", display: "grid", placeItems: "center", boxShadow: T.shadowSm, cursor: "grab", color: cover ? T.ink2 : T.ink3, touchAction: "none" }}>
                    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                      <circle cx="2.5" cy="2.5" r="1.5" /><circle cx="7.5" cy="2.5" r="1.5" />
                      <circle cx="2.5" cy="8" r="1.5" /><circle cx="7.5" cy="8" r="1.5" />
                      <circle cx="2.5" cy="13.5" r="1.5" /><circle cx="7.5" cy="13.5" r="1.5" />
                    </svg>
                  </div>
                </div>
              );
            })}
            {newBoard ? (
              <div style={{ aspectRatio: "1", borderRadius: T.r, border: `1.6px dashed ${T.ink3}`, display: "flex", flexDirection: "column", justifyContent: "center", padding: 14, gap: 8 }}>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} enterKeyHint="done"
                  onKeyDown={(e) => e.key === "Enter" && createBoard()}
                  placeholder="Board name" style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, fontWeight: 600 }} />
                <button onClick={createBoard} style={{ fontSize: 12.5, fontWeight: 600, color: T.coral, cursor: "pointer", textAlign: "left" }}>Create</button>
              </div>
            ) : (
              <button onClick={() => setNewBoard(true)} style={{ aspectRatio: "1", borderRadius: T.r, border: `1.6px dashed ${T.ink3}`, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2, fontSize: 13.5, fontWeight: 600 }}>
                + New board
              </button>
            )}
          </div>
        </>
      )}

      {/* tap-to-place sheet (mobile-friendly alternative to drag) */}
      {placing && (
        <div onClick={() => setPlacing(null)} style={{ position: "fixed", inset: 0, background: "rgba(46,42,38,.3)", zIndex: 90, display: "grid", placeItems: isDesktop ? "center center" : "end center" }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: isDesktop ? 420 : 440, borderRadius: isDesktop ? 22 : "24px 24px 0 0", padding: 22, boxShadow: isDesktop ? "0 30px 80px rgba(0,0,0,.28)" : undefined, animation: isDesktop ? "modalIn .28s cubic-bezier(.3,.9,.4,1)" : undefined }}>
            <Eyebrow style={{ marginBottom: 12 }}>Place on a board</Eyebrow>
            {boards.map((b) => (
              <button key={b.id} onClick={() => placeOnBoard(placing.id, b.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, textAlign: "left", padding: "13px 4px", fontSize: 15, fontWeight: 500, cursor: "pointer", borderBottom: `1px solid ${T.hairline}` }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: b.color }} />{b.name}
              </button>
            ))}
            <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
              <button onClick={() => { onDeleteVisionItem(placing.id); setPlacing(null); }} style={{ fontSize: 13.5, color: T.ink2, fontWeight: 600, cursor: "pointer" }}>Release it</button>
              <button onClick={() => setPlacing(null)} style={{ fontSize: 13.5, color: T.ink3, fontWeight: 600, cursor: "pointer" }}>Leave it loose</button>
            </div>
          </Card>
        </div>
      )}

      {/* board edit sheet */}
      {editingBoard && (
        <BoardEditSheet
          board={boards.find((b) => b.id === editingBoard)}
          onSave={(name, color) => { onUpdateBoard(editingBoard, { name, color }); setEditingBoard(null); }}
          onDelete={() => {
            const b = boards.find((x) => x.id === editingBoard);
            onDeleteBoard(editingBoard);
            setEditingBoard(null);
            showToast(b?.items.length ? "Board removed — its items are loose again" : "Board removed");
          }}
          onClose={() => setEditingBoard(null)}
        />
      )}

      {/* drag ghost — only shows once the 3s hold has actually activated */}
      {dragBoard && (
        <div style={{ position: "fixed", left: dragBoard.x, top: dragBoard.y, transform: "translate(-50%, -120%) rotate(-2deg)", zIndex: 300, pointerEvents: "none", background: T.card, boxShadow: "0 18px 40px rgba(46,42,38,.22)", borderRadius: 16, padding: "12px 18px", fontSize: 14, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {boards[dragBoard.ix]?.name}
        </div>
      )}
    </div>
  );
}
