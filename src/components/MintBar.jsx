import { T } from "../theme";

export const MintBar = ({ pct }) => (
  <div style={{ height: 8, borderRadius: 4, background: T.bg, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,#5EC9A7,#7FDCC0)`, borderRadius: 4, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
  </div>
);
