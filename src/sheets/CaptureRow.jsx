import { useRef, useState } from "react";
import { T } from "../theme";
import { ListSections } from "../components/ListSections";
import { Ic } from "../icons/Icons";

const DOUBLE_TAP_MS = 320;

/* a capture's image can be any URL someone pasted in — if it 404s, moved,
   or was never actually an image, fail gracefully instead of a broken
   browser icon */
function CaptureImage({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div style={{ marginTop: 10, borderRadius: 12, background: T.bg, padding: "16px 12px", textAlign: "center" }}>
        <span style={{ fontSize: 12.5, color: T.ink3 }}>Image couldn't load</span>
      </div>
    );
  }
  return (
    <img src={src} alt="" onError={() => setFailed(true)}
      style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 180, objectFit: "cover" }} />
  );
}

/* link capture: shows the cached Open Graph preview (fetched server-side
   right after capture — see App.jsx's fetchLinkPreview) when it's ready,
   and falls back to the plain URL while it's loading or if it never
   resolves (fetch failed, site blocked it, etc). */
function LinkCard({ url, title, image, site }) {
  const [imgFailed, setImgFailed] = useState(false);
  const domain = (url || "").replace(/^https?:\/\//, "").split("/")[0];
  return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{ display: "block", marginTop: 10, borderRadius: 12, overflow: "hidden", background: T.bg, textDecoration: "none" }}>
      {image && !imgFailed && (
        <img src={image} alt="" onError={() => setImgFailed(true)}
          style={{ width: "100%", display: "block", maxHeight: 140, objectFit: "cover" }} />
      )}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title || url}
        </div>
        <div style={{ fontSize: 11, color: T.ink3, marginTop: 2 }}>{site || domain}</div>
      </div>
    </a>
  );
}

/* the "done" moment — tick it and it leaves your head. Kept deliberately
   simple and slow enough to feel: the check draws in, a soft ring of light
   breathes out from it, the line strikes through, the card warms, then
   lifts and folds away like an exhale. Under reduced motion it just fades. */
const DONE_HOLD_MS = 620;   // how long the "done" state is held before the card leaves
const LEAVE_MS = 520;

