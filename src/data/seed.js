import { uid } from "../utils/date";

export function seedTasks(todayKey) {
  return [
    { id: uid(), text: "Review Lit onboarding flow", dateKey: todayKey, done: false, top3: true, group: { name: "Work", color: "#FF6B5E" } },
    { id: uid(), text: "30-min walk by the canal", dateKey: todayKey, done: true, top3: true, group: { name: "Health", color: "#7FB5E0" } },
    { id: uid(), text: "Reply to Ana about the contract", dateKey: todayKey, done: false, top3: true, group: { name: "Work", color: "#FF6B5E" } },
    { id: uid(), text: "Book dentist appointment", dateKey: todayKey, done: false, top3: false, group: { name: "Personal", color: "#5EC9A7" } },
    { id: uid(), text: "Water the plants", dateKey: todayKey, done: false, top3: false, group: { name: "Personal", color: "#5EC9A7" } },
    { id: uid(), text: "Sketch Finance empty state", dateKey: todayKey, done: false, top3: false, group: { name: "Work", color: "#FF6B5E" } },
  ];
}

export function seedCaptures() {
  return [
    { id: uid(), type: "note", text: "Idea: weekly review as a Sunday ritual, opt-in", tags: ["lit"], createdAt: Date.now() - 3600e3 },
    { id: uid(), type: "list", title: "Groceries", items: [{ text: "Oat milk", done: false }, { text: "Coffee beans", done: true }, { text: "Lemons", done: false }], tags: [], createdAt: Date.now() - 7200e3 },
  ];
}

export function seedBoards() {
  return [
    {
      id: uid(), name: "Everything", color: "#FFC29E", coverUrl: null, items: [
        { id: uid(), type: "text", content: "A calm home with morning light and no clutter.", tags: ["home"] },
        { id: uid(), type: "text", content: "Work that feels like craft, not noise.", tags: ["work"] },
      ],
    },
    {
      id: uid(), name: "Slow mornings", color: "#7FB5E0", coverUrl: null, items: [
        { id: uid(), type: "text", content: "Coffee before screens. Every day.", tags: ["home"] },
      ],
    },
  ];
}

export function seedGoals() {
  return [
    {
      id: uid(), title: "Launch Lit v1", targetDate: "2026-09-30", milestones: [
        { id: uid(), text: "Finish Today screen polish", done: true },
        { id: uid(), text: "Ship Inbox capture flow", done: true },
        { id: uid(), text: "Beta with 20 testers", done: false },
        { id: uid(), text: "App Store listing + landing page", done: false },
      ],
    },
  ];
}
