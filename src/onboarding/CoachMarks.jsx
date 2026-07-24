import { useEffect, useRef, useState } from "react";
import { T } from "../theme";
import { Card } from "../components/Card";
import { HaloMark } from "../icons/Icons";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

/* In-app walkthrough: small tooltips that point at real elements as the person
   navigates the actual screens — no separate hosted flow. Switches tabs itself,
   dims everything but the target, skippable from any step. */

const COACH_STEPS = [
  { tab: "today", target: "inbox", title: "Capture anything here", body: "Tasks, lists, images, voice notes. Sort them into your day whenever you're ready — never before.", place: "bottom" },
  { tab: "today", target: "ring", title: "Only your top three", body: "The ring tracks up to three priorities, never your whole list. That's the whole point.", place: "bottom" },
  { tab: "today", target: "addtask", title: "Add a task any time", body: "New tasks land in Rest of the day. Promote one with the star when it becomes a priority.", place: "top" },
  { tab: "vision", target: "vision-quick", title: "Drop things here", body: "A quote, a link, an image — it stays loose until you place it on a board. No decision required up front.", place: "bottom" },
  { tab: "finance", target: "finance", title: "Turn this on when ready", body: "Finance stays invisible until you opt in. One honest number — nothing to feel judged by.", place: "top" },
  { tab: "goals", target: "goals", title: "Break it into steps", body: "Big goals, small milestones. Check them off one at a time and watch the percentage move.", place: "top" },
  { tab: "today", target: "dock", title: "Glide between screens", body: "Tap, or drag your finger across the dock — the app slides right along with you.", place: "top" },
];

const SAFE_MARGIN = 18; /* never let the bubble touch the very edge of the viewport (address bar, notch, home indicator) */
const BUBBLE_W = 280;

