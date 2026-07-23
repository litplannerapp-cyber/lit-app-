import { T } from "../theme";

export const Row = ({ left, right, rightColor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 2px", borderBottom: `1px solid ${T.hairline}`, fontSize: 14 }}>
    <span style={{ fontWeight: 500 }}>{left}</span>
    <span style={{ fontWeight: 600, color: rightColor }}>{right}</span>
  </div>
);
