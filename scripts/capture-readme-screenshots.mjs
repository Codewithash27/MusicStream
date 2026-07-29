/**
 * Capture full desktop screenshots in real Chrome for the README.
 * Usage: node scripts/capture-readme-screenshots.mjs
 */
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "screenshots");
const BASE = process.env.APP_URL || "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const ADMIN_USER = process.env.DEMO_ADMIN_USER || "lucifer";
const ADMIN_PASS = process.env.DEMO_ADMIN_PASS || "Aman@27052004";

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: "png", fullPage: false });
  console.log(`saved ${file}`);
}

async function waitReady(page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes("Loading…"),
    { timeout: 20000 },
  ).catch(() => undefined);
  await new Promise((r) => setTimeout(r, 800));
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: [
      "--window-size=1440,900",
      "--hide-scrollbars",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // Landing (logged out)
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, "01-landing");

  // Login page
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, "02-login");

  // Sign in as admin
  await page.type('input[placeholder="you@email.com"], input[name="identifier"]', ADMIN_USER, {
    delay: 20,
  });
  const passwordInput = await page.$('input[type="password"]');
  if (!passwordInput) throw new Error("password input not found");
  await passwordInput.type(ADMIN_PASS, { delay: 20 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => undefined),
  ]);
  await page.waitForFunction(() => location.pathname.includes("/home"), { timeout: 30000 });
  await waitReady(page);
  await shot(page, "03-home");

  await page.goto(`${BASE}/search`, { waitUntil: "networkidle2", timeout: 60000 });
  await waitReady(page);
  await shot(page, "04-search");

  await page.goto(`${BASE}/library`, { waitUntil: "networkidle2", timeout: 60000 });
  await waitReady(page);
  await shot(page, "05-library");

  // Playlist detail if present
  const playlistHref = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find((el) =>
      /\/playlist\//.test(el.getAttribute("href") || ""),
    );
    return a ? a.href : null;
  });
  if (playlistHref) {
    await page.goto(playlistHref, { waitUntil: "networkidle2", timeout: 60000 });
    await waitReady(page);
    await shot(page, "06-playlist");
  } else {
    console.log("no playlist found, skipping 06-playlist");
  }

  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2", timeout: 60000 });
  await waitReady(page);
  await new Promise((r) => setTimeout(r, 1000));
  await shot(page, "07-admin");

  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
