/**
 * Builds everything the README and the site show, from the templates:
 *   site/public/*.png               the logo and the "before" banner, drawn from their SVGs
 *   out/<template>/<lang>.html|.txt  each email in each language, and its plain-text part
 *   out/<template>/report.pdf        its accessibility conformance report (a Hyper Elements Document, printed)
 *   out/<template>/before.html       the typical version, and before.json, what Readable finds in it
 *   out/<template>/clients/          Outlook, Gmail and Apple Mail (light and dark) as the emulator draws them
 *   out/summary.json                 the numbers
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { render, validate } from "@hyper-elements/react";
import { renderInEmailClients } from "@hyper-elements/email-clients";
import { TEMPLATES } from "./templates";
import { ConformanceReport, reportValues } from "./templates/report";
import { BEFORE } from "./before";
import { audit } from "./audit";
import { readable } from "./wcag";
import { launch } from "./browser";

const today = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
const browser = await launch();
const tab = await browser.newPage();

// Images an email can show: PNGs, drawn from the SVGs.
for (const name of ["fernhill", "banner"]) {
  const svg = await readFile(`site/public/${name}.svg`, "utf8");
  const [, w, h] = /width="(\d+)" height="(\d+)"/.exec(svg)!;
  await tab.setViewportSize({ width: +w!, height: +h! });
  await tab.setContent(`<body style="margin:0">${svg}</body>`);
  await writeFile(`site/public/${name}.png`, await tab.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: +w!, height: +h! } }));
}
// The emails point at the live site for their images; locally, serve them from site/public.
await tab.route("https://readable-email.vercel.app/**", async (r) => r.fulfill({ body: await readFile("site/public/" + new URL(r.request().url()).pathname.slice(1)), contentType: "image/png" }));

const summary: Record<string, unknown>[] = [];
for (const { slug, template } of TEMPLATES) {
  const dir = join("out", slug);
  await mkdir(join(dir, "clients"), { recursive: true });
  const a = await audit(template);
  for (const l of a.locales) {
    await writeFile(join(dir, `${l}.html`), a.html[l]!);
    await writeFile(join(dir, `${l}.txt`), a.text[l]!);
  }

  const report = await render(<ConformanceReport {...reportValues(a, today)} />);
  await writeFile(join(dir, "report.html"), report.html);
  await tab.setContent(report.html, { waitUntil: "load" });
  await writeFile(join(dir, "report.pdf"), await tab.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true }));

  const before = BEFORE[slug]!;
  const found = (await validate(before, { plugins: [readable({ kind: "transactional" })] })).diagnostics.filter((d) => d.code.includes("/lint-"));
  await writeFile(join(dir, "before.html"), (await render(before)).html);
  await writeFile(join(dir, "before.json"), JSON.stringify(found, null, 2));

  const clients = await renderInEmailClients(a.html.en!, { emailClients: ["outlook", "gmail", "apple-mail"], dark: true });
  for (const p of clients.previews) await writeFile(join(dir, "clients", p.filename), p.html);
  const clientFindings = clients.diagnostics.filter((d) => d.severity === "warning");

  const row = {
    slug,
    label: a.label,
    valid: a.valid,
    rules: a.ruleCount,
    locales: a.locales.length,
    parity: a.parity.ok,
    criteria: { pass: a.criteria.filter((c) => c.status === "pass").length, review: a.criteria.filter((c) => c.status === "review").length, fail: a.criteria.filter((c) => c.status === "fail").length },
    before: { findings: found.length, rules: [...new Set(found.map((d) => d.code.replace(/^email\/lint-/, "")))] },
    clients: { previews: clients.previews.map((p) => p.filename), findings: clientFindings.length },
  };
  summary.push(row);
  console.log(`${slug}: ${a.valid ? "passes" : "FAILS"} ${a.ruleCount} rules × ${a.locales.length} languages, parity ${a.parity.ok}; criteria ${JSON.stringify(row.criteria)}; before: ${found.length} findings (${row.before.rules.length} rules); clients: ${clients.previews.length} previews, ${clientFindings.length} findings`);
  if (!a.valid) for (const d of a.diagnostics.filter((d) => d.severity === "error")) console.log(`  ${d.locale} ${d.code} ${d.message}`);
}
await writeFile("out/summary.json", JSON.stringify({ date: today, templates: summary }, null, 2));
await browser.close();
if (summary.some((s) => !s.valid)) process.exit(1);
