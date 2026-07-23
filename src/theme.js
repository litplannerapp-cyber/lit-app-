export const LIGHT = {
  bg: "#F6F1EA",
  card: "#FDFAF5",
  ink: "#2E2A26",
  ink2: "#8A8177",
  ink3: "#B5ACA1",
  hairline: "rgba(46,42,38,0.08)",
  coral: "#FF6B5E",
  coralGrad: "linear-gradient(135deg,#FFB35C 0%,#FF6B5E 55%,#F4508C 100%)",
  coralSoft: "rgba(255,107,94,0.12)",
  mint: "#5EC9A7",
  mintSoft: "rgba(94,201,167,0.14)",
  sky: "#7FB5E0",
  skySoft: "rgba(127,181,224,0.16)",
  peach: "#FFC29E",
  shadow: "0 1px 2px rgba(46,42,38,0.04), 0 10px 28px rgba(46,42,38,0.07)",
  shadowSm: "0 1px 2px rgba(46,42,38,0.03), 0 4px 12px rgba(46,42,38,0.05)",
  stroke: "rgba(46,42,38,0.06)",
  pageBg: "linear-gradient(180deg,#F2ECE3 0%,#F6F1EA 40%)",
  dockBg: "rgba(253,250,245,0.88)",
  r: 22,
};

export const DARK = {
  bg: "#2A2724",
  card: "#33302C",
  ink: "#F2EDE6",
  ink2: "#B3AA9E",
  ink3: "#7C736A",
  hairline: "rgba(242,237,230,0.09)",
  coral: "#FF7A6E",
  coralGrad: "linear-gradient(135deg,#FFB35C 0%,#FF6B5E 55%,#F4508C 100%)",
  coralSoft: "rgba(255,122,110,0.16)",
  mint: "#6BD4B3",
  mintSoft: "rgba(107,212,179,0.16)",
  sky: "#8FBFE6",
  skySoft: "rgba(143,191,230,0.16)",
  peach: "#F0B08A",
  shadow: "0 1px 2px rgba(0,0,0,0.25), 0 12px 30px rgba(0,0,0,0.35)",
  shadowSm: "0 1px 2px rgba(0,0,0,0.2), 0 5px 14px rgba(0,0,0,0.26)",
  stroke: "rgba(242,237,230,0.07)",
  pageBg: "linear-gradient(180deg,#211E1B 0%,#26231F 40%)",
  dockBg: "rgba(51,48,44,0.88)",
  r: 22,
};

/* reassigned by the app on every render before children render — every
   component reads this fresh, never memoized, so it must stay a plain
   mutable module binding rather than context (matches the prototype). */
export let T = LIGHT;
export function applyTheme(dark) {
  T = dark ? DARK : LIGHT;
}
