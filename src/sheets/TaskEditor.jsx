import { useLayoutEffect, useRef, useState } from "react";
import { T } from "../theme";
import { Ic } from "../icons/Icons";
import { Sheet } from "../components/Sheet";
import { Eyebrow } from "../components/Eyebrow";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { toDateKey, addDays } from "../utils/date";
import { GROUP_PRESETS, PALETTE } from "../constants";

/* one-line URL check, same rule as the Inbox composer; "www." links get
   https:// added so they open and preview */
const normaliseUrl = (s) => {
  const v = s.trim();
  if (/^https?:\/\/\S+$/i.test(v)) return v;
  if (/^www\.\S+\.\S+$/i.test(v) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v)) return `https://${v}`;
  return null;
};
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

/* A new thing can be a Task, a List or a Link — picked with the tabs at
   the top, so a shopping list or a saved link doesn't need a detour via
   the Inbox. Lists and links are saved as Inbox captures (that's where
   they live); with a date picked, they're also put on that day, linked
   to the capture — exactly what "Schedule" from the Inbox does.
   onSaveCapture(capture, dateKey | null) does the saving (App.jsx).
   The tabs only show for something new: editing a task, or scheduling
   an existing capture, is always the Task form. */
export function TaskEditor({ initial, todayKey, onSave, onToInbox, onSaveCapture, allowKinds = false, onClose }) {
  useBodyScrollLock(true);
  const editing = !!initial?.id;
  const [kind, setKind] = useState("task"); // task | list | link
  const [listTitle, setListTitle] = useState("");
  const [listItems, setListItems] = useState([""]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkError, setLinkError] = useState(false);
  const itemRefs = useRef([]);
  const [text, setText] = useState(initial?.text || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [dateKey, setDateKey] = useState(initial?.dateKey || todayKey); // null = no date → goes to Inbox
  const [more, setMore] = useState(false);
  const [time, setTime] = useState(initial?.time || "");
  const [endTime, setEndTime] = useState(initial?.endTime || "");
  const [period, setPeriod] = useState(initial?.period || null); // morning | afternoon | evening
  const [groupColor, setGroupColor] = useState(initial?.group?.color || null);
  const [groupName, setGroupName] = useState(initial?.group?.name || "");
  const [priority, setPriority] = useState(!!initial?.priority);
  const [reminder, setReminder] = useState(!!initial?.reminder);
  const tomorrowKey = toDateKey(addDays(new Date(), 1));

  const saveList = (toDay) => {
    const items = listItems.map((t) => t.trim()).filter(Boolean).map((t) => ({ text: t, done: false }));
    const title = listTitle.trim() || "List";
    if (!items.length && !listTitle.trim()) return;
    onSaveCapture({ type: "list", title, items, tags: [] }, toDay ? dateKey : null);
  };
  const saveLink = (toDay) => {
    const url = normaliseUrl(linkUrl);
    if (!url) { setLinkError(true); return; }
    const title = linkTitle.trim();
    onSaveCapture({ type: "link", url, ...(title ? { title } : {}), tags: [], _label: title || hostOf(url) }, toDay ? dateKey : null);
  };

  const save = () => {
    if (kind === "list") return saveList(!!dateKey);
    if (kind === "link") return saveLink(!!dateKey);
    const v = text.trim(); if (!v) return;
    /* no date selected → this isn't a scheduled task anymore, it's a capture.
       Same rule as the "No date yet?" link below, just reached by deselecting
       instead of tapping a separate button. */
    if (!dateKey) { onToInbox(v); return; }
    onSave({
      text: v, notes: notes.trim(), dateKey, time, endTime, period, priority,
      reminder: !!time && reminder,
      group: groupColor ? { name: groupName.trim() || "Group", color: groupColor } : null,
    });
  };

  /* list rows behave like iPhone Reminders: Return makes the next row,
     Backspace on an empty row removes it, pasting several lines makes
     several rows */
  /* focus moves in a layout effect, right after the new row renders and
     before the next key is handled — so fast typing never spills the
     next letters into the previous row */
  const pendingFocus = useRef(null);
  const focusRow = (i) => { pendingFocus.current = i; };
  useLayoutEffect(() => {
    if (pendingFocus.current == null) return;
    itemRefs.current[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  });
  const setRow = (i, v) => setListItems((a) => a.map((x, j) => (j === i ? v : x)));
  const rowKeyDown = (i, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setListItems((a) => [...a.slice(0, i + 1), "", ...a.slice(i + 1)]);
      focusRow(i + 1);
    } else if (e.key === "Backspace" && listItems[i] === "" && listItems.length > 1) {
      e.preventDefault();
      setListItems((a) => a.filter((_, j) => j !== i));
      focusRow(Math.max(0, i - 1));
    }
  };
  const rowPaste = (i, e) => {
    const lines = e.clipboardData.getData("text").split(/\r?\n/).map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    setListItems((a) => [...a.slice(0, i), ...(a[i] ? [a[i]] : []), ...lines, ...a.slice(i + 1)]);
    focusRow(i + lines.length);
  };

  /* tapping the already-active pill deselects it — date becomes "none",
     which (per the rule above) sends the task to the Inbox on save */
  const datePill = (label, key) => (
    <button onClick={() => setDateKey(dateKey === key ? null : key)} style={{ padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", background: dateKey === key ? T.coralGrad : T.bg, color: dateKey === key ? "#fff" : T.ink2 }}>
      {label}
    </button>
  );

  return (
    <Sheet onClose={onClose} title={editing ? "Edit task" : kind === "list" ? "New list" : kind === "link" ? "New link" : "New task"}>
      {allowKinds && !editing && (
        <div role="tablist" aria-label="What are you adding?" style={{ display: "flex", gap: 4, padding: 4, borderRadius: 14, background: T.bg, marginBottom: 14 }}>
          {[["task", "Task"], ["list", "List"], ["link", "Link"]].map(([k, label]) => {
            const on = kind === k;
            return (
              <button key={k} role="tab" aria-selected={on} onClick={() => { setKind(k); setLinkError(false); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 0", borderRadius: 11, cursor: "pointer", fontSize: 13.5, fontWeight: on ? 700 : 600,
                  background: on ? T.card : "transparent", color: on ? T.ink : T.ink2, boxShadow: on ? T.shadowSm : "none", transition: "all .2s ease" }}>
                {k === "task" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={on ? T.coral : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="5" /><path d="M8.5 12.3l2.4 2.4 4.8-5" /></svg>}
                {k === "list" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={on ? T.coral : "currentColor"} strokeWidth="2" strokeLinecap="round"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" fill={on ? T.coral : "currentColor"} /><circle cx="4.5" cy="12" r="1" fill={on ? T.coral : "currentColor"} /><circle cx="4.5" cy="18" r="1" fill={on ? T.coral : "currentColor"} /></svg>}
                {k === "link" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={on ? T.coral : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>}
                {label}
              </button>
            );
          })}
        </div>
      )}

      {kind === "list" && (
        <div className="rise">
          <input value={listTitle} onChange={(e) => setListTitle(e.target.value)} enterKeyHint="next" autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); itemRefs.current[0]?.focus(); } }}
            placeholder="List name — e.g. Groceries"
            style={{ width: "100%", padding: "15px 16px", borderRadius: 15, border: "none", outline: "none", background: T.bg, fontSize: 15.5, fontWeight: 600 }} />
          <div style={{ marginTop: 10, padding: "6px 6px 6px 14px", borderRadius: 15, background: T.bg }}>
            {listItems.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden="true" style={{ width: 17, height: 17, borderRadius: 6, border: `1.6px solid ${T.ink3}`, flexShrink: 0, opacity: v ? 1 : 0.5 }} />
                <input ref={(el) => { itemRefs.current[i] = el; }} value={v} onChange={(e) => setRow(i, e.target.value)}
                  onKeyDown={(e) => rowKeyDown(i, e)} onPaste={(e) => rowPaste(i, e)} enterKeyHint="next"
                  placeholder={i === 0 ? "First item" : "Add item"} aria-label={`Item ${i + 1}`}
                  style={{ flex: 1, minWidth: 0, padding: "10px 4px", border: "none", outline: "none", background: "transparent", fontSize: 14.5, fontWeight: 500, color: T.ink,
                    borderBottom: i < listItems.length - 1 ? `1px solid ${T.hairline}` : "none" }} />
                {listItems.length > 1 && (
                  <button aria-label={`Remove ${v || "item"}`} onClick={() => setListItems((a) => a.filter((_, j) => j !== i))}
                    style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => { setListItems((a) => [...a, ""]); focusRow(listItems.length); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0 8px", fontSize: 13.5, fontWeight: 650, color: T.coral, cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add item
            </button>
          </div>
          <p style={{ fontSize: 12, color: T.ink3, margin: "8px 2px 0", lineHeight: 1.45 }}>Return adds the next item. Pasting several lines adds them all.</p>
        </div>
      )}

      {kind === "link" && (
        <div className="rise">
          <input value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setLinkError(false); }} enterKeyHint="done" autoFocus inputMode="url" autoCapitalize="none" autoCorrect="off"
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Paste a link — https://…"
            style={{ width: "100%", padding: "15px 16px", borderRadius: 15, border: linkError ? `1.5px solid ${T.coral}` : "1.5px solid transparent", outline: "none", background: T.bg, fontSize: 15.5, fontWeight: 500 }} />
          {linkError && <p style={{ fontSize: 12, color: T.coral, fontWeight: 600, margin: "8px 2px 0" }}>That doesn't look like a link yet.</p>}
          <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} enterKeyHint="done"
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Title (optional) — e.g. Running shoes"
            style={{ width: "100%", marginTop: 10, padding: "13px 16px", borderRadius: 15, border: "none", outline: "none", background: T.bg, fontSize: 14, fontWeight: 500 }} />
          <p style={{ fontSize: 12, color: T.ink3, margin: "8px 2px 0", lineHeight: 1.45 }}>Lit fetches the preview for you.</p>
        </div>
      )}

      {kind === "task" && (
      /* single-line input on purpose: iOS keyboard shows "done", not "new line" */
      <input value={text} onChange={(e) => setText(e.target.value)} enterKeyHint="done"
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="What needs doing?"
        style={{ width: "100%", padding: "15px 16px", borderRadius: 15, border: "none", outline: "none", background: T.bg, fontSize: 15.5, fontWeight: 500 }} />
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
        {datePill("Today", todayKey)}
        {datePill("Tomorrow", tomorrowKey)}
        <input type="date" value={dateKey || ""} onChange={(e) => setDateKey(e.target.value || null)}
          style={{ padding: "7px 12px", borderRadius: 100, border: "none", outline: "none", background: dateKey && dateKey !== todayKey && dateKey !== tomorrowKey ? T.coralSoft : T.bg, fontSize: 12.5, color: T.ink2, WebkitAppearance: "none", appearance: "none" }} />
      </div>

      {!dateKey && (
        <p style={{ fontSize: 12, color: T.coral, marginTop: 10, fontWeight: 600 }} className="rise">
          {kind === "task" ? "No date selected — this will be saved to the Inbox instead." : "No date selected — it goes to the Inbox only."}
        </p>
      )}

      {kind === "task" && <button onClick={() => setMore(!more)} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14, fontSize: 13, fontWeight: 600, color: T.ink2, cursor: "pointer" }}>
        More options <span style={{ transform: more ? "rotate(90deg)" : "none", transition: "transform .2s", display: "inline-flex" }}>{Ic.chevR(T.ink2)}</span>
      </button>}

      {kind === "task" && more && (
        <div style={{ marginTop: 14 }} className="rise">
          <Eyebrow style={{ marginBottom: 8 }}>When in the day</Eyebrow>
          <div style={{ display: "flex", gap: 8 }}>
            {[["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]].map(([k, label]) => (
              <button key={k} onClick={() => setPeriod(period === k ? null : k)}
                style={{ flex: 1, padding: "9px 0", borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: period === k ? T.coralGrad : T.bg, color: period === k ? "#fff" : T.ink2, transition: "all .2s" }}>
                {label}
              </button>
            ))}
          </div>

          <Eyebrow style={{ margin: "16px 0 8px" }}>Time</Eyebrow>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Start time"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 13, border: "none", outline: "none", background: T.bg, fontSize: 13.5 }} />
            <span style={{ fontSize: 13, color: T.ink3 }}>to</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} aria-label="End time"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 13, border: "none", outline: "none", background: T.bg, fontSize: 13.5 }} />
          </div>

          {time && (
            <button onClick={() => setReminder(!reminder)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 12, padding: "11px 14px", borderRadius: 13, background: T.bg, cursor: "pointer" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>Remind me at {time}</span>
              <span style={{ position: "relative", width: 34, height: 20, borderRadius: 10, background: reminder ? T.coralGrad : T.stroke, transition: "background .2s", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 3, left: reminder ? 19 : 3, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "left .2s" }} />
              </span>
            </button>
          )}

          <Eyebrow style={{ margin: "16px 0 8px" }}>Notes</Eyebrow>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 15, border: "none", outline: "none", resize: "none", background: T.bg, fontSize: 13.5, lineHeight: 1.5 }} />

          <Eyebrow style={{ margin: "16px 0 8px" }}>Group</Eyebrow>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GROUP_PRESETS.map((g) => {
              const active = groupColor === g.color && groupName === g.name;
              return (
                <button key={g.name} onClick={() => { if (active) { setGroupColor(null); setGroupName(""); } else { setGroupColor(g.color); setGroupName(g.name); } }}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: active ? `${g.color}22` : T.bg, color: active ? g.color : T.ink2 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 5, background: g.color }} />{g.name}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setGroupColor(groupColor === c ? null : c)} aria-label={`Group color ${c}`}
                style={{ width: 24, height: 24, borderRadius: 12, background: c, cursor: "pointer", outline: groupColor === c ? `2.5px solid ${T.ink}` : "none", outlineOffset: 2 }} />
            ))}
          </div>
          {groupColor && (
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Name this group" enterKeyHint="done"
              style={{ marginTop: 10, padding: "9px 14px", borderRadius: 100, border: "none", outline: "none", background: T.bg, fontSize: 13, width: "100%" }} />
          )}

          <Eyebrow style={{ margin: "16px 0 8px" }}>Priority</Eyebrow>
          <button onClick={() => setPriority(!priority)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: priority ? T.coralSoft : T.bg, color: priority ? T.coral : T.ink2, transition: "all .2s" }}>
            {Ic.star(priority, priority ? T.coral : T.ink3)}
            {priority ? "Marked as priority" : "Mark as priority"}
          </button>
        </div>
      )}

      {/* onPointerDown + preventDefault, not onClick: iOS Safari's keyboard-dismiss
          reflow can eat the click that would otherwise fire after a still-focused
          text field blurs — same fix as the Inbox composer's send button */}
      <button onPointerDown={(e) => { e.preventDefault(); save(); }} style={{ width: "100%", marginTop: 22, padding: "16px 0", borderRadius: 17, background: T.coralGrad, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 24px rgba(255,107,94,.3)" }}>
        {!dateKey ? (kind === "task" ? "Move to Inbox" : "Save to the Inbox") : editing ? "Save changes" : "Add to the day"}
      </button>
      {!editing && dateKey && (
        <button onPointerDown={(e) => {
          e.preventDefault();
          if (kind === "list") saveList(false);
          else if (kind === "link") saveLink(false);
          else if (text.trim()) onToInbox(text.trim());
        }} style={{ display: "block", width: "100%", marginTop: 12, fontSize: 13, color: T.ink2, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
          No date yet? Keep it in the Inbox
        </button>
      )}
    </Sheet>
  );
}
