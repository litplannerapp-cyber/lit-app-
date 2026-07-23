import { T } from "../theme";
import { HaloMark } from "../icons/Icons";

export function SignInScreen({ onSignIn }) {
  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
      <HaloMark size={84} />
      <div className="fr" style={{ fontSize: 34, fontWeight: 700, marginTop: 18, color: T.ink }}>Lit</div>
      <p style={{ fontSize: 14.5, color: T.ink2, lineHeight: 1.6, margin: "14px 0 32px", maxWidth: 300 }}>
        A calm daily planner. Sign in to keep your days, your vision, and your goals in one quiet place.
      </p>
      <button onClick={onSignIn} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 18, background: T.card, boxShadow: T.shadow, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.7 35.4 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.6-2.6 4.8-4.7 6.4l6.6 5.4C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
