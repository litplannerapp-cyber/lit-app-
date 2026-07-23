import { useState } from "react";
import { T } from "../theme";

export function InlineAdd({ placeholder, onAdd }) {
  const [v, setV] = useState("");
  return (
    <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} enterKeyHint="done"
      onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }}
      style={{ width: "100%", marginTop: 8, padding: "9px 12px", borderRadius: 12, border: "none", outline: "none", background: T.bg, fontSize: 13 }} />
  );
}
