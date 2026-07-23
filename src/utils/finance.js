/* Month-aware: bills can repeat monthly (added once, appear every month,
   paid status tracked per month). Extras and day-to-day belong to a month. */

export const toMonthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const shiftMonth = (mk, n) => {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toMonthKey(d);
};
export const monthLabel = (mk) => {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
export const financeMonthTotals = (finance, mk) => {
  const bills = finance.bills.filter((b) => b.recurring || b.monthKey === mk);
  const extras = finance.extras.filter((e) => e.monthKey === mk);
  const expenses = finance.expenses.filter((e) => e.monthKey === mk);
  const billSum = bills.reduce((s, b) => s + b.amount, 0);
  const extraSum = extras.reduce((s, e) => s + e.amount, 0);
  const expSum = expenses.reduce((s, e) => s + e.amount, 0);
  const total = (finance.income || 0) + extraSum;
  return { bills, extras, expenses, billSum, extraSum, expSum, total, left: total - billSum - expSum };
};

export const suggestBillCategory = (name) => {
  const n = name.toLowerCase();
  if (/(rent|aluguel|mortgage|condo|hoa|housing)/.test(n)) return "Housing";
  if (/(netflix|spotify|icloud|youtube|prime|disney|hbo|apple|gym|subscription|patreon|chatgpt|claude)/.test(n)) return "Subscriptions";
  if (/(electric|energy|water|gas|internet|wifi|phone|mobile|insurance|bill)/.test(n)) return "Bills";
  return "Other";
};
