import { T } from "../theme";

export const Card = ({ children, style, ...p }) => (
  <div style={{ background: T.card, borderRadius: T.r, boxShadow: T.shadow, border: `1px solid ${T.stroke}`, ...style }} {...p}>{children}</div>
);
