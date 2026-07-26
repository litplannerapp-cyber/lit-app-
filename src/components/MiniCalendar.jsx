import { useState } from "react";
import { T } from "../theme";
import { Sheet } from "./Sheet";
import { toDateKey, keyToDate } from "../utils/date";

/* The other half of "let me reach any date" — a full month grid, not just
   the 7-day strip. Opens as the same responsive Sheet as everything else. */
export function MiniCalendar({ selectedDay, onPick, onClose }) {
  const selDate = keyToDate(selectedDay);
  const [viewMonth, setViewMonth] = useState(new Date(selDate.getFullYear(), selDate.getMonth(), 1));
  const todayKey = toDateKey();

  const first = viewMonth;
  const startOffset = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));

  return (
    <Sheet onClose={onClose} title="Jump to a date">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="Previous month" className="hoverable"
          style={{ width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div className="fr" style={{ fontSize: 16, fontWeight: 600 }}>{viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
        <button onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label="Next month" className="hoverable"
          style={{ width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: T.ink3 }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = toDateKey(d);
          const sel = k === selectedDay;
          const isToday = k === todayKey;
          return (
            <button key={i} onClick={() => onPick(d)} className="hoverable"
              style={{ aspectRatio: "1", borderRadius: 12, display: "grid", placeItems: "center", cursor: "pointer",
                background: sel ? T.coralGrad : "transparent", color: sel ? "#fff" : T.ink,
                border: isToday && !sel ? `1.5px solid ${T.coral}` : "none", fontSize: 13.5, fontWeight: sel ? 700 : 500 }}>
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <button onClick={() => onPick(new Date())} style={{ width: "100%", marginTop: 18, padding: "13px 0", borderRadius: 14, background: T.bg, color: T.ink2, fontWeight: 650, fontSize: 13.5, cursor: "pointer" }}>
        Back to today
      </button>
    </Sheet>
  );
}
