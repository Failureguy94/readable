/** Writes docs/rules.md from the rules themselves: what each diagnostic's `see` link points to. */
import { mkdir, writeFile } from "node:fs/promises";
import { RULES } from "./wcag";
import { CRITERIA } from "./criteria";

const lines = [
  "# Readable's rules",
  "",
  "`readable()` is a lint plugin for Hyper Elements: it runs `@hyper-elements/lint` and adds these rules, described the way lint describes its own, so a template requires them in `rules.require.lint`. Each finding is `email/lint-<rule>` (or `page/lint-<rule>`), with its `fix` and a link here.",
  "",
  "This file is generated from [`src/wcag/rules.ts`](../src/wcag/rules.ts) by `npm run build`.",
  "",
  "| Rule | WCAG 2.2 | Level | Severity |",
  "| --- | --- | --- | --- |",
  ...RULES.map((r) => `| [\`${r.id}\`](#${r.id}) | ${r.wcag.join(", ")} | ${r.level} | ${r.severity} |`),
  "",
];
for (const r of RULES) {
  const sc = r.wcag.map((id) => `${id} ${CRITERIA.find((c) => c.id === id)?.name ?? ""}`.trim()).join("; ");
  lines.push(`## ${r.id}`, "", `**${r.title}.** ${r.summary}`, "", `- **Why:** ${r.why}`, `- **Fix:** ${r.fix}`, `- **WCAG 2.2:** ${sc} (${r.level})`, "");
}
await mkdir("docs", { recursive: true });
await writeFile("docs/rules.md", lines.join("\n"));
console.log(`docs/rules.md: ${RULES.length} rules`);