export function CoachMarks({ step, setStep, tab, goTab, onDone }) {
  useBodyScrollLock(true);
  const [rect, setRect] = useState(null);
  const [bubblePos, setBubblePos] = useState(null); // { top, left, place } — final, edge-clamped, flipped-if-needed
  const bubbleRef = useRef(null);
  const s = step >= 0 ? COACH_STEPS[step] : null;

  useEffect(() => { setRect(null); setBubblePos(null); }, [step]); /* clear before the next target is measured */

  useEffect(() => {
    if (!s) return; /* welcome step — nothing to point at yet */
    if (s.tab !== tab) { goTab(s.tab); return; } /* effect reruns once the tab prop catches up */
    /* measure once (after the tab-slide settles) and again only on resize —
       NOT every animation frame: getBoundingClientRect forces layout, and doing
       that 60x/sec forever is what was freezing the page */
    const measure = () => {
      const el = document.querySelector(`[data-coach="${s.target}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect((prev) => (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height ? prev : r));
    };
    const t = setTimeout(measure, 340);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [step, s, tab, goTab]);

  /* once the target rect is known, the bubble renders once (hidden) so its real
     height can be measured, then this picks a side that actually fits — flipping
     off the requested one if there isn't room — and clamps to the viewport with
     a safe margin either way. Runs again on resize/rotation. */
  useEffect(() => {
    if (!rect || !s) return;
    const compute = () => {
      const bubbleEl = bubbleRef.current;
      const bubbleH = bubbleEl ? bubbleEl.getBoundingClientRect().height : 150;
      const vw = window.innerWidth, vh = window.innerHeight;
      const pad = 8;
      const hole = { top: rect.top - pad, bottom: rect.bottom + pad };
      const spaceAbove = hole.top;
      const spaceBelow = vh - hole.bottom;
      const needed = bubbleH + 12 + SAFE_MARGIN;

      let place = s.place;
      if (place === "top" && spaceAbove < needed && spaceBelow > spaceAbove) place = "bottom";
      else if (place === "bottom" && spaceBelow < needed && spaceAbove > spaceBelow) place = "top";

      let top = place === "top" ? hole.top - 12 - bubbleH : hole.bottom + 12;
      top = Math.min(Math.max(top, SAFE_MARGIN), Math.max(SAFE_MARGIN, vh - bubbleH - SAFE_MARGIN));

      const left = Math.min(Math.max(rect.left + rect.width / 2 - BUBBLE_W / 2, 16), vw - BUBBLE_W - 16);
      setBubblePos({ top, left, place });
    };
    const raf = requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", compute); };
  }, [rect, s]);

  if (step === -1) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 400, background: T.pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 36px 120px" }}>
        <div style={{ animation: "rise .5s ease", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <HaloMark size={84} />
          <div className="fr" style={{ fontSize: 34, fontWeight: 700, marginTop: 18, color: T.ink, lineHeight: 1 }}>Lit</div>
          <p style={{ fontSize: 14.5, color: T.ink2, lineHeight: 1.6, margin: "14px 0 0", maxWidth: 300, textAlign: "center" }}>
            A quick look at how Lit works — skip any time.
          </p>
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "0 22px 40px", display: "flex", gap: 10 }}>
          <button onClick={onDone} style={{ padding: "16px 22px", borderRadius: 18, background: T.card, color: T.ink2, fontSize: 14.5, fontWeight: 600, cursor: "pointer", boxShadow: T.shadowSm }}>
            Skip
          </button>
          <button onClick={() => setStep(0)} style={{ flex: 1, padding: "16px 0", borderRadius: 18, background: T.coralGrad, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 24px rgba(255,107,94,.32)" }}>
            Show me around
          </button>
        </div>
      </div>
    );
  }

  if (!rect) return null; /* nothing to point at yet — no flash of a broken overlay */

  const vw = window.innerWidth, vh = window.innerHeight;
  const pad = 8;
  const hole = { top: rect.top - pad, left: rect.left - pad, right: rect.right + pad, bottom: rect.bottom + pad };
  const dim = "rgba(24,21,18,0.55)";
  const shade = (style) => <div style={{ position: "fixed", background: dim, transition: "all .25s ease", ...style }} />;

  const visible = !!bubblePos;
  const place = bubblePos?.place || s.place;
  const arrowLeft = bubblePos ? rect.left + rect.width / 2 - bubblePos.left : 0;
  const last = step === COACH_STEPS.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400 }}>
      {shade({ top: 0, left: 0, width: "100%", height: hole.top })}
      {shade({ top: hole.bottom, left: 0, width: "100%", height: Math.max(0, vh - hole.bottom) })}
      {shade({ top: hole.top, left: 0, width: hole.left, height: hole.bottom - hole.top })}
      {shade({ top: hole.top, left: hole.right, width: Math.max(0, vw - hole.right), height: hole.bottom - hole.top })}
      {/* spotlight ring around the real element */}
      <div style={{ position: "fixed", top: hole.top, left: hole.left, width: hole.right - hole.left, height: hole.bottom - hole.top, borderRadius: 18, boxShadow: `0 0 0 3px ${T.coral}`, pointerEvents: "none", transition: "all .25s ease" }} />
      {/* click-catcher so nothing underneath is nudged mid-tour */}
      <div style={{ position: "fixed", top: hole.top, left: hole.left, width: hole.right - hole.left, height: hole.bottom - hole.top }} />

      {/* tooltip bubble — rendered (off-screen-safe) as soon as the target is known so its
          height can be measured; kept invisible until bubblePos has a final, clamped spot */}
      <div ref={bubbleRef} style={{
        position: "fixed",
        top: bubblePos ? bubblePos.top : 0,
        left: bubblePos ? bubblePos.left : rect.left,
        width: BUBBLE_W,
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
        animation: visible ? "rise .28s ease" : undefined,
      }}>
        {place === "bottom" && (
          <div style={{ position: "absolute", top: -7, left: arrowLeft - 7, width: 14, height: 14, background: T.card, transform: "rotate(45deg)", borderRadius: 3, boxShadow: T.shadowSm }} />
        )}
        <Card style={{ padding: "16px 18px", position: "relative" }}>
          {place === "top" && (
            <div style={{ position: "absolute", bottom: -7, left: arrowLeft - 7, width: 14, height: 14, background: T.card, transform: "rotate(45deg)", borderRadius: 3 }} />
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.coral }}>{step + 1} of {COACH_STEPS.length}</span>
            <button onClick={onDone} style={{ fontSize: 11.5, fontWeight: 600, color: T.ink3, cursor: "pointer" }}>Skip</button>
          </div>
          <div className="fr" style={{ fontSize: 16.5, fontWeight: 600, margin: "0 0 5px" }}>{s.title}</div>
          <p style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.5, margin: "0 0 14px" }}>{s.body}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              {COACH_STEPS.map((_, ix) => (
                <span key={ix} style={{ height: 4, flex: 1, borderRadius: 2, background: ix <= step ? T.coral : T.hairline, transition: "background .25s" }} />
              ))}
            </div>
            <button onClick={() => (last ? onDone() : setStep(step + 1))}
              style={{ padding: "8px 16px", borderRadius: 100, background: T.coralGrad, color: "#fff", fontSize: 12.5, fontWeight: 650, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
              {last ? "Done" : "Next"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
