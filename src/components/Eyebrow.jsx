import { T } from "../theme";

export const Eyebrow = ({ children, style }) => (
  <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink3, fontWeight: 600, ...style }}>{children}</div>
);
