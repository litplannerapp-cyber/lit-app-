import { supabase } from "./supabaseClient";

/* ---------- mappers: DB row (snake_case) <-> app shape (camelCase) ---------- */

const taskFromRow = (r) => ({
  id: r.id, text: r.text, notes: r.notes || "", dateKey: r.date_key, done: r.done, top3: r.top3,
  time: r.time || "", endTime: r.end_time || "", period: r.period || null, priority: r.priority,
  group: r.group_name ? { name: r.group_name, color: r.group_color } : null,
});
const taskToRow = (t, userId) => ({
  user_id: userId, text: t.text, notes: t.notes || "", date_key: t.dateKey, done: !!t.done, top3: !!t.top3,
  time: t.time || null, end_time: t.endTime || null, period: t.period || null, priority: !!t.priority,
  group_name: t.group?.name ?? null, group_color: t.group?.color ?? null,
});

const captureFromRow = (r) => ({
  id: r.id, type: r.type, title: r.title, text: r.text, url: r.url, imageUrl: r.image_url,
  items: r.items || [], tags: r.tags || [], createdAt: new Date(r.created_at).getTime(),
});
const captureToRow = (c, userId) => ({
  user_id: userId, type: c.type, title: c.title ?? null, text: c.text ?? null, url: c.url ?? null,
  image_url: c.imageUrl ?? null, items: c.items ?? [], tags: c.tags ?? [],
});

const visionItemFromRow = (r) => ({ id: r.id, type: r.type, content: r.content, tags: r.tags || [] });
const visionItemToRow = (item, userId, boardId, position) => ({
  user_id: userId, board_id: boardId ?? null, type: item.type, content: item.content, tags: item.tags || [], position: position ?? 0,
});

const billFromRow = (r) => ({
  id: r.id, name: r.name, amount: Number(r.amount), category: r.category, recurring: r.recurring,
  ...(r.recurring ? { paidMonths: r.paid_months || {} } : { monthKey: r.month_key, paid: r.paid }),
});
const extraFromRow = (r) => ({ id: r.id, name: r.name, amount: Number(r.amount), monthKey: r.month_key, carriedFrom: r.carried_from, kind: r.kind });
const expenseFromRow = (r) => ({ id: r.id, name: r.name, amount: Number(r.amount), count: r.count, monthKey: r.month_key, carriedFrom: r.carried_from });

/* ---------- initial load ---------- */

export async function fetchAll(userId) {
  const [profileRes, tasksRes, capturesRes, boardsRes, visionItemsRes, goalsRes, milestonesRes,
    financeProfileRes, billsRes, extrasRes, expensesRes, clearedRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("tasks").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("captures").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("boards").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("vision_items").select("*").eq("user_id", userId).order("position", { ascending: false }),
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("milestones").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("finance_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("finance_bills").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("finance_extras").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("finance_expenses").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("cleared_days").select("date_key").eq("user_id", userId),
  ]);

  for (const res of [profileRes, tasksRes, capturesRes, boardsRes, visionItemsRes, goalsRes, milestonesRes,
    financeProfileRes, billsRes, extrasRes, expensesRes, clearedRes]) {
    if (res.error) throw res.error;
  }

  const visionItems = visionItemsRes.data.map(visionItemFromRow).map((item, i) => ({ item, boardId: visionItemsRes.data[i].board_id }));
  const boards = boardsRes.data.map((b) => ({
    id: b.id, name: b.name, color: b.color, coverUrl: b.cover_url,
    items: visionItems.filter((v) => v.boardId === b.id).map((v) => v.item),
  }));
  const looseItems = visionItems.filter((v) => v.boardId == null).map((v) => v.item);

  const milestonesByGoal = {};
  milestonesRes.data.forEach((m) => {
    (milestonesByGoal[m.goal_id] = milestonesByGoal[m.goal_id] || []).push({ id: m.id, text: m.text, done: m.done });
  });
  const goals = goalsRes.data.map((g) => ({ id: g.id, title: g.title, targetDate: g.target_date, milestones: milestonesByGoal[g.id] || [] }));

  return {
    profile: profileRes.data ? { name: profileRes.data.name, onboarded: profileRes.data.onboarded } : null,
    tasks: tasksRes.data.map(taskFromRow),
    captures: capturesRes.data.map(captureFromRow),
    boards, looseItems, goals,
    finance: {
      income: financeProfileRes.data ? (financeProfileRes.data.income == null ? null : Number(financeProfileRes.data.income)) : null,
      bills: billsRes.data.map(billFromRow),
      extras: extrasRes.data.map(extraFromRow),
      expenses: expensesRes.data.map(expenseFromRow),
    },
    clearedDays: clearedRes.data.map((r) => r.date_key),
  };
}

/* ---------- profile ---------- */

export async function ensureProfile(userId, defaultName) {
  const { data, error } = await supabase.from("profiles").upsert(
    { user_id: userId, name: defaultName },
    { onConflict: "user_id", ignoreDuplicates: true },
  ).select().maybeSingle();
  if (error) throw error;
  return data;
}
/* Postgrest's query builder only implements .then(), not .catch()/.finally() —
   calling .catch() straight on one throws synchronously ("not a function") and
   can abort whatever cleanup runs after it at the call site. Promise.resolve()
   assimilates it into a real Promise so every caller's `.catch(...)` is safe. */
export const saveProfileName = (userId, name) => Promise.resolve(supabase.from("profiles").update({ name }).eq("user_id", userId));
export const saveOnboarded = (userId, onboarded) => Promise.resolve(supabase.from("profiles").update({ onboarded }).eq("user_id", userId));

