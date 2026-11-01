import { useEffect, useRef, useState } from "react";
import { Ic } from "../icons/Icons";
import { T } from "../theme";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { Section } from "../components/Section";
import { useHSwipe } from "../hooks/useHSwipe";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BILL_CATS } from "../constants";
import { toMonthKey, shiftMonth, monthLabel, financeMonthTotals, suggestBillCategory } from "../utils/finance";

const RepeatIcon = ({ c, s = 15 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

/* Finance is deliberately simple: what comes in (monthly income, plus any
   extra that came in this month) and what goes out (bills — repeating, or
   one-off for this month). What's left is the one honest number. */
export function FinanceScreen({ finance, mk, setMk, onSetIncome, onTogglePaid, onAddBill, onAddExtra, onDeleteExtra }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const realMk = toMonthKey();
  const [incomeDraft, setIncomeDraft] = useState("");
  const [billName, setBillName] = useState(""); const [billAmt, setBillAmt] = useState(""); const [billCat, setBillCat] = useState(null);
  const [billRecurring, setBillRecurring] = useState(true);
  /* tap-to-edit income: the "Income €X" line turns into an input in place */
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeEdit, setIncomeEdit] = useState("");
  /* "+ Extra": one-time money for this month only (bonus, gig, gift) */
  const [addingExtra, setAddingExtra] = useState(false);
  const [extraAmt, setExtraAmt] = useState(""); const [extraName, setExtraName] = useState("");
  /* "Carry on" explanation: hover/focus on desktop, first tap on touch */
  const [carryTip, setCarryTip] = useState(false);
  const carryRef = useRef(null);
  const lastPointer = useRef("mouse"); // pointerType of the last press on "Carry on"
  useEffect(() => {
    if (!carryTip) return;
    const close = (e) => { if (carryRef.current && !carryRef.current.contains(e.target)) setCarryTip(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [carryTip]);
  const [monthSlide, setMonthSlide] = useState(null); // {dir, k}
  const monthSwipe = useHSwipe((dir) => {
    setMk(shiftMonth(mk, dir));
    setMonthSlide({ dir, k: Date.now() });
  });

  const fmt = (n) => `€${n.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;

  /* opt-in: not configured → only the invitation, nothing else */
  if (finance.income == null) {
    return (
      <div style={{ padding: isDesktop ? "26px 22px 0" : "84px 22px 0" }} className="rise">
        <Eyebrow>An honest number about your month</Eyebrow>
        <h1 className="fr" style={{ fontSize: 34, fontWeight: 500, margin: "6px 0 24px" }}>Finance</h1>
        <Card data-coach="finance" style={{ padding: 26, textAlign: "center" }}>
          <p className="fr" style={{ fontStyle: "italic", fontSize: 16, color: T.ink2, margin: "0 0 18px", lineHeight: 1.6 }}>
            Two things: what comes in and your bills. Lit shows what's left. Set your monthly income to begin.
          </p>
          <input value={incomeDraft} onChange={(e) => setIncomeDraft(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" enterKeyHint="done"
            onKeyDown={(e) => e.key === "Enter" && incomeDraft && onSetIncome(Number(incomeDraft))}
            placeholder="Monthly income (€)"
            style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "none", outline: "none", background: T.bg, fontSize: 15, textAlign: "center" }} />
          <button onClick={() => incomeDraft && onSetIncome(Number(incomeDraft))}
            style={{ width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 16, background: T.coralGrad, color: "#fff", fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>
            Start tracking
          </button>
        </Card>
      </div>
    );
  }

  const { bills, extras, billSum, total, left } = financeMonthTotals(finance, mk);
  const pct = (n) => (total > 0 ? Math.max(0, (n / total) * 100) : 0);
  const isPaid = (b) => (b.recurring ? !!b.paidMonths?.[mk] : !!b.paid);
  const togglePaid = (b) => onTogglePaid(b);

  const addBill = () => {
    if (!billName.trim() || !billAmt) return;
    onAddBill({
      name: billName.trim(), amount: Number(billAmt),
      category: billCat || suggestBillCategory(billName),
      recurring: billRecurring,
      ...(billRecurring ? {} : { monthKey: mk }),
    });
    setBillName(""); setBillAmt(""); setBillCat(null);
  };
  const addExtra = () => {
    const amount = Number(extraAmt);
    if (!extraAmt || !Number.isFinite(amount) || amount <= 0) return;
    onAddExtra({ name: extraName.trim() || "Extra", amount, monthKey: mk });
    setExtraAmt(""); setExtraName(""); setAddingExtra(false);
  };
  /* "Carry on": takes what's left this month into next month as an extra
     ("Saved in November"), shown there as a chip — the × on that chip undoes it. */
  const nextMk = shiftMonth(mk, 1);
  const nextName = monthLabel(nextMk).split(" ")[0];
  const thisName = monthLabel(mk).split(" ")[0];
  const carried = finance.extras.some((e) => e.monthKey === nextMk && e.carriedFrom === mk && e.kind === "savings");
  const carryAmt = Math.round(left);
  const showCarry = carried || carryAmt > 0;
  const doCarry = () => {
    onAddExtra({ name: `Saved in ${thisName}`, amount: carryAmt, monthKey: nextMk, carriedFrom: mk, kind: "savings" });
    setCarryTip(false);
  };
  /* mouse/keyboard: the tooltip already showed on hover/focus, so a click
     carries. touch: no hover, so the first tap shows the explanation and
     the second tap (while it's open) carries. */
  const onCarryClick = () => {
    if (carried || carryAmt <= 0) return;
    if (lastPointer.current !== "mouse" && !carryTip) { setCarryTip(true); return; }
    doCarry();
  };

  const saveIncome = () => {
    const v = Number(incomeEdit);
    if (incomeEdit !== "" && Number.isFinite(v) && v !== finance.income) onSetIncome(v);
    setEditingIncome(false);
  };

  const inputStyle = { flex: 1, minWidth: 0, padding: "11px 14px", borderRadius: 13, border: "none", outline: "none", background: T.bg, fontSize: 13.5 };
  const amtStyle = { ...inputStyle, flex: "0 0 84px" };
  const addBtn = (fn) => (
    <button onPointerDown={(e) => { e.preventDefault(); fn(); }} style={{ padding: "0 15px", borderRadius: 13, background: T.ink, color: T.card, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Add</button>
  );
  const billsByCat = BILL_CATS.map((c) => [c, bills.filter((b) => b.category === c)]).filter(([, l]) => l.length);
  const suggested = billName.trim() ? suggestBillCategory(billName) : null;

  return (
    <div style={{ padding: isDesktop ? "26px 22px 0" : "84px 22px 0", touchAction: "pan-y" }} className="rise" onPointerDown={monthSwipe.onPointerDown}>
      <Eyebrow>An honest number about your month</Eyebrow>
      <h1 className="fr" style={{ fontSize: 34, fontWeight: 500, margin: "6px 0 14px" }}>Finance</h1>

      {/* month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => setMk(shiftMonth(mk, -1))} aria-label="Previous month"
          style={{ width: 38, height: 38, borderRadius: 13, background: T.card, boxShadow: T.shadowSm, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink2} strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="fr" style={{ fontSize: 17, fontWeight: 600 }}>{monthLabel(mk)}</div>
          {mk !== realMk && (
            <button onClick={() => setMk(realMk)} style={{ fontSize: 11.5, fontWeight: 600, color: T.coral, cursor: "pointer", marginTop: 2 }}>
              Back to this month
            </button>
          )}
        </div>
        <button onClick={() => setMk(shiftMonth(mk, 1))} aria-label="Next month"
          style={{ width: 38, height: 38, borderRadius: 13, background: T.card, boxShadow: T.shadowSm, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink2} strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <div key={monthSlide ? monthSlide.k : "month"} style={{
        transform: monthSwipe.dragging ? `translateX(${monthSwipe.x}px)` : undefined,
        transition: monthSwipe.dragging ? "none" : "transform .25s ease",
        animation: monthSlide && !monthSwipe.dragging ? `${monthSlide.dir === 1 ? "slideFromRight" : "slideFromLeft"} .3s cubic-bezier(.3,.8,.4,1)` : undefined,
      }}>
      {/* hero */}
      <Card style={{ padding: 24 }}>
        <Eyebrow>You can save this month</Eyebrow>
        <div className="fr tnum" style={{ fontSize: 44, fontWeight: 600, margin: "8px 0 16px", letterSpacing: "-0.02em" }}>{fmt(left)}</div>
        <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", background: T.bg }}>
          <div style={{ width: `${pct(billSum)}%`, background: T.sky, transition: "width .5s ease" }} />
          <div style={{ width: `${pct(Math.max(0, left))}%`, background: T.mint, transition: "width .5s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11.5, color: T.ink2, flexWrap: "wrap" }}>
          {[["Bills", T.sky, billSum], ["Left", T.mint, Math.max(0, left)]].map(([l, c, v]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{l} · {fmt(v)}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          {editingIncome ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.ink3 }}>
              Income €
              <input autoFocus value={incomeEdit} inputMode="decimal" enterKeyHint="done" aria-label="Monthly income in euros"
                onChange={(e) => setIncomeEdit(e.target.value.replace(/[^\d.]/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setIncomeEdit(""); setEditingIncome(false); } }}
                onBlur={saveIncome}
                style={{ width: 96, padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${T.coral}`, outline: "none", background: T.bg, fontSize: 14, fontWeight: 600, color: T.ink }} />
            </span>
          ) : (
            <button onClick={() => { setIncomeEdit(String(finance.income)); setEditingIncome(true); }} aria-label={`Income ${fmt(finance.income)}. Tap to edit`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.ink3, cursor: "pointer", padding: "4px 0" }}>
              <span>Income <strong style={{ color: T.ink, fontWeight: 600 }}>{fmt(finance.income)}</strong></span>
              {Ic.pencil(T.ink3)}
            </button>
          )}
          {showCarry && (
            <span ref={carryRef} style={{ position: "relative" }}
              onPointerEnter={(e) => e.pointerType === "mouse" && setCarryTip(true)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setCarryTip(false)}>
              <button onClick={onCarryClick} disabled={carried} aria-describedby="carry-tip"
                onPointerDown={(e) => { lastPointer.current = e.pointerType; e.stopPropagation(); }}
                onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setCarryTip(true); }}
                onBlur={() => setCarryTip(false)}
                style={{ padding: "7px 13px", borderRadius: 100, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
                  cursor: carried ? "default" : "pointer", background: carried ? T.mintSoft : T.coralSoft, color: carried ? T.mint : T.coral }}>
                {carried ? "Carried ✓" : "Carry on →"}
              </button>
              {carryTip && (
                <span id="carry-tip" role="tooltip" style={{
                  position: "absolute", right: 0, bottom: "calc(100% + 8px)", width: 230, zIndex: 5, textAlign: "left",
                  background: T.ink, color: T.card, fontSize: 12, lineHeight: 1.45, fontWeight: 500,
                  padding: "10px 12px", borderRadius: 12, boxShadow: T.shadow, animation: "fadeIn .15s ease",
                }}>
                  {carried
                    ? `Already in ${nextName}. To undo, remove it there.`
                    : `Takes the ${fmt(carryAmt)} left this month into ${nextName} as extra money. To undo, remove it there.`}
                  {!carried && lastPointer.current !== "mouse" && <strong style={{ display: "block", marginTop: 6 }}>Tap again to carry.</strong>}
                </span>
              )}
            </span>
          )}
        </div>

        {/* extra money this month — chips + one small "+ Extra" button */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {extras.map((e) => (
            <span key={e.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 6px 5px 11px", borderRadius: 100, background: T.mintSoft, color: T.mint, fontSize: 12, fontWeight: 600 }}>
              + {fmt(e.amount)} <span style={{ color: T.ink2, fontWeight: 500 }}>{e.name}</span>
              <button onClick={() => onDeleteExtra(e.id)} aria-label={`Remove ${e.name}`} style={{ width: 20, height: 20, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", color: T.ink3 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </span>
          ))}
          {addingExtra ? (
            <span style={{ display: "flex", gap: 6, width: "100%", marginTop: extras.length ? 4 : 0 }}>
              <input autoFocus value={extraAmt} onChange={(e) => setExtraAmt(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" enterKeyHint="next"
                placeholder="€" aria-label="Extra amount in euros"
                onKeyDown={(e) => { if (e.key === "Enter") addExtra(); if (e.key === "Escape") setAddingExtra(false); }}
                style={{ flex: "0 0 84px", minWidth: 0, padding: "9px 12px", borderRadius: 11, border: `1.5px solid ${T.mint}`, outline: "none", background: T.bg, fontSize: 13.5, fontWeight: 600, color: T.ink }} />
              <input value={extraName} onChange={(e) => setExtraName(e.target.value)} enterKeyHint="done"
                placeholder="What for? (bonus, gig…)" aria-label="What the extra money is"
                onKeyDown={(e) => { if (e.key === "Enter") addExtra(); if (e.key === "Escape") setAddingExtra(false); }}
                style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 11, border: "none", outline: "none", background: T.bg, fontSize: 13.5, color: T.ink }} />
              <button onPointerDown={(e) => { e.preventDefault(); addExtra(); }}
                style={{ padding: "0 14px", borderRadius: 11, background: T.mint, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Add</button>
            </span>
          ) : (
            <button onClick={() => setAddingExtra(true)} title="Money that came in this month only — a bonus, a gig, a gift"
              style={{ padding: "5px 11px", borderRadius: 100, background: T.bg, color: T.ink2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              + Extra this month
            </button>
          )}
        </div>
      </Card>

      {/* bills */}
      <Section title="Bills" hint="Tap to mark as paid">
        {billsByCat.map(([cat, list]) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.ink3, margin: "8px 0 4px" }}>{cat}</div>
            {list.map((b) => {
              const paid = isPaid(b);
              return (
                <button key={b.id} onClick={() => togglePaid(b)}
                  style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", padding: "10px 2px", cursor: "pointer", borderBottom: `1px solid ${T.hairline}` }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: paid ? T.ink3 : T.ink, textDecoration: paid ? "line-through" : "none" }}>{b.name}</span>
                    {b.recurring && <RepeatIcon c={T.ink3} s={13} />}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {paid && <span style={{ fontSize: 10.5, fontWeight: 700, color: T.mint, background: T.mintSoft, padding: "3px 8px", borderRadius: 100 }}>PAID</span>}
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.sky }}>{fmt(b.amount)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={billName} onChange={(e) => { setBillName(e.target.value); setBillCat(null); }} placeholder="e.g. Rent, Netflix…" style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && addBill()} />
          <input value={billAmt} onChange={(e) => setBillAmt(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="€" style={amtStyle}
            onKeyDown={(e) => e.key === "Enter" && addBill()} />
          <button onClick={() => setBillRecurring(!billRecurring)} aria-label={billRecurring ? "Repeats every month" : "This month only"}
            title={billRecurring ? "Repeats every month" : "This month only"}
            style={{ width: 42, borderRadius: 13, background: billRecurring ? T.skySoft : T.bg, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}>
            <RepeatIcon c={billRecurring ? T.sky : T.ink3} />
          </button>
          {addBtn(addBill)}
        </div>
        <div style={{ fontSize: 11, color: T.ink3, marginTop: 7 }}>
          {billRecurring ? "Repeats every month — add it once, it's there every month. Tap ⟳ for a one-off." : "One-off — this month only (a trip, a gift, a big shop)."}
        </div>
        {suggested && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {BILL_CATS.map((c) => {
              const active = (billCat || suggested) === c;
              return (
                <button key={c} onClick={() => setBillCat(c)} style={{ padding: "5px 11px", borderRadius: 100, fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: active ? T.skySoft : T.bg, color: active ? T.sky : T.ink3 }}>
                  {c}{c === suggested && !billCat ? " ·" : ""}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      </div>
    </div>
  );
}
