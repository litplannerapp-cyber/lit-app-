import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: "google",
    // the app now lives at /app (root is the marketing landing page) —
    // send people back to the app, not the landing page, after sign-in
    options: { redirectTo: `${window.location.origin}/app` },
  });
  const signOut = () => supabase.auth.signOut();

  return { session, user: session?.user ?? null, loading: session === undefined, signInWithGoogle, signOut };
}
