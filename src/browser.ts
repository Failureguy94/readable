/** A headless Chromium for screenshots and PDFs: the system Chrome, or CHROME_PATH. */
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";

const candidates = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"];

export async function launch() {
  const executablePath = candidates.find((p) => p && existsSync(p));
  if (!executablePath) throw new Error("No Chrome or Chromium found. Set CHROME_PATH to one.");
  return chromium.launch({ executablePath, headless: true });
}
