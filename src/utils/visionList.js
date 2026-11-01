/* A Vision "list" (e.g. "Italy trip: book hotel, reserve restaurants") is
   stored as an ordinary vision_items row with type "list" and its content
   as JSON — { title, items: [{ text, done }] } — so it needs no schema
   change and moves/reorders/deletes/tags exactly like any other item. */
export const parseVisionList = (content) => {
  try {
    const v = JSON.parse(content);
    return { title: String(v?.title || "List"), items: Array.isArray(v?.items) ? v.items.map((i) => ({ text: String(i.text || ""), done: !!i.done })) : [] };
  } catch {
    return { title: String(content || "List"), items: [] };
  }
};
export const visionListContent = (list) => JSON.stringify({ title: list.title, items: list.items });
