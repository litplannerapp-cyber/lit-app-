import { PHRASES } from "../constants";

/* local date components only, never toISOString (avoids UTC-shift bugs) */
export const toDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const keyToDate = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
export const uid = () => Math.random().toString(36).slice(2, 10);

const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
export const phraseForToday = () => PHRASES[dayOfYear(new Date()) % PHRASES.length];
