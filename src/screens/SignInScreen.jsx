import { useState } from "react";
import { T } from "../theme";
import { HaloMark } from "../icons/Icons";
import { Spinner } from "../components/Spinner";

/* Maps Supabase's documented auth error codes to copy a person can act on.
   error.code is the stable identifier (https://supabase.com/docs/guides/auth/debugging/error-codes);
   error.message is GoTrue's own (English, sometimes terse) text — used only
   as a last-resort fallback for codes not explicitly handled below. */
function friendlyError(err) {
  switch (err?.code) {
    case "otp_expired":
      return "That code has expired. Request a new one.";
    case "over_email_send_rate_limit":
      return "Too many requests — wait a moment before asking for another code.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a moment before trying again.";
    case "email_address_invalid":
      return "That email address looks invalid.";
    case "signup_disabled":
      return "New sign-ups aren't open right now.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}

/* Email + code, Structured-style — the app's own account system, not a
   third-party/social login. This matters beyond preference: Apple's
   App Store guideline 4.8 only requires "Sign in with Apple" when an app
   uses a third-party login (Google, Facebook, etc.) to set up the primary
   account. An app using exclusively its own sign-in system is exempt —
   so this choice is also what keeps App Store submission simple.
   Same four fixes from the earlier review still apply: the halo is always
   fused with the wordmark (never alone, never spinner-shaped), vertical
   rhythm is one deliberate group, body copy is Inter, and the loading
   state uses a plain generic spinner, never the brand mark. */
export function SignInScreen({ onSendCode, onVerifyCode }) {
  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const sendCode = async () => {
    if (!isValidEmail) { setError("Enter a valid email."); return; }
    setError("");
    setLoading(true);
    try {
      await onSendCode(email.trim());
      setStep("code");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.trim().length !== 6) { setError("Enter the 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      await onVerifyCode(email.trim(), code.trim());
      // onAuthStateChange picks up the new session and the app moves on by itself
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  return (
    <div className="full-screen-center" style={{ background: T.pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 320 }}>

        {/* one fused lockup — icon and wordmark tight together, never the
            ring shown by itself */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HaloMark size={40} />
          <span className="fr" style={{ fontSize: 30, fontWeight: 700, color: T.ink, lineHeight: 1 }}>Lit</span>
        </div>

        {/* Inter, not Fraunces — body copy stays in the UI typeface */}
        <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 14.5, color: T.ink2, textAlign: "center", lineHeight: 1.5, margin: 0 }}>
          {step === "email"
            ? "Light your mind. Enter your email to sign in."
            : <>We sent a code to <strong style={{ color: T.ink }}>{email}</strong>.</>}
        </p>

        {step === "email" ? (
          <div style={{ width: "100%" }}>
            <input autoFocus type="email" inputMode="email" enterKeyHint="go" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="you@email.com"
              style={{ width: "100%", padding: "14px 18px", borderRadius: 15, border: `1px solid ${error ? T.coral : T.stroke}`, outline: "none", background: T.card, fontSize: 15, fontFamily: "'Inter',system-ui,sans-serif", color: T.ink, boxShadow: T.shadowSm }} />
            {error && <p style={{ color: T.coral, fontSize: 12.5, marginTop: 8, fontFamily: "'Inter',system-ui,sans-serif" }}>{error}</p>}
            <button onClick={sendCode} disabled={loading} className="pressable"
              style={{ width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", borderRadius: 15, background: T.coralGrad, color: "#fff", fontSize: 14.5, fontWeight: 650, fontFamily: "'Inter',system-ui,sans-serif", cursor: loading ? "default" : "pointer", boxShadow: "0 10px 24px rgba(255,107,94,.3)", opacity: loading ? 0.85 : 1 }}>
              {loading ? <Spinner size={16} /> : null}
              {loading ? "Sending…" : "Continue"}
            </button>
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <input autoFocus type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} enterKeyHint="done"
              value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              placeholder="000000"
              style={{ width: "100%", padding: "14px 18px", borderRadius: 15, border: `1px solid ${error ? T.coral : T.stroke}`, outline: "none", background: T.card, fontSize: 22, fontWeight: 700, letterSpacing: "0.3em", textAlign: "center", fontFamily: "'Inter',system-ui,sans-serif", color: T.ink, boxShadow: T.shadowSm }} />
            {error && <p style={{ color: T.coral, fontSize: 12.5, marginTop: 8, textAlign: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>{error}</p>}
            <button onClick={verifyCode} disabled={loading} className="pressable"
              style={{ width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", borderRadius: 15, background: T.coralGrad, color: "#fff", fontSize: 14.5, fontWeight: 650, fontFamily: "'Inter',system-ui,sans-serif", cursor: loading ? "default" : "pointer", boxShadow: "0 10px 24px rgba(255,107,94,.3)", opacity: loading ? 0.85 : 1 }}>
              {loading ? <Spinner size={16} /> : null}
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <button onClick={() => { setStep("email"); setCode(""); setError(""); }}
              style={{ display: "block", width: "100%", marginTop: 14, textAlign: "center", fontSize: 12.5, color: T.ink3, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',system-ui,sans-serif" }}>
              Use a different email
            </button>
          </div>
        )}
      </div>

      <p style={{ position: "absolute", bottom: 28, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 11.5, color: T.ink3, textAlign: "center" }}>
        By continuing, you agree to Lit's Terms & Privacy Policy.
      </p>
    </div>
  );
}
