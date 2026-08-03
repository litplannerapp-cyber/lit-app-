import { T } from "../theme";

export function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html { scroll-behavior: smooth; }
      html, body { margin: 0; padding: 0; background: ${T.pageBg}; }
      body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
      input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; }
      button { transition: transform .16s cubic-bezier(.34,1.4,.5,1), opacity .18s ease, background .2s ease, box-shadow .2s ease, color .2s ease; }
      button:active { transform: scale(.96); }
      input, textarea { transition: box-shadow .18s ease; }
      input:focus, textarea:focus { box-shadow: 0 0 0 1.5px ${T.coral}66, 0 0 0 4px ${T.coralSoft}; }
      .tnum { font-variant-numeric: tabular-nums; }
      .pressable { transition: transform .16s cubic-bezier(.34,1.4,.5,1); cursor: pointer; }
      .pressable:active { transform: scale(.98); }
      button { font-family: inherit; border: none; background: none; padding: 0; color: inherit; }
      input, textarea { font-family: inherit; color: ${T.ink}; }
      input::placeholder, textarea::placeholder { color: ${T.ink3}; }
      ::-webkit-scrollbar { width: 0; height: 0; }
      .fr { font-family: 'Fraunces', Georgia, serif; }
      @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      @keyframes sheetUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
      @keyframes fadeSlideOut { to { opacity: 0; transform: translateX(24px); } }
      @keyframes toastIn { from { opacity: 0; transform: translate(-50%,-10px);} to { opacity:1; transform: translate(-50%,0);} }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideFromRight { from { opacity: 0; transform: translateX(56px); } to { opacity: 1; transform: none; } }
      @keyframes slideFromLeft { from { opacity: 0; transform: translateX(-56px); } to { opacity: 1; transform: none; } }
      @keyframes pop { 0% { transform: scale(1); } 45% { transform: scale(1.14); } 100% { transform: scale(1); } }
      /* the halo "lighting up" — a light flaring out once, a gentle settle
         on the ring itself, and a quiet ambient warmth that lingers while
         the day stays complete. Never loops forever at full intensity —
         calm, not a notification badge. */
      @keyframes litFlare {
        0% { opacity: 0; transform: scale(.4); }
        35% { opacity: 1; transform: scale(1.35); }
        100% { opacity: 0; transform: scale(2.2); }
      }
      @keyframes ringSettle {
        0% { transform: scale(1); }
        30% { transform: scale(1.08); }
        55% { transform: scale(0.98); }
        100% { transform: scale(1); }
      }
      @keyframes ambientGlow {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes modalIn { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
      .shimmer { background: linear-gradient(90deg, ${T.bg} 25%, ${T.card} 50%, ${T.bg} 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
      .rise { animation: rise .4s ease both; }
      /* mobile Safari's address bar/toolbar expanding and collapsing means
         100vh doesn't match what's actually visible — content centered
         with plain vh sits below true-center whenever the toolbars are
         showing. 100svh (small viewport height) is measured against the
         viewport with toolbars fully expanded, so centered content never
         drifts. vh stays first only as a fallback for very old browsers
         that don't understand svh yet — the cascade lets the browser pick
         the best one it understands. */
      .full-screen-center {
        position: fixed; top: 0; left: 0; right: 0;
        height: 100vh;
        height: 100svh;
      }
      @media (hover: hover) and (pointer: fine) {
        .hoverable:hover { background: ${T.bg}; }
        .navitem:hover { opacity: 1 !important; }
      }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    `}</style>
  );
}
