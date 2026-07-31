import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* Lit's own account system — email + a 6-digit code, not a third-party
     login. Deliberate: Apple's App Store guideline 4.8 only requires
     "Sign in with Apple" when an app uses a third-party/social login
     (Google, Facebook, etc.) for its primary account; an app using
     exclusively its own sign-in system is exempt. */
  const sendOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  };
  const verifyOtp = async (email, code) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) throw error;
  };
  const signOut = () => supabase.auth.signOut();

  return { session, user: session?.user ?? null, loading: session === undefined, sendOtp, verifyOtp, signOut };
}
