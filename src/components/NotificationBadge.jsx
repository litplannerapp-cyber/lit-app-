import { T } from "../theme";

/* notification badge: a true circle, a card-colored ring that separates it
   from whatever it sits on, and a small pop the instant the count changes —
   brand coral, never alarm-red. */
export function NotificationBadge({ count, size = 20 }) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span key={count} aria-label={`${count} unread`} style={{
      position: "absolute", top: -size * 0.32, right: -size * 0.32,
      minWidth: size, height: size, padding: label.length > 1 ? "0 5px" : 0,
      borderRadius: size, background: T.coralGrad, color: "#fff",
      fontSize: size * 0.52, fontWeight: 800, display: "grid", placeItems: "center",
      border: `2px solid ${T.card}`, boxShadow: "0 2px 6px rgba(0,0,0,.18)",
      animation: "pop .4s cubic-bezier(.34,1.5,.5,1)", lineHeight: 1,
    }}>
      {label}
    </span>
  );
}
