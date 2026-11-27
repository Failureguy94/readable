/**
 * The site, built into site/dist: the page, the app bundled for the browser, every email in every language with its
 * plain text, the typical versions with what Readable finds in them, the email client emulator's previews and the
 * conformance reports. Needs no browser (Vercel builds it): the reports and PNGs come from `npm run build`.
 */
import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { render, validate } from "@hyper-elements/react";
import { renderInEmailClients } from "@hyper-elements/email-clients";
import { TEMPLATES } from "../src/templates";
import { BEFORE } from "../src/before";
import { audit } from "../src/audit";
import { readable, RULES } from "../src/wcag";
import { CRITERIA } from "../src/criteria";
import { LANGUAGE } from "../src/copy";
import { REQUIRED } from "../src/templates/shared";
import { ASSETS } from "../src/brand";
import { REPO_URL } from "../src/config";

const dist = "site/dist";
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp("site/public", dist, { recursive: true });

await build({
  entryPoints: ["site/app.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  outfile: join(dist, "app.js"),
  define: { "process.env.NODE_ENV": '"production"' },
});

// Emails point at the live site for their images: on the site itself, at its own root, so a local build works too.
const local = (html: string) => html.replaceAll(ASSETS + "/", "/");
const plugin = readable({ kind: "transactional" });

const templates = [];
let beforeTotal = 0;
for (const { slug, template } of TEMPLATES) {
  const dir = join(dist, "emails", slug);
  await mkdir(dir, { recursive: true });
  const a = await audit(template);
  if (!a.valid) throw new Error(`${slug} fails its own rules: run npm test`);
  for (const l of a.locales) {
    await writeFile(join(dir, `${l}.html`), local(a.html[l]!));
    await writeFile(join(dir, `${l}.txt`), a.text[l]!);
  }

  const before = await render(BEFORE[slug]!);
  await writeFile(join(dir, "before.html"), local(before.html));
  await writeFile(join(dir, "before.txt"), before.text);
  const found = (await validate(BEFORE[slug]!, { plugins: [plugin] })).diagnostics
    .filter((d) => d.code.includes("/lint-"))
    .map((d) => ({ rule: d.code.replace(/^email\/lint-/, ""), severity: d.severity, message: d.message, fix: d.fix }));
  beforeTotal += found.length;

  const clients = [
    { label: "Classic Outlook", file: "outlook.html" },
    { label: "Gmail", file: "gmail.html" },
    { label: "Apple Mail, dark mode", file: "apple-mail.dark.html" },
  ];
  const previews = await renderInEmailClients(a.html.en!, { emailClients: ["outlook", "gmail", "apple-mail"], dark: true });
  await mkdir(join(dist, "clients", slug), { recursive: true });
  for (const c of clients) {
    const p = previews.previews.find((x) => x.filename === c.file);
    if (!p) throw new Error(`No ${c.file} preview`);
    await writeFile(join(dist, "clients", slug, c.file), p.html);
  }

  const pdf = join("out", slug, "report.pdf");
  await access(pdf).catch(() => {
    throw new Error(`${pdf} is missing: run npm run build first (it prints the reports with Chrome)`);
  });
  await mkdir(join(dist, "reports"), { recursive: true });
  await cp(pdf, join(dist, "reports", `${slug}.pdf`));

  templates.push({
    slug,
    label: a.label,
    description: template.description ?? "",
    locales: a.locales,
    ruleCount: a.ruleCount,
    rules: a.rules,
    criteria: a.criteria.map(({ evidence, ...c }) => ({ ...c, evidence })),
    before: found,
    clients,
  });
  console.log(`${slug}: ${a.ruleCount} rules pass in ${a.locales.length} languages; typical version: ${found.length} problems`);
}

const data = {
  templates,
  own: RULES,
  lint: plugin.rules.filter((r) => !RULES.some((o) => o.id === r.id)).map((r) => ({ id: r.id, summary: r.summary, fix: r.fix })),
  criteria: CRITERIA,
  languages: LANGUAGE,
};
await writeFile(join(dist, "data.json"), JSON.stringify(data));

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const ruleRows = RULES.map(
  (r) =>
    `<tr><th scope="row"><code>${r.id}</code></th><td data-label="WCAG">${r.wcag.join(", ")} <span class="muted">${r.level}</span></td><td data-label="What it finds">${esc(r.summary)}<details><summary>Why it matters</summary><p>${esc(r.why)}</p></details></td></tr>`,
).join("");
const reportLinks = templates.map((t) => `<li><a href="/reports/${t.slug}.pdf"><b>${esc(t.label)}</b><span>${t.ruleCount} rules · ${t.criteria.length} criteria</span></a></li>`).join("");

let html = await readFile("site/index.html", "utf8");
const values: Record<string, string> = {
  TEMPLATES: String(TEMPLATES.length),
  LOCALES: String(Object.keys(LANGUAGE).length),
  REQUIRED: String(templates[0]!.ruleCount),
  REQUIRED_LINT: String(REQUIRED.length),
  OWN: String(RULES.length),
  LINT: String(data.lint.length),
  REPO_URL: esc(REPO_URL),
  BEFORE: String(beforeTotal),
  RULE_ROWS: ruleRows,
  REPORT_LINKS: reportLinks,
};
html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => {
  if (!(k in values)) throw new Error(`No value for {{${k}}}`);
  return values[k]!;
});
await writeFile(join(dist, "index.html"), html);
await writeFile(
  join(dist, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#ff5a5f"/><path d="M8 11h16M8 16h16M8 21h10" stroke="#2a0e10" stroke-width="2.6" stroke-linecap="round"/></svg>`,
);
console.log(`site/dist: ${templates.length} templates, ${beforeTotal} problems in the typical versions`);
