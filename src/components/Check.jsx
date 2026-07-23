import { T } from "../theme";

/* Checkbox with drawn checkmark */
export const Check = ({ done, onToggle, color = T.coral }) => (
  <button onClick={onToggle} aria-label={done ? "Mark as not done" : "Mark as done"} style={{
    width: 26, height: 26, borderRadius: 9, flexShrink: 0, cursor: "pointer",
    border: done ? "none" : `1.6px solid ${T.ink3}`,
    background: done ? T.coralGrad : "transparent",
    display: "grid", placeItems: "center", transition: "all .25s ease",
  }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      style={{ strokeDasharray: 24, strokeDashoffset: done ? 0 : 24, transition: "stroke-dashoffset .3s ease .05s" }}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  </button>
);
