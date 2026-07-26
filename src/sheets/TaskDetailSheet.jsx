import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Sheet } from "../components/Sheet";
import { Eyebrow } from "../components/Eyebrow";
import { Check } from "../components/Check";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { keyToDate } from "../utils/date";

export function TaskDetailSheet({ task: t, onEdit, onToggleDone, onClose }) {
  useBodyScrollLock(true);
  const dateLabel = keyToDate(t.dateKey).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const line = (label, value) => value ? (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 2px", borderBottom: `1px solid ${T.hairline}` }}>
      <span style={{ fontSize: 12.5, color: T.ink3, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  ) : null;
  return (
    <Sheet onClose={onClose} title="">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ marginTop: 4 }}><Check done={t.done} onToggle={onToggleDone} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="fr" style={{ fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1.3, color: t.done ? T.ink3 : T.ink, textDecoration: t.done ? "line-through" : "none", textDecorationColor: T.ink3, overflowWrap: "break-word" }}>
            {t.text}
          </h2>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {t.top3 && <span style={{ fontSize: 11, fontWeight: 700, color: T.coral, background: T.coralSoft, padding: "4px 10px", borderRadius: 100 }}>Top 3</span>}
            {t.priority && <span style={{ fontSize: 11, fontWeight: 700, color: T.coral, background: T.coralSoft, padding: "4px 10px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5 }}>{Ic.star(true, T.coral)} Priority</span>}
            {t.group && (
              <span style={{ fontSize: 11, fontWeight: 700, color: t.group.color, background: `${t.group.color}22`, padding: "4px 10px", borderRadius: 100, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: t.group.color }} />{t.group.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {line("Date", dateLabel)}
        {line("Time", t.time ? `${t.time}${t.endTime ? `–${t.endTime}` : ""}` : null)}
        {line("When", t.period ? t.period[0].toUpperCase() + t.period.slice(1) : null)}
        {line("Reminder", t.reminder ? `On · ${t.time}` : null)}
      </div>

      {t.notes && (
        <div style={{ marginTop: 18 }}>
          <Eyebrow style={{ marginBottom: 8 }}>Notes</Eyebrow>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: T.ink2, margin: 0, background: T.bg, padding: "14px 16px", borderRadius: 15, whiteSpace: "pre-wrap" }}>{t.notes}</p>
        </div>
      )}

      <button onClick={onEdit} style={{ width: "100%", marginTop: 24, padding: "15px 0", borderRadius: 17, background: T.bg, color: T.ink, fontSize: 14.5, fontWeight: 650, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {Ic.pencil(T.ink)} Edit task
      </button>
    </Sheet>
  );
}
