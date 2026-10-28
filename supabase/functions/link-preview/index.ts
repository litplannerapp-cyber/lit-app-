// Fetches Open Graph metadata (title, image, site name) for a URL an Inbox
// capture points to. Runs server-side because the browser can't read
// another site's HTML directly — a plain client-side fetch() to an
// arbitrary origin is blocked by CORS unless that site opts in, which most
// don't. The result is cached by the caller onto the capture row
// (preview_title/preview_image/preview_site) so this only runs once per
// link, not on every render.
//
// Any signed-in user can call this, so it's guarded against being used as
// an open URL-fetching proxy: only http/https, and any hostname/IP that
// resolves to loopback/private/link-local space is rejected up front and
// again on every redirect hop (not just the first request) — otherwise a
// public URL that 302s to http://169.254.169.254/... (cloud metadata) or
// http://localhost/... would sail through unblocked.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const MAX_REDIRECTS = 4;
const MAX_BYTES = 200_000; // enough for <head>; stop reading well before any page body
const FETCH_TIMEOUT_MS = 6000;

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 0 || a === 127) return true; // "this" network, loopback
  if (a === 10) return true; // RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata endpoint
  return false;
}
function isPrivateIPv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "::1") return true;
  if (h.startsWith("fe80:")) return true; // link-local
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local (fc00::/7)
  return false;
}
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (isPrivateIPv4(h)) return true;
  if (h.includes(":") && isPrivateIPv6(h)) return true;
  return false;
}
function safeUrl(raw: string, base?: URL): URL | null {
  let u: URL;
  try {
    u = base ? new URL(raw, base) : new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (isBlockedHost(u.hostname)) return null;
  return u;
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

async function fetchHtml(start: URL): Promise<string | null> {
  let current = start;
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LitLinkPreview/1.0; +https://litplanner.app)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
    } catch {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      const next = loc ? safeUrl(loc, current) : null;
      if (!next) return null;
      current = next;
      continue;
    }
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html")) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        if (received >= MAX_BYTES) {
          reader.cancel();
          break;
        }
      }
    }
    return new TextDecoder().decode(concatChunks(chunks));
  }
  return null; // too many redirects
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}
function extractMetaProp(html: string, prop: string): string | null {
  const re1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${prop}["']`, "i");
  const m = html.match(re1) || html.match(re2);
  return m ? decodeHtmlEntities(m[1]).trim() || null : null;
}
function extractMetaName(html: string, name: string): string | null {
  const re1 = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i");
  const m = html.match(re1) || html.match(re2);
  return m ? decodeHtmlEntities(m[1]).trim() || null : null;
}
function extractTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeHtmlEntities(m[1]).trim() || null : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonResponse = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Only used to confirm the caller is a real signed-in user — no DB
    // reads/writes happen here, this just stops the function being an open
    // unauthenticated URL-fetching proxy.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const rawUrl = typeof body?.url === "string" ? body.url : null;
    if (!rawUrl) {
      return jsonResponse({ error: "Missing url" }, 400);
    }

    const target = safeUrl(rawUrl);
    if (!target) {
      return jsonResponse({ error: "Unsupported or blocked URL" }, 400);
    }

    const site = target.hostname.replace(/^www\./, "");
    const html = await fetchHtml(target);
    if (!html) {
      // Best-effort: the page couldn't be fetched/parsed — the caller
      // falls back to showing the plain URL, so this is a normal outcome,
      // not an error.
      return jsonResponse({ title: null, image: null, site }, 200);
    }

    const title = extractMetaProp(html, "og:title") || extractTitleTag(html) || site;
    let image = extractMetaProp(html, "og:image") || extractMetaName(html, "twitter:image");
    if (image) {
      const abs = safeUrl(image, target);
      image = abs ? abs.toString() : null;
    }
    const siteName = extractMetaProp(html, "og:site_name") || site;

    return jsonResponse({ title, image, site: siteName }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
