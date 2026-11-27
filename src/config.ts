/**
 * Everything that changes between deploys comes from the environment, with the public defaults (twelve-factor III).
 * See .env.example.
 *   SITE_URL     where the emails' images are served from: the live site, or a fork's own
 *   REPO_URL     the source repository: each rule's `see` link and the site's links point at it
 *   BUILD_DATE   the date printed on the reports (YYYY-MM-DD), so a build can be repeated exactly; today if unset
 *   CHROME_PATH  the Chrome or Chromium that prints the reports (src/browser.ts)
 *   PORT         where `npm run serve` listens (site/serve.ts)
 * Runs in Node and, for the plugin's `see` links, in the browser, where there's no environment and the defaults apply.
 */
const env: Record<string, string | undefined> = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

function url(name: string, fallback: string): string {
  const value = env[name]?.trim();
  if (!value) return fallback;
  try {
    return new URL(value).href.replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be a full URL, such as ${fallback}, not "${value}"`);
  }
}

export const SITE_URL = url("SITE_URL", "https://readable-email.vercel.app");
export const REPO_URL = url("REPO_URL", "https://github.com/Failureguy94/readable");

/** The reports' date: BUILD_DATE if it's set, so two builds of the same commit print the same reports. */
export function buildDate(): Date {
  const value = env.BUILD_DATE?.trim();
  if (!value) return new Date();
  const date = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(+date)) throw new Error(`BUILD_DATE must be a date like 2026-11-27, not "${value}"`);
  return date;
}
