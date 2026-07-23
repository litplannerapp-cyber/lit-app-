import { T } from "../theme";
import { Card } from "./Card";

export const Section = ({ title, hint, children }) => (
  <Card style={{ padding: "20px 18px 18px", marginTop: 16, boxShadow: T.shadowSm }}>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: T.ink3, marginTop: 3, lineHeight: 1.45 }}>{hint}</div>}
    </div>
    {children}
  </Card>
);
