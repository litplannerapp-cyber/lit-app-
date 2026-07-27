import { useState } from "react";
import { T } from "../theme";
import { HaloMark } from "../icons/Icons";
import { Spinner } from "../components/Spinner";

/* Fixes four specific problems flagged in review:
   1. The halo ring alone, at a large size, on an auth screen reads as a
      loading spinner before it reads as a logo — so here it NEVER appears
      alone. It's always fused tight against the wordmark as one lockup,
      and the real loading state below uses a visually distinct plain
      spinner, never this mark, so the two are never confused.
   2. Vertical rhythm is deliberate, not leftover space — the lockup,
      tagline, and button form one centered group with fixed relationships
      between them (gap: 28), not independently top/bottom anchored.
   3. Body copy is Inter, full stop — Fraunces is reserved for display.
   4. The Google button is restyled to the app's own corner-radius and
      elevation system, within Google's brand guidelines (official mark,
      "neutral" light theme, standard padding/typography weight). */
export function SignInScreen({ onSignIn }) {
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    try {
      await onSignIn(); // supabase.auth.signInWithOAuth({ provider: "google" }) — see useAuth.js
    } catch {
      setLoading(false); // OAuth redirect never fires on failure — let the person try again
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 320 }}>

        {/* one fused lockup — icon and wordmark tight together, never the
            ring shown by itself */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HaloMark size={40} />
          <span className="fr" style={{ fontSize: 30, fontWeight: 700, color: T.ink, lineHeight: 1 }}>Lit</span>
        </div>

        {/* Inter, not Fraunces — body copy stays in the UI typeface */}
        <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 14.5, color: T.ink2, textAlign: "center", lineHeight: 1.5, margin: 0 }}>
          Calm, on purpose. Sign in to pick up where you left off.
        </p>

        {/* Google button — official mark, but corner radius and elevation
            matched to the app's own system instead of the stock widget */}
        <button onClick={go} disabled={loading} className="pressable"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 20px", borderRadius: 15, background: T.card, border: `1px solid ${T.stroke}`, boxShadow: T.shadowSm, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <Spinner size={18} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
          )}
          <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 14.5, fontWeight: 600, color: T.ink }}>
            {loading ? "Signing in…" : "Continue with Google"}
          </span>
        </button>
      </div>

      <p style={{ position: "absolute", bottom: 28, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 11.5, color: T.ink3, textAlign: "center" }}>
        By continuing, you agree to Lit's Terms & Privacy Policy.
      </p>
    </div>
  );
}
