// Shared CORS headers for Edge Functions called directly from the browser
// (web build) — without these, the browser's preflight OPTIONS request
// fails before the function body ever runs.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
