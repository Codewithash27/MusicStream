/** Resolve backend media paths for the Vite frontend origin. */

export function mediaOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
  return base.replace(/\/?api\/v1\/?$/, "").replace(/\/$/, "") || "http://127.0.0.1:8000";
}

/** Turn `/media/...` into `http://127.0.0.1:8000/media/...`. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${mediaOrigin()}${path}`;
}
