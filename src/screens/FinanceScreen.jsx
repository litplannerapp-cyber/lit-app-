import { useState } from "react";
import { T } from "../theme";
import { Card } from "../components/Card";
import { Eyebrow } from "../components/Eyebrow";
import { Section } from "../components/Section";
import { Row } from "../components/Row";
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

export function FinanceScreen({ finance, mk, setMk, onSetIncome, onTogglePaid, onAddExtra, onAddBill, onAddExpense, onCarryExpenses }) {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const realMk = toMonthKey();
  const [incomeDraft, setIncomeDraft] = useState("");
  const [extraName, setExtraName] = useState(""); const [extraAmt, setExtraAmt] = useState("");
  const [billName, setBillName] = useState(""); const [billAmt, setBillAmt] = useState(""); const [billCat, setBillCat] = useState(null);
  const [billRecurring, setBillRecurring] = useState(true);
  const [expName, setExpName] = useState(""); const [expAmt, setExpAmt] = useState("");
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
            One number: what comes in, what goes out, what's left. Set your monthly income to begin.
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

  const { bills, extras, expenses, billSum, extraSum, expSum, total, left } = financeMonthTotals(finance, mk);
  const pct = (n) => (total > 0 ? Math.max(0, (n / total) * 100) : 0);
  const isPaid = (b) => (b.recurring ? !!b.paidMonths?.[mk] : !!b.paid);
  const togglePaid = (b) => onTogglePaid(b);

  const addExtra = () => {
    if (!extraName.trim() || !extraAmt) return;
    onAddExtra({ name: extraName.trim(), amount: Number(extraAmt), monthKey: mk });
    setExtraName(""); setExtraAmt("");
  };
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
  const addExp = () => {
    if (!expName.trim() || !expAmt) return;
    onAddExpense({ name: expName.trim(), amount: Number(expAmt), monthKey: mk });
    setExpName(""); setExpAmt("");
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
          <div style={{ width: `${pct(expSum)}%`, background: T.peach, transition: "width .5s ease" }} />
          <div style={{ width: `${pct(Math.max(0, left))}%`, background: T.mint, transition: "width .5s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11.5, color: T.ink2, flexWrap: "wrap" }}>
          {[["Bills", T.sky, billSum], ["Spending", T.peach, expSum], ["Left", T.mint, Math.max(0, left)]].map(([l, c, v]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{l} · {fmt(v)}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: T.ink3 }}>
          Income {fmt(finance.income)}{extraSum > 0 && <> + extra {fmt(extraSum)}</>}
        </div>
      </Card>

      {/* take into next month (optional) */}
      {(() => {
        const nextMk = shiftMonth(mk, 1);
        const savingsCarried = finance.extras.some((e) => e.monthKey === nextMk && e.carriedFrom === mk && e.kind === "savings");
        const expensesCarried = finance.expenses.some((e) => e.monthKey === nextMk && e.carriedFrom === mk);
        const canSavings = left > 0 && !savingsCarried;
        const canExpenses = expenses.length > 0 && !expensesCarried;
        if (!canSavings && !canExpenses && !savingsCarried && !expensesCarried) return null;
        const carrySavings = () => onAddExtra({ name: `Saved in ${monthLabel(mk).split(" ")[0]}`, amount: Math.round(left), monthKey: nextMk, carriedFrom: mk, kind: "savings" });
        const carryExpenses = () => onCarryExpenses(expenses, nextMk, mk);
        const rowBtn = (done, can, label, fn) => (
          <button onClick={can ? fn : undefined} disabled={!can}
            style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", padding: "11px 2px", cursor: can ? "pointer" : "default", borderBottom: `1px solid ${T.hairline}` }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: done ? T.ink3 : T.ink }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: done ? T.mint : T.coral }}>{done ? "Carried ✓" : "Carry →"}</span>
          </button>
        );
        return (
          <Section title={`Take into ${monthLabel(nextMk).split(" ")[0]}`} hint="Optional — one tap, undo by deleting there">
            {(canSavings || savingsCarried) && rowBtn(savingsCarried, canSavings, `Savings · ${fmt(Math.max(0, Math.round(left)))} as extra income`, carrySavings)}
            {(canExpenses || expensesCarried) && rowBtn(expensesCarried, canExpenses, `Day-to-day expenses · ${expenses.length} item${expenses.length !== 1 ? "s" : ""}`, carryExpenses)}
          </Section>
        );
      })()}

      {/* extra income */}
      <Section title="Extra income" hint="Gigs, bonuses, gifts — this month only">
        {extras.map((e) => (
          <Row key={e.id} left={e.name} right={`+ ${fmt(e.amount)}`} rightColor={T.mint} />
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: extras.length ? 10 : 0 }}>
          <input value={extraName} onChange={(e) => setExtraName(e.target.value)} placeholder="Name" style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && addExtra()} />
          <input value={extraAmt} onChange={(e) => setExtraAmt(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="€" style={amtStyle}
            onKeyDown={(e) => e.key === "Enter" && addExtra()} />
          {addBtn(addExtra)}
        </div>
      </Section>

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
          {billRecurring ? "Repeats every month — add it once, it's there every month." : "One-off — this month only."}
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

      {/* day-to-day spending */}
      <Section title="Day-to-day" hint="Quick add — same name adds up automatically">
        {expenses.map((e) => (
          <Row key={e.id} left={`${e.name}${e.count > 1 ? ` ×${e.count}` : ""}`} right={fmt(e.amount)} rightColor={T.ink} />
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: expenses.length ? 10 : 0 }}>
          <input value={expName} onChange={(e) => setExpName(e.target.value)} placeholder="e.g. Uber, coffee…" style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && addExp()} />
          <input value={expAmt} onChange={(e) => setExpAmt(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="€" style={amtStyle}
            onKeyDown={(e) => e.key === "Enter" && addExp()} />
          {addBtn(addExp)}
        </div>
      </Section>
      </div>
    </div>
  );
}
