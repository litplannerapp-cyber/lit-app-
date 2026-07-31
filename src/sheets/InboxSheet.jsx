import { useRef, useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Card } from "../components/Card";
import { Sheet } from "../components/Sheet";
import { GROCERY_WORDS } from "../constants";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { CaptureRow } from "./CaptureRow";
import { ListEditorSheet } from "./ListEditorSheet";

export function InboxSheet({ captures, addCapture, releaseCapture, toggleListItem, updateCapture, captureToTask, captureToVision, onSchedule, onClose, showToast }) {
  useBodyScrollLock(true);
  const [type, setType] = useState(null); // null | task | list | image
  const [free, setFree] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [editingListId, setEditingListId] = useState(null);
  const itemsRef = useRef();

  const parseTags = (s) => (s.match(/#[\w-]+/g) || []).map((t) => t.slice(1));
  const stripTags = (s) => s.replace(/#[\w-]+/g, "").trim();
  const isUrl = (s) => /^https?:\/\/\S+$/i.test(s.trim());

  const sendFree = () => {
    const v = free.trim(); if (!v) return;
    const tags = parseTags(v);
    if (isUrl(v)) addCapture({ type: "link", url: v, tags });
    else addCapture({ type: "note", text: stripTags(v), tags });
    setFree("");
  };
  const sendTask = () => { const v = title.trim(); if (!v) return; addCapture({ type: "task", title: v, tags: parseTags(v) }); setTitle(""); };
  const sendList = () => {
    const v = title.trim(); if (!v) return;
    addCapture({ type: "list", title: v, items: items.split("\n").map((s) => s.trim()).filter(Boolean).map((text) => ({ text, done: false })), tags: [] });
    setTitle(""); setItems("");
  };
  const sendImage = () => { if (!imgUrl.trim()) return; addCapture({ type: "image", title: title.trim(), imageUrl: imgUrl.trim(), tags: [] }); setTitle(""); setImgUrl(""); };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast("Voice capture isn't available in this browser"); return; }
    const rec = new SR(); rec.lang = "en-US";
    rec.onresult = (e) => setFree((f) => (f + " " + e.results[0][0].transcript).trim());
    rec.start(); showToast("Listening…");
  };

  const grocerySuggest = type === null && GROCERY_WORDS.test(free.trim());

  const typesInData = [...new Set(captures.map((c) => c.type))];
  const tagsInData = [...new Set(captures.flatMap((c) => c.tags || []))];
  const visible = captures.filter((c) => {
    if (typeFilter && c.type !== typeFilter) return false;
    if (tagFilter && !(c.tags || []).includes(tagFilter)) return false;
    const itemText = (c.items || []).map((i) => (typeof i === "string" ? i : i.text)).join(" ");
    const hay = `${c.title || ""} ${c.text || ""} ${c.url || ""} ${itemText}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const pill = (active) => ({
    padding: "7px 14px", borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    background: active ? T.coralGrad : T.bg, color: active ? "#fff" : T.ink2, transition: "all .2s",
  });

  return (
    <Sheet onClose={onClose} title="Inbox" subtitle="Capture anything. Decide later.">
      {/* composer */}
      <Card style={{ padding: 16, boxShadow: T.shadowSm }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["task", "list", "image"].map((t) => (
            <button key={t} style={pill(type === t)} onClick={() => setType(type === t ? null : t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {type === null && (
          <textarea value={free} onChange={(e) => setFree(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFree(); } }}
            onPaste={(e) => {
              const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
              if (item) { e.preventDefault(); const f = item.getAsFile(); const r = new FileReader(); r.onload = () => addCapture({ type: "image", imageUrl: r.result, tags: [] }); r.readAsDataURL(f); }
            }}
            placeholder="Anything on your mind. #tag to tag, paste a link or image…"
            rows={2} style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 14.5, background: "transparent", lineHeight: 1.5 }} />
        )}
        {type === "task" && (
          <input value={title} onChange={(e) => setTitle(e.target.value)} enterKeyHint="done"
            onKeyDown={(e) => e.key === "Enter" && sendTask()}
            placeholder="Task title" style={{ width: "100%", border: "none", outline: "none", fontSize: 14.5, background: "transparent" }} />
        )}
        {type === "list" && (<>
          <input value={title} onChange={(e) => setTitle(e.target.value)} enterKeyHint="next"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); itemsRef.current?.focus(); } }}
            placeholder="List name" style={{ width: "100%", border: "none", outline: "none", fontSize: 14.5, fontWeight: 600, background: "transparent", marginBottom: 8 }} />
          <textarea ref={itemsRef} value={items} onChange={(e) => setItems(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendList(); } }}
            placeholder={"One item per line\n⌘+Enter to save"} rows={3}
            style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 14, background: "transparent", lineHeight: 1.6 }} />
        </>)}
        {type === "image" && (<>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
            style={{ width: "100%", border: "none", outline: "none", fontSize: 14.5, background: "transparent", marginBottom: 8 }} />
          <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="Paste an image URL"
            onKeyDown={(e) => e.key === "Enter" && sendImage()}
            style={{ width: "100%", border: "none", outline: "none", fontSize: 14, background: "transparent" }} />
          {imgUrl && isUrl(imgUrl) && <img src={imgUrl} alt="" style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 160, objectFit: "cover" }} />}
        </>)}

        {grocerySuggest && (
          <button onClick={() => { addCapture({ type: "list", title: "Groceries", items: [{ text: free.replace(GROCERY_WORDS, "").trim(), done: false }], tags: [] }); setFree(""); }}
            style={{ marginTop: 10, padding: "6px 12px", borderRadius: 100, background: T.mintSoft, color: T.mint, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Add to Groceries list?
          </button>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button onPointerDown={(e) => { e.preventDefault(); startVoice(); }} aria-label="Capture by voice" style={{ width: 40, height: 40, borderRadius: 14, background: T.bg, display: "grid", placeItems: "center", cursor: "pointer" }}>
            {Ic.mic(T.ink2)}
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault(); /* don't blur the field — the reflow was eating the tap */
              (type === null ? sendFree : type === "task" ? sendTask : type === "list" ? sendList : sendImage)();
            }}
            aria-label="Capture"
            style={{ width: 40, height: 40, borderRadius: 14, background: T.coralGrad, display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(255,107,94,.3)" }}>
            {Ic.send()}
          </button>
        </div>
      </Card>

      {/* review grid */}
      {captures.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search captures"
            style={{ width: "100%", padding: "11px 16px", borderRadius: 14, border: "none", outline: "none", background: T.bg, fontSize: 13.5 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {typesInData.map((t) => (
              <button key={t} style={pill(typeFilter === t)} onClick={() => setTypeFilter(typeFilter === t ? null : t)}>{t}</button>
            ))}
            {tagsInData.map((t) => (
              <button key={t} style={{ ...pill(tagFilter === t), background: tagFilter === t ? T.mint : T.mintSoft, color: tagFilter === t ? "#fff" : T.mint }}
                onClick={() => setTagFilter(tagFilter === t ? null : t)}>#{t}</button>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            {visible.map((c) => (
              <CaptureRow key={c.id} c={c} expanded={expanded === c.id} onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
                onTask={() => captureToTask(c)} onVision={() => captureToVision(c)} onSchedule={() => onSchedule(c)} onRelease={() => releaseCapture(c.id)}
                onToggleItem={(ix) => toggleListItem(c.id, ix)} onEdit={(changes) => updateCapture(c.id, changes)}
                onEditList={() => setEditingListId(c.id)} />
            ))}
            {visible.length === 0 && <p style={{ fontSize: 13, color: T.ink3, textAlign: "center", padding: "20px 0" }}>No captures match.</p>}
          </div>
        </div>
      )}

      {editingListId && captures.find((c) => c.id === editingListId) && (
        <ListEditorSheet
          capture={captures.find((c) => c.id === editingListId)}
          onSave={(changes) => { updateCapture(editingListId, changes); setEditingListId(null); }}
          onClose={() => setEditingListId(null)}
        />
      )}
    </Sheet>
  );
}
