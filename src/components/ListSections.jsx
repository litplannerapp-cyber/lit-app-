import { T } from "../theme";
import { groupListItems } from "../utils/listSections";

/* Renders a list's items, grouped into shop sections (Fruit & veg, Dairy &
   eggs…) when the list looks like a shopping list — see
   utils/listSections. Each call site keeps its own row design through
   renderItem(item, index); index is the item's position in the stored
   array, so toggles and removals still hit the right item. A list that
   isn't a shop renders exactly as before. */
export function ListSections({ items, title, renderItem, gap = 10 }) {
  const sections = groupListItems(items, title);
  if (!sections) return <>{(items || []).map((it, ix) => renderItem(it, ix))}</>;
  return (
    <>
      {sections.map((s, si) => {
        const left = s.entries.filter(({ it }) => !it.done).length;
        const allDone = left === 0;
        return (
          <section key={s.key} aria-label={s.label} style={{ marginTop: si === 0 ? 0 : gap }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 2px 3px", opacity: allDone ? 0.55 : 1, transition: "opacity .25s" }}>
              <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 3, flexShrink: 0, background: s.color || T.ink3 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, fontWeight: 750, letterSpacing: "0.09em", textTransform: "uppercase", color: T.ink2 }}>{s.label}</span>
              <span style={{ fontSize: 10.5, fontWeight: 650, color: allDone ? T.mint : T.ink3 }}>
                {allDone ? "✓" : left}
              </span>
            </div>
            {s.entries.map(({ it, ix }) => renderItem(it, ix))}
          </section>
        );
      })}
    </>
  );
}