/* ---------- tasks ---------- */

export async function dbInsertTask(userId, task) {
  const { data, error } = await supabase.from("tasks").insert(taskToRow(task, userId)).select().single();
  if (error) throw error;
  return taskFromRow(data);
}
export const dbUpdateTask = (id, patch) => Promise.resolve(supabase.from("tasks").update(patch).eq("id", id));
export const dbReplaceTask = (id, task, userId) => Promise.resolve(supabase.from("tasks").update(taskToRow(task, userId)).eq("id", id));
export const dbDeleteTask = (id) => Promise.resolve(supabase.from("tasks").delete().eq("id", id));

/* ---------- captures ---------- */

export async function dbInsertCapture(userId, capture) {
  const { data, error } = await supabase.from("captures").insert(captureToRow(capture, userId)).select().single();
  if (error) throw error;
  return captureFromRow(data);
}
export const dbUpdateCapture = (id, patch) => Promise.resolve(supabase.from("captures").update(patch).eq("id", id));
export const dbDeleteCapture = (id) => Promise.resolve(supabase.from("captures").delete().eq("id", id));

/* ---------- boards & vision items ---------- */

export async function dbInsertBoard(userId, board) {
  const { data, error } = await supabase.from("boards").insert({ user_id: userId, name: board.name, color: board.color, cover_url: board.coverUrl ?? null }).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, color: data.color, coverUrl: data.cover_url, items: [] };
}
export const dbUpdateBoard = (id, patch) => Promise.resolve(supabase.from("boards").update(patch).eq("id", id));
export const dbDeleteBoard = (id) => Promise.resolve(supabase.from("boards").delete().eq("id", id));

export async function dbInsertVisionItem(userId, item, boardId, position) {
  const { data, error } = await supabase.from("vision_items").insert(visionItemToRow(item, userId, boardId, position)).select().single();
  if (error) throw error;
  return visionItemFromRow(data);
}
export const dbMoveVisionItem = (id, boardId) => Promise.resolve(supabase.from("vision_items").update({ board_id: boardId ?? null }).eq("id", id));
export const dbUpdateVisionItem = (id, patch) => Promise.resolve(supabase.from("vision_items").update(patch).eq("id", id));
export const dbUpdateVisionItemPositions = (updates) => Promise.all(updates.map(({ id, position }) => supabase.from("vision_items").update({ position }).eq("id", id)));
export const dbDeleteVisionItem = (id) => Promise.resolve(supabase.from("vision_items").delete().eq("id", id));

/* ---------- goals & milestones ---------- */

export async function dbInsertGoal(userId, goal) {
  const { data, error } = await supabase.from("goals").insert({ user_id: userId, title: goal.title, target_date: goal.targetDate || null }).select().single();
  if (error) throw error;
  const milestoneRows = goal.milestones.length
    ? await supabase.from("milestones").insert(goal.milestones.map((m) => ({ goal_id: data.id, user_id: userId, text: m.text, done: false }))).select()
    : { data: [] };
  if (milestoneRows.error) throw milestoneRows.error;
  return { id: data.id, title: data.title, targetDate: data.target_date, milestones: milestoneRows.data.map((m) => ({ id: m.id, text: m.text, done: m.done })) };
}
export async function dbInsertMilestone(userId, goalId, text) {
  const { data, error } = await supabase.from("milestones").insert({ goal_id: goalId, user_id: userId, text, done: false }).select().single();
  if (error) throw error;
  return { id: data.id, text: data.text, done: data.done };
}
export const dbUpdateMilestone = (id, patch) => Promise.resolve(supabase.from("milestones").update(patch).eq("id", id));

/* ---------- finance ---------- */

export const dbSetIncome = (userId, income) => Promise.resolve(supabase.from("finance_profile").upsert({ user_id: userId, income }, { onConflict: "user_id" }));

export async function dbInsertBill(userId, bill) {
  const row = {
    user_id: userId, name: bill.name, amount: bill.amount, category: bill.category, recurring: bill.recurring,
    month_key: bill.recurring ? null : bill.monthKey, paid: bill.recurring ? false : !!bill.paid,
    paid_months: bill.recurring ? {} : {},
  };
  const { data, error } = await supabase.from("finance_bills").insert(row).select().single();
  if (error) throw error;
  return billFromRow(data);
}
export const dbUpdateBillPaid = (id, recurring, patch) => Promise.resolve(supabase.from("finance_bills").update(patch).eq("id", id));

export async function dbInsertExtra(userId, extra) {
  const { data, error } = await supabase.from("finance_extras").insert({
    user_id: userId, name: extra.name, amount: extra.amount, month_key: extra.monthKey,
    carried_from: extra.carriedFrom ?? null, kind: extra.kind ?? null,
  }).select().single();
  if (error) throw error;
  return extraFromRow(data);
}

export async function dbInsertExpense(userId, expense) {
  const { data, error } = await supabase.from("finance_expenses").insert({
    user_id: userId, name: expense.name, amount: expense.amount, count: expense.count || 1,
    month_key: expense.monthKey, carried_from: expense.carriedFrom ?? null,
  }).select().single();
  if (error) throw error;
  return expenseFromRow(data);
}
export const dbUpdateExpense = (id, patch) => Promise.resolve(supabase.from("finance_expenses").update(patch).eq("id", id));

/* ---------- streak ---------- */

export const dbInsertClearedDay = (userId, dateKey) => Promise.resolve(supabase.from("cleared_days").insert({ user_id: userId, date_key: dateKey }));
