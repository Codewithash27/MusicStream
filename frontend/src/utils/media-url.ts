/** Resolve media URLs for the frontend.

Supabase Storage returns absolute public URLs — those are returned unchanged.
Relative paths (legacy) are prefixed with the API origin.
*/

export function mediaOrigin(): string {
  const base =
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://127.0.0.1:8000/api/v1";
  return base.replace(/\/?api\/v1\/?$/, "").replace(/\/$/, "") || "http://127.0.0.1:8000";
}

/** Pass through absolute URLs; prefix relative ones with the API host. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${mediaOrigin()}${path}`;
}
