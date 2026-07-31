import { useState } from "react";
import { T } from "../theme";
import { Sheet } from "../components/Sheet";

export function ListEditorSheet({ capture, onSave, onClose }) {
  const initialItems = (capture.items || []).map((i) => (typeof i === "string" ? { text: i, done: false } : i));
  const [title, setTitle] = useState(capture.title || "");
  const [itemsText, setItemsText] = useState(initialItems.map((i) => i.text).join("\n"));

  const save = () => {
    const lines = itemsText.split("\n").map((l) => l.trim()).filter(Boolean);
    /* keep each existing item's done-state where the text is unchanged;
       new/edited lines start unchecked */
    const items = lines.map((text) => {
      const existing = initialItems.find((i) => i.text === text);
      return { text, done: existing ? existing.done : false };
    });
    if (!title.trim() && !items.length) return;
    onSave({ title: title.trim(), items });
  };

  return (
    <Sheet onClose={onClose} title="Edit list">
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} enterKeyHint="next"
        placeholder="List name"
        style={{ width: "100%", padding: "14px 16px", borderRadius: 15, border: "none", outline: "none", background: T.bg, fontSize: 15, fontWeight: 650 }} />
      <textarea value={itemsText} onChange={(e) => setItemsText(e.target.value)}
        placeholder="One item per line" rows={7}
        style={{ width: "100%", marginTop: 10, padding: "14px 16px", borderRadius: 15, border: "none", outline: "none", resize: "none", background: T.bg, fontSize: 14, lineHeight: 1.7 }} />
      <button onClick={save} style={{ width: "100%", marginTop: 18, padding: "16px 0", borderRadius: 17, background: T.coralGrad, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 24px rgba(255,107,94,.3)" }}>
        Save changes
      </button>
    </Sheet>
  );
}
