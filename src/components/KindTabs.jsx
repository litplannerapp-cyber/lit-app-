import { T } from "../theme";

/* The segmented "what are you adding?" control, shared by the New task
   sheet (Task · List · Link) and the Inbox composer (Thought · Task ·
   List · Image), so both places look and behave the same: a soft track,
   the active tab lifted as a card with a coral icon. */
const icon = (k, c) => {
  switch (k) {
    case "thought": return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 16.5H7a4.5 4.5 0 0 1-.6-8.96A5.6 5.6 0 0 1 17.3 6.6 4.95 4.95 0 0 1 17 16.5Z" /><circle cx="6.3" cy="19.6" r="1.25" /></svg>);
    case "task": return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="5" /><path d="M8.5 12.3l2.4 2.4 4.8-5" /></svg>);
    case "list": return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" fill={c} /><circle cx="4.5" cy="12" r="1" fill={c} /><circle cx="4.5" cy="18" r="1" fill={c} /></svg>);
    case "link": return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>);
    case "image": return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="4" /><circle cx="9" cy="10" r="1.6" /><path d="M20.5 16l-4.5-4.5L7 19.5" /></svg>);
    default: return null;
  }
};

export function KindTabs({ kinds, value, onChange, label = "What are you adding?", style }) {
  return (
    <div role="tablist" aria-label={label} style={{ display: "flex", gap: 4, padding: 4, borderRadius: 14, background: T.bg, marginBottom: 14, ...style }}>
      {kinds.map(([k, text]) => {
        const on = value === k;
        return (
          <button key={k} role="tab" aria-selected={on} onClick={() => onChange(k)}
            style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 11, cursor: "pointer", fontSize: 13.5, fontWeight: on ? 700 : 600,
              background: on ? T.card : "transparent", color: on ? T.ink : T.ink2, boxShadow: on ? T.shadowSm : "none", transition: "all .2s ease", whiteSpace: "nowrap" }}>
            {icon(k, on ? T.coral : "currentColor")}
            {text}
          </button>
        );
      })}
    </div>
  );
}