export function CaptureRow({ c, expanded, onToggle, onVision, onSchedule, onRelease, onToggleItem, onEdit, onEditList, onDone }) {
  const [done, setDone] = useState(false);
  const rowRef = useRef(null);
  const checkRef = useRef(null);
  const burstRef = useRef(null);
  const complete = (e) => {
    e?.stopPropagation();
    if (done || !onDone) return;
    setDone(true);
    try { navigator.vibrate?.(12); } catch { /* not supported (iOS) — fine */ }
    let reduced = false;
    try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* old browser */ }
    const row = rowRef.current;
    if (reduced || !row?.animate) {
      if (row?.animate) row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
      setTimeout(onDone, 220);
      return;
    }
    /* 1. the check pops (a small overshoot reads as "yes, that happened") */
    checkRef.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(.96)" }, { transform: "scale(1)" }],
      { duration: 420, easing: "cubic-bezier(.3,1.5,.5,1)" });
    /* 2. a soft ring of light breathes out from it */
    burstRef.current?.animate(
      [{ transform: "scale(.6)", opacity: 0.9 }, { transform: "scale(2.6)", opacity: 0 }],
      { duration: 700, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
    /* 3. hold the done state a beat, then the card lifts and folds away */
    setTimeout(() => {
      const h = row.offsetHeight;
      const anim = row.animate([
        { height: `${h}px`, opacity: 1, transform: "translateY(0) scale(1)", marginBottom: "8px", paddingTop: "12px", paddingBottom: "12px" },
        { height: `${h}px`, opacity: 0, transform: "translateY(-12px) scale(.97)", marginBottom: "8px", paddingTop: "12px", paddingBottom: "12px", offset: 0.55 },
        { height: "0px", opacity: 0, transform: "translateY(-12px) scale(.97)", marginBottom: "0px", paddingTop: "0px", paddingBottom: "0px" },
      ], { duration: LEAVE_MS, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      anim.onfinish = onDone;
    }, DONE_HOLD_MS);
  };

  const [leaving, setLeaving] = useState(false);
  const [editing, setEditing] = useState(false);
  /* what the pencil edits, per type: a note's text, a task's title, an
     image's caption, a link's title + URL (lists use their own sheet) */
  const editableField = c.type === "note" ? "text" : "title";
  const [draft, setDraft] = useState(c[editableField] || "");
  const [draftUrl, setDraftUrl] = useState(c.url || "");
  const lastTapRef = useRef(0);
  const release = () => { setLeaving(true); setTimeout(onRelease, 260); };
  const listItems = (c.items || []).map((i) => (typeof i === "string" ? { text: i, done: false } : i));
  const label = c.type === "list" && c.title
    ? `${c.title} · ${listItems.filter((i) => i.done).length}/${listItems.length}`
    : c.title || c.text || c.url || "Image";
  const canVision = ["note", "image", "link", "text"].includes(c.type);
  /* every capture type can be edited — see editableField above */
  const canEdit = true;
  const act = (txt, fn, color = T.ink2, bg = T.bg) => (
    <button onClick={fn} style={{ padding: "7px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: bg, color, cursor: "pointer" }}>{txt}</button>
  );

  /* lists open their own full editor sheet; everything else edits inline */
  const startEdit = () => {
    if (c.type === "list") { onEditList(); return; }
    setDraft(c[editableField] || "");
    setDraftUrl(c.url || "");
    setEditing(true);
    if (!expanded) onToggle();
  };
  const saveEdit = () => {
    const v = draft.trim();
    if (c.type === "note" || c.type === "task") {
      if (v && v !== (c[editableField] || "")) onEdit({ [editableField]: v });
    } else if (c.type === "image") {
      if (v !== (c.title || "")) onEdit({ title: v || null });           // caption is optional
    } else if (c.type === "link") {
      const u = draftUrl.trim();
      const changes = {};
      if (v !== (c.title || "")) changes.title = v || null;
      if (u && u !== c.url) changes.url = /^https?:\/\//i.test(u) ? u : `https://${u}`;
      if (Object.keys(changes).length) onEdit(changes);
    }
    setEditing(false);
  };
  const fieldStyle = { width: "100%", padding: "10px 12px", borderRadius: 12, border: "none", outline: "none", background: T.bg, fontSize: 13.5, color: T.ink };
  const onFieldKey = (e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditing(false); };

  /* single tap expands/collapses (onToggle); a second tap within 320ms on a
     note/task capture opens edit directly instead — dblclick alone isn't
     reliable on touch, so this tracks the gap between taps by hand and the
     onDoubleClick below just covers desktop mice for good measure */
  const handleHeaderTap = () => {
    const now = Date.now();
    if (canEdit && now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      startEdit();
    } else {
      lastTapRef.current = now;
      onToggle();
    }
  };

  return (
    <div ref={rowRef} style={{ background: done ? T.mintSoft : T.card, borderRadius: 16, padding: "12px 14px", marginBottom: 8, boxShadow: T.shadowSm, overflow: "hidden",
      transition: "background .35s ease", animation: leaving ? "fadeSlideOut .26s ease forwards" : undefined }}>
      {/* the row's main button (expand/collapse) and the list-only edit
         pencil are SIBLINGS in this wrapper div, never one nested inside
         the other — a button nested inside a button is invalid HTML and
         produces inconsistent click behavior across real browsers */}
      <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 10 }}>
        {onDone && (
          <span style={{ position: "relative", flexShrink: 0, display: "grid", placeItems: "center" }}>
            <span ref={burstRef} aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${T.mint}`, opacity: 0, pointerEvents: "none" }} />
            <button ref={checkRef} onClick={complete} aria-label={done ? "Done" : `Mark done: ${label}`} disabled={done}
              style={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", cursor: "pointer",
                border: done ? "none" : `1.6px solid ${T.ink3}`, background: done ? T.mint : "transparent", transition: "background .2s ease, border-color .2s ease" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 24, strokeDashoffset: done ? 0 : 24, transition: "stroke-dashoffset .32s ease .08s" }}>
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </button>
          </span>
        )}
        <button onClick={handleHeaderTap} onDoubleClick={() => canEdit && startEdit()}
          style={{ display: "flex", flex: 1, minWidth: 0, alignItems: expanded ? "flex-start" : "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.coral, background: T.coralSoft, padding: "3px 8px", borderRadius: 100, flexShrink: 0 }}>{c.type}</span>
          <span style={{
            ...(expanded
              ? { flex: 1, fontSize: 13.5, fontWeight: 500, whiteSpace: "pre-wrap", overflowWrap: "break-word" }
              : { flex: 1, fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
            color: done ? T.ink3 : undefined, textDecoration: done ? "line-through" : "none", textDecorationColor: T.ink3, transition: "color .3s ease",
          }}>
            {expanded && !editing ? (c.text || c.title || label) : label}
          </span>
          {!expanded && (c.tags || []).slice(0, 2).map((t) => <span key={t} style={{ fontSize: 11, color: T.mint }}>#{t}</span>)}
        </button>
        {!done && (
          <button onClick={startEdit} aria-label={`Edit ${c.type}`} title="Edit" className="hoverable"
            style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
            {Ic.pencil(T.ink3)}
          </button>
        )}
      </div>

      {expanded && editing && c.type !== "list" && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }} onClick={(e) => e.stopPropagation()}>
          {c.type === "note" ? (
            <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} aria-label="Note"
              onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
              style={{ ...fieldStyle, resize: "none", lineHeight: 1.5 }} />
          ) : (
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onFieldKey} enterKeyHint="done"
              aria-label={c.type === "task" ? "Task" : c.type === "image" ? "Caption (optional)" : "Title (optional)"}
              placeholder={c.type === "task" ? "Task" : c.type === "image" ? "Caption (optional)" : "Title (optional)"}
              style={fieldStyle} />
          )}
          {c.type === "link" && (
            <input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} onKeyDown={onFieldKey} enterKeyHint="done"
              inputMode="url" aria-label="Link URL" placeholder="https://…" style={fieldStyle} />
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
            {act("Save", saveEdit, "#fff", T.coralGrad)}
            {act("Cancel", () => setEditing(false))}
          </div>
        </div>
      )}

      {c.type === "image" && c.imageUrl && expanded && <CaptureImage src={c.imageUrl} />}
      {c.type === "link" && c.url && expanded && <LinkCard url={c.url} title={c.previewTitle} image={c.previewImage} site={c.previewSite} />}
      {c.type === "list" && expanded && (
        <div style={{ margin: "10px 0 0" }}>
          <ListSections items={listItems} title={c.title} renderItem={(it, ix) => (
              <button key={ix} onClick={() => onToggleItem(ix)}
                style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "7px 2px", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, border: it.done ? "none" : `1.6px solid ${T.ink3}`, background: it.done ? T.coralGrad : "transparent", display: "grid", placeItems: "center", transition: "all .25s" }}>
                  {it.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: it.done ? T.ink3 : T.ink, textDecoration: it.done ? "line-through" : "none", textDecorationColor: T.ink3 }}>{it.text}</span>
              </button>
          )} />
        </div>
      )}
      {expanded && !editing && (c.tags || []).length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {c.tags.map((t) => <span key={t} style={{ fontSize: 11, color: T.mint }}>#{t}</span>)}
        </div>
      )}
      {expanded && !editing && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {canVision && act("→ Vision", onVision, T.mint, T.mintSoft)}
          {act("Schedule", onSchedule, T.sky, T.skySoft)}
          <button onClick={release} aria-label="Delete" title="Delete"
            style={{ width: 44, height: 44, borderRadius: 16, display: "grid", placeItems: "center", background: T.bg, color: T.ink2, cursor: "pointer", flexShrink: 0 }}>
            {Ic.trash(T.ink2)}
          </button>
        </div>
      )}
    </div>
  );
}
