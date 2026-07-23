import { useState } from "react";

/* horizontal swipe (content follows the finger, then commits) */
export function useHSwipe(onCommit) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse") return; /* touch gesture; desktop has arrows/taps */
    if (e.target.closest && e.target.closest("[data-noswipe], input, textarea")) return;
    const sx = e.clientX, sy = e.clientY, t0 = performance.now();
    let mode = null; /* "h" = swipe, "v" = let it scroll */
    const move = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (mode === null) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.25) { mode = "h"; setDragging(true); }
        else if (Math.abs(dy) > 10) { mode = "v"; cleanup(); return; }
        else return;
      }
      setX(dx * 0.65); /* slight damping = premium feel */
    };
    const touchBlock = (ev) => { if (mode === "h" && ev.cancelable) ev.preventDefault(); };
    const up = (ev) => {
      if (mode === "h") {
        const dx = ev.clientX - sx;
        const vel = Math.abs(dx) / Math.max(1, performance.now() - t0);
        if (Math.abs(dx) > 70 || vel > 0.5) onCommit(dx < 0 ? 1 : -1); /* 1 = forward, -1 = back */
      }
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cleanup);
      window.removeEventListener("touchmove", touchBlock);
      setDragging(false); setX(0);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cleanup);
    window.addEventListener("touchmove", touchBlock, { passive: false });
  };
  return { x, dragging, onPointerDown };
}
