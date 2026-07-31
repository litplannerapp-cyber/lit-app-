import { createClient } from "@supabase/supabase-js";
import { capacitorAuthStorage } from "./capacitorStorage";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — set them in .env");
}
/* createClient() appends /auth/v1 to whatever path VITE_SUPABASE_URL already
   has, so a value copied from Supabase's REST snippet (…/rest/v1) silently
   builds a broken double-path auth URL instead of failing at startup. Catch
   that here with a clear message instead of a mystifying 404 at sign-in. */
if (new URL(url).pathname !== "/") {
  throw new Error(`VITE_SUPABASE_URL must be your bare project URL with no path (e.g. https://xxxx.supabase.co) — got "${url}". Remove any trailing /rest/v1 or similar.`);
}

/* storage: capacitorAuthStorage — session persistence goes through
   Capacitor's Preferences plugin (native on-device storage on iOS, plain
   localStorage under the hood on web) instead of the browser Storage API
   directly, so the session survives the WebView's own storage being
   cleared. persistSession/autoRefreshToken were already the SDK defaults;
   spelled out explicitly here now that a custom storage is in play. */
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: capacitorAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
