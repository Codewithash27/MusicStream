#!/usr/bin/env python3
"""
Diagnose Render (backend) + Vercel (frontend) integration issues.

Checks:
1) Backend root/health/storage endpoints
2) Auth endpoint behavior (GET vs POST)
3) CORS preflight for frontend origin
4) Frontend HTML and JS assets for localhost fallback leaks
5) Optional login/register attempt status with provided credentials

Usage:
  python diagnose_deploy.py
  python diagnose_deploy.py --backend https://musicstream-x01y.onrender.com --frontend https://music-stream-eight-zeta.vercel.app
  python diagnose_deploy.py --identifier you@email.com --password yourpass
"""

from __future__ import annotations

import argparse
import re
import sys
from typing import Iterable
from urllib.parse import urljoin

import requests


def title(text: str) -> None:
    print(f"\n=== {text} ===")


def req(
    method: str,
    url: str,
    *,
    timeout: int = 20,
    expected: Iterable[int] | None = None,
    **kwargs,
):
    try:
        response = requests.request(method, url, timeout=timeout, **kwargs)
    except Exception as exc:  # noqa: BLE001
        print(f"[{method}] {url} -> ERROR: {exc}")
        return None

    status = response.status_code
    expected_note = ""
    if expected is not None and status not in expected:
        expected_note = f"  (unexpected; expected {sorted(set(expected))})"
    print(f"[{method}] {url} -> {status}{expected_note}")
    return response


def print_body_preview(response: requests.Response | None, *, limit: int = 220) -> None:
    if response is None:
        return
    content_type = (response.headers.get("content-type") or "").lower()
    body = response.text.strip()
    if not body:
        print("  body: <empty>")
        return
    if "json" in content_type:
        print(f"  json: {body[:limit]}")
    else:
        short = re.sub(r"\s+", " ", body[:limit])
        print(f"  text: {short}")


def check_backend(base: str) -> None:
    title("Backend checks")
    root = req("GET", f"{base}/", expected=[200])
    print_body_preview(root)

    health = req("GET", f"{base}/api/v1/health", expected=[200])
    print_body_preview(health)

    storage = req("GET", f"{base}/api/v1/storage/health", expected=[200])
    print_body_preview(storage)

    login_get = req("GET", f"{base}/api/v1/auth/login", expected=[405])
    print_body_preview(login_get)

    login_post = req(
        "POST",
        f"{base}/api/v1/auth/login",
        json={"identifier": "dummy", "password": "dummy-pass-123"},
        headers={"Content-Type": "application/json"},
        expected=[200, 400, 401, 422],
    )
    print_body_preview(login_post)


def check_cors(base: str, frontend_origin: str) -> None:
    title("CORS preflight check")
    options = req(
        "OPTIONS",
        f"{base}/api/v1/auth/login",
        headers={
            "Origin": frontend_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
        expected=[200, 204],
    )
    if options is None:
        return

    print("  access-control-allow-origin:", options.headers.get("access-control-allow-origin"))
    print("  access-control-allow-methods:", options.headers.get("access-control-allow-methods"))
    print("  access-control-allow-headers:", options.headers.get("access-control-allow-headers"))

    allowed_origin = options.headers.get("access-control-allow-origin")
    if allowed_origin not in (frontend_origin, "*"):
        print("  !! CORS origin mismatch. Backend may block frontend requests.")


def extract_js_assets(html: str) -> list[str]:
    # Match script src="/assets/xyz.js" and modulepreload href="/assets/xyz.js"
    script_src = re.findall(r'<script[^>]+src="([^"]+\.js[^"]*)"', html, flags=re.IGNORECASE)
    preload_href = re.findall(r'<link[^>]+href="([^"]+\.js[^"]*)"', html, flags=re.IGNORECASE)
    assets = script_src + preload_href
    deduped: list[str] = []
    seen: set[str] = set()
    for asset in assets:
        if asset not in seen:
            deduped.append(asset)
            seen.add(asset)
    return deduped


def check_frontend_bundle(frontend: str) -> None:
    title("Frontend bundle checks")
    page = req("GET", f"{frontend}/login", expected=[200])
    if page is None:
        return
    print_body_preview(page, limit=120)

    html = page.text
    assets = extract_js_assets(html)
    if not assets:
        print("  !! No JS assets found in HTML. Check if deployment is valid.")
        return

    print(f"  Found {len(assets)} JS asset reference(s). Scanning for API URL...")
    localhost_hits = 0
    render_hits = 0

    for asset in assets[:12]:
        asset_url = urljoin(frontend, asset)
        js = req("GET", asset_url, expected=[200])
        if js is None:
            continue
        body = js.text
        if "127.0.0.1:8000" in body or "localhost:8000" in body:
            localhost_hits += 1
            print(f"  !! Localhost fallback found in asset: {asset}")
        if "musicstream-x01y.onrender.com/api/v1" in body:
            render_hits += 1

    print(f"  localhost references found: {localhost_hits}")
    print(f"  render URL references found: {render_hits}")

    if localhost_hits > 0:
        print("  !! Frontend bundle still contains localhost API base. Env or redeploy issue.")
    elif render_hits == 0:
        print("  !! Could not find Render API URL in sampled assets. Check env var + redeploy.")
    else:
        print("  OK: Frontend bundle appears to reference Render API URL.")


def check_live_auth_call(
    base: str,
    *,
    identifier: str | None,
    password: str | None,
) -> None:
    title("Optional real auth call")
    if not identifier or not password:
        print("Skipped (no --identifier/--password provided).")
        return

    login = req(
        "POST",
        f"{base}/api/v1/auth/login",
        json={"identifier": identifier, "password": password},
        headers={"Content-Type": "application/json"},
        expected=[200, 400, 401, 422],
    )
    print_body_preview(login)
    if login is not None and login.status_code == 200:
        print("  OK: Login works from direct backend call.")


def normalize(url: str) -> str:
    return url.rstrip("/")


def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnose Render+Vercel deployment wiring.")
    parser.add_argument(
        "--backend",
        default="https://musicstream-x01y.onrender.com",
        help="Backend base URL (Render).",
    )
    parser.add_argument(
        "--frontend",
        default="https://music-stream-eight-zeta.vercel.app",
        help="Frontend base URL (Vercel).",
    )
    parser.add_argument("--identifier", default=None, help="Optional login identifier/email/username.")
    parser.add_argument("--password", default=None, help="Optional login password.")
    args = parser.parse_args()

    backend = normalize(args.backend)
    frontend = normalize(args.frontend)

    print("Deploy diagnostics")
    print("Backend :", backend)
    print("Frontend:", frontend)

    check_backend(backend)
    check_cors(backend, frontend)
    check_frontend_bundle(frontend)
    check_live_auth_call(backend, identifier=args.identifier, password=args.password)

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

