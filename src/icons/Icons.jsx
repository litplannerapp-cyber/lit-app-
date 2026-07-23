import { T } from "../theme";
import { HALO_ARCS } from "../constants";

export const Ic = {
  tray: (c = T.ink) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13h4l2 3h4l2-3h4" /><path d="M4 13V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" /><path d="M4 13v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </svg>),
  feather: (c = T.ink3) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><line x1="16" y1="8" x2="2" y2="22" />
    </svg>),
  star: (fill, c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={fill ? c : "none"} stroke={c} strokeWidth="1.7" strokeLinejoin="round">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>),
  pencil: (c) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </svg>),
  x: (c, s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>),
  sparkles: (c = "#fff") => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={c}>
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
      <path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" opacity=".7" />
    </svg>),
  mic: (c) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v1a7 7 0 0 0 14 0v-1" /><line x1="12" y1="18" x2="12" y2="22" />
    </svg>),
  pin: (fill, c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={fill ? c : "none"} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" /><path d="M9 3h6l1 7 3 3H5l3-3z" />
    </svg>),
  chevR: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>),
  send: (c = "#fff") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>),
};

/* the brand mark: same 3-arc halo as the Today ring, fully lit */
export function HaloMark({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 104 104" style={{ display: "block" }}>
      <defs>
        <linearGradient id="haloMarkGrad" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="85" y2="92">
          <stop offset="0%" stopColor="#FFB35C" /><stop offset="55%" stopColor="#FF6B5E" /><stop offset="100%" stopColor="#F4508C" />
        </linearGradient>
      </defs>
      {HALO_ARCS.map((arc, i) => (
        <path key={i} d={arc.d} fill="none" stroke="url(#haloMarkGrad)" strokeWidth="8" strokeLinecap="round" />
      ))}
    </svg>
  );
}
