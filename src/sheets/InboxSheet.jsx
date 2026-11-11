import { useRef, useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Card } from "../components/Card";
import { Sheet } from "../components/Sheet";
import { GROCERY_WORDS } from "../constants";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { CaptureRow } from "./CaptureRow";
import { ListEditorSheet } from "./ListEditorSheet";
import { KindTabs } from "../components/KindTabs";
import { ListItemsInput } from "../components/ListItemsInput";

export function InboxSheet({ captures, addCapture, releaseCapture, completeCapture, toggleListItem, updateCapture, captureToVision, fetchLinkPreview, onSchedule, onClose, showToast }) {
  useBodyScrollLock(true);
  /* null = Thought (the default: just empty your head), or list | image.
     No separate "Task" tab here: a thought already becomes a task when
     you Schedule it — two tabs for the same quick line was repetition. Same tab control as the New task sheet, so the two places
     feel like one app — the Inbox just starts on "Thought" because its
     job is getting things out of your head fast. */
  const [type, setType] = useState(null);
  const [free, setFree] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState([""]);
  const [imgUrl, setImgUrl] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [editingListId, setEditingListId] = useState(null);
  const itemsRef = useRef(null);

  const parseTags = (s) => (s.match(/#[\w-]+/g) || []).map((t) => t.slice(1));
  const stripTags = (s) => s.replace(/#[\w-]+/g, "").trim();
  const isUrl = (s) => /^https?:\/\/\S+$/i.test(s.trim());
  /* a direct image file — anything else that's still a URL gets a fetched
     link card instead of an <img> that would just fail to load */
  const isImageUrl = (s) => /^https?:\/\/\S+\.(jpe?g|png|webp|gif|avif|svg)(\?\S*)?(#\S*)?$/i.test(s.trim());

  const sendFree = () => {
    const v = free.trim(); if (!v) return;
    const tags = parseTags(v);
    if (isUrl(v)) addCapture({ type: "link", url: v, tags }, (real) => fetchLinkPreview(real.id, v));
    else addCapture({ type: "note", text: stripTags(v), tags });
    setFree("");
  };
  const sendList = () => {
    const clean = items.map((s) => s.trim()).filter(Boolean);
    const v = title.trim() || (clean.length ? "List" : ""); if (!v) return;
    addCapture({ type: "list", title: v, items: items.map((s) => s.trim()).filter(Boolean).map((text) => ({ text, done: false })), tags: [] });
    setTitle(""); setItems([""]);
  };
  const sendImage = () => {
    const url = imgUrl.trim(); if (!url) return;
    const titleVal = title.trim();
    if (isImageUrl(url)) addCapture({ type: "image", title: titleVal, imageUrl: url, tags: [] });
    else addCapture({ type: "link", title: titleVal, url, tags: [] }, (real) => fetchLinkPreview(real.id, url));
    setTitle(""); setImgUrl("");
  };

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

  /* composer fields: the same soft filled field as the New task sheet */
  const field = { width: "100%", padding: "14px 16px", borderRadius: 15, border: "none", outline: "none", background: T.bg, fontSize: 15, fontWeight: 500 };

  const pill = (active) => ({
    padding: "7px 14px", borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    background: active ? T.coralGrad : T.bg, color: active ? "#fff" : T.ink2, transition: "all .2s",
  });

  return (
    <Sheet side onClose={onClose} title="Inbox" subtitle="Capture anything. Decide later.">
      {/* composer */}
      <Card style={{ padding: 16, boxShadow: T.shadowSm }}>
        <KindTabs kinds={[["thought", "Thought"], ["list", "List"], ["image", "Image"]]}
          value={type ?? "thought"} onChange={(k) => {
            const next = k === "thought" ? null : k;
            if (next === type) return;
            /* carry what you've typed across where it makes sense (a
               thought becomes the list name); never carry a list
               name into an image title or back */
            if (type === null && next === "list") { setTitle(free.trim()); setFree(""); }
            else if (next === "image" || type === "image") setTitle("");
            setType(next);
          }} />

        {type === null && (
          <textarea value={free} onChange={(e) => setFree(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFree(); } }}
            onPaste={(e) => {
              const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
              if (item) { e.preventDefault(); const f = item.getAsFile(); const r = new FileReader(); r.onload = () => addCapture({ type: "image", imageUrl: r.result, tags: [] }); r.readAsDataURL(f); }
            }}
            placeholder="Anything on your mind. #tag to tag, paste a link or image…"
            rows={3} style={{ ...field, resize: "none", lineHeight: 1.5 }} />
        )}
        {type === "list" && (<>
          <input value={title} onChange={(e) => setTitle(e.target.value)} enterKeyHint="next" autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); itemsRef.current?.focus(); } }}
            placeholder="List name — e.g. Groceries" style={{ ...field, fontWeight: 600 }} />
          <div style={{ marginTop: 10 }}>
            <ListItemsInput items={items} onChange={setItems} firstRef={itemsRef} onSubmit={sendList} />
          </div>
        </>)}
        {type === "image" && (<>
          <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="Paste an image or link URL" autoFocus inputMode="url" autoCapitalize="none" autoCorrect="off"
            onKeyDown={(e) => e.key === "Enter" && sendImage()}
            style={field} />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
            onKeyDown={(e) => e.key === "Enter" && sendImage()}
            style={{ ...field, marginTop: 10, fontSize: 14 }} />
          {imgUrl && isImageUrl(imgUrl) && (
            <img src={imgUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }}
              style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 160, objectFit: "cover" }} />
          )}
          {imgUrl && isUrl(imgUrl) && !isImageUrl(imgUrl) && (
            <p style={{ fontSize: 12, color: T.ink3, marginTop: 8 }}>Not a direct image link — this will be saved as a link with a preview.</p>
          )}
        </>)}

        {grocerySuggest && (
          <button onClick={() => { addCapture({ type: "list", title: "Groceries", items: [{ text: free.replace(GROCERY_WORDS, "").trim(), done: false }], tags: [] }); setFree(""); }}
            style={{ marginTop: 10, padding: "6px 12px", borderRadius: 100, background: T.mintSoft, color: T.mint, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Add to Groceries list?
          </button>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          {type === null && (
            <button onPointerDown={(e) => { e.preventDefault(); startVoice(); }} aria-label="Capture by voice" style={{ width: 44, height: 44, borderRadius: 15, background: T.bg, display: "grid", placeItems: "center", cursor: "pointer" }}>
              {Ic.mic(T.ink2)}
            </button>
          )}
          <button
            onPointerDown={(e) => {
              e.preventDefault(); /* don't blur the field — the reflow was eating the tap */
              (type === null ? sendFree : type === "list" ? sendList : sendImage)();
            }}
            aria-label="Capture"
            style={{ width: 44, height: 44, borderRadius: 15, background: T.coralGrad, display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(255,107,94,.3)" }}>
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
                onVision={() => captureToVision(c)} onSchedule={() => onSchedule(c)} onRelease={() => releaseCapture(c)} onDone={() => completeCapture(c)}
                onToggleItem={(ix) => toggleListItem(c.id, ix)} onEdit={(changes) => { updateCapture(c.id, changes); if (changes.url && changes.url !== c.url) fetchLinkPreview(c.id, changes.url); }}
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
