/* period + time ordering: explicit period wins; otherwise the time infers it
   (before 12:00 = morning, before 17:00 = afternoon, else evening); tasks with
   neither sort last, in the order they were added. */
const PERIOD_RANK = { morning: 0, afternoon: 1, evening: 2 };

export const inferPeriod = (t) => {
  if (t.period) return t.period;
  if (t.time) {
    const h = Number(t.time.split(":")[0]);
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }
  return null;
};

export const byPeriodAndTime = (a, b) => {
  const pa = inferPeriod(a), pb = inferPeriod(b);
  if (pa && !pb) return -1;
  if (!pa && pb) return 1;
  if (pa && pb && pa !== pb) return PERIOD_RANK[pa] - PERIOD_RANK[pb];
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time && !b.time) return -1;
  if (!a.time && b.time) return 1;
  return 0;
};

export const goalPct = (g) => (g.milestones.length ? Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100) : 0);

/* a scheduled list's items are stored as either plain strings (legacy) or
   { text, done } objects — every reader normalizes through here so the two
   shapes never have to be handled twice. */
export const normalizeListItems = (items) => (items || []).map((it) => (typeof it === "string" ? { text: it, done: false } : it));

/* a list with items is "done" only when every one of them is ticked; a list
   with zero items has no derived state of its own (it behaves like a plain
   task, toggled directly) — callers that need to distinguish the two check
   items.length separately. */
export const isListDone = (items) => {
  const normalized = normalizeListItems(items);
  return normalized.length > 0 && normalized.every((it) => it.done);
};
