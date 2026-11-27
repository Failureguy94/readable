/**
 * `npm run audit [template…]`: each template checked in every language, the way its report decides it: required
 * rules, plain-text parity and the WCAG 2.2 criteria. A one-off task run from the same code as everything else
 * (twelve-factor XII). It exits 1 if any template fails, so it can gate a release.
 */
import { TEMPLATES } from "./templates";
import { audit } from "./audit";

const asked = process.argv.slice(2);
const unknown = asked.filter((s) => !TEMPLATES.some((t) => t.slug === s));
if (unknown.length) {
  console.error(`No template called ${unknown.join(", ")}. There are: ${TEMPLATES.map((t) => t.slug).join(", ")}`);
  process.exit(2);
}

let failed = 0;
for (const { slug, template } of TEMPLATES.filter((t) => !asked.length || asked.includes(t.slug))) {
  const a = await audit(template);
  const count = (s: string) => a.criteria.filter((c) => c.status === s).length;
  const ok = a.valid && a.parity.ok && count("fail") === 0;
  if (!ok) failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${slug}`);
  console.log(`      ${a.ruleCount} required rules in ${a.locales.join(", ")}: ${a.valid ? "all pass" : "some fail"}`);
  console.log(`      plain text: ${a.parity.ok ? "has every link, heading and table cell" : `missing ${a.parity.missing.length}`}`);
  console.log(`      WCAG 2.2 A and AA: ${count("pass")} pass, ${count("review")} for a person to confirm, ${count("fail")} fail`);
  for (const d of a.diagnostics.filter((d) => d.severity === "error")) console.log(`      ${d.locale} ${d.code}: ${d.message}`);
  for (const m of a.parity.missing) console.log(`      missing from the text: ${m}`);
}
process.exit(failed ? 1 : 0);
