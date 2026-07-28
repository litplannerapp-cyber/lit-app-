import { T } from "../theme";

/* A real, generic loading indicator — deliberately NOT the halo mark, so the
   two are never visually confused (a large ring alone reads as a spinner
   before it reads as a logo, which is exactly the mixup to avoid). */
export function Spinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={T.hairline} strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke={T.ink2} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
