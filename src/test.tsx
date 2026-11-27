/**
 * The proof, run in CI:
 *   1. each of Readable's rules finds its problem, and stays quiet once it's fixed;
 *   2. every template passes every required rule in every language, with a complete plain-text part;
 *   3. each "before" email is caught, and a template that requires a rule fails closed when the plugin breaks.
 */
import { createElement, type ReactElement } from "react";
import { Button, Column, Email, Heading, Html, Image, Link, Row, Social, Table, TableCell, TableRow, Text, validate } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { readable, RULES } from "./wcag";
import { TEMPLATES } from "./templates";
import { BEFORE } from "./before";
import { audit } from "./audit";
import { ConformanceReport, reportValues } from "./templates/report";

let failed = 0;
const ok = (cond: boolean, what: string) => {
  if (!cond) failed++;
  console.log(`${cond ? "✓" : "✗"} ${what}`);
};

const mail = (...kids: ReactElement[]) =>
  createElement(Email, { lang: "en", title: "Test", previewText: "A test email that says what it is about" }, <Heading level={1}>Your order</Heading>, ...kids);
const findings = async (el: ReactElement) =>
  (await validate(el, { plugins: [readable({ kind: "transactional" })] })).diagnostics.map((d) => d.code.replace(/^email\/lint-/, ""));

/** [rule, a design with the problem, the same design fixed] */
const CASES: [string, ReactElement, ReactElement][] = [
  ["target-size",
    mail(<Button href="https://a.example/o" style={{ padding: [2, 6], fontSize: 12 }}>View order</Button>),
    mail(<Button href="https://a.example/o" style={{ padding: [12, 20] }}>View order</Button>)],
  ["target-size",
    mail(<Social icons={[{ name: "instagram", href: "https://instagram.com/a" }]} size={16} />),
    mail(<Social icons={[{ name: "instagram", href: "https://instagram.com/a" }]} size={32} />)],
  ["non-text-contrast",
    mail(<Button href="https://a.example/o" style={{ backgroundColor: "#dbeafe", color: "#1e3a8a", padding: [12, 20] }}>View order</Button>),
    mail(<Button href="https://a.example/o" style={{ backgroundColor: "#dbeafe", color: "#1e3a8a", padding: [12, 20], border: { width: 2, style: "solid", color: "#1e40af" } }}>View order</Button>)],
  ["link-distinct",
    mail(<Text>Questions? <Link href="https://a.example/help" style={{ color: "#333333", textDecoration: "none" }}>Visit our help centre</Link> any time.</Text>),
    mail(<Text>Questions? <Link href="https://a.example/help" style={{ color: "#333333" }}>Visit our help centre</Link> any time.</Text>)],
  ["headings",
    <Email lang="en" title="T" previewText="A test email that says what it is about"><Text>No headings at all.</Text></Email>,
    mail(<Text>One heading.</Text>)],
  ["headings",
    <Email lang="en" title="T" previewText="A test email that says what it is about"><Heading level={3}>Starts at three</Heading></Email>,
    mail(<Heading level={2}>Then two</Heading>)],
  ["table-header",
    mail(<Table><TableRow><TableCell>Mug</TableCell><TableCell>€12</TableCell></TableRow></Table>),
    mail(<Table><TableRow header><TableCell>Item</TableCell><TableCell>Price</TableCell></TableRow><TableRow><TableCell>Mug</TableCell><TableCell>€12</TableCell></TableRow></Table>)],
  ["reading-order",
    mail(<Row dir="rtl"><Column><Text>Read second</Text></Column><Column><Text>Read first</Text></Column></Row>),
    mail(<Row><Column><Text>Read first</Text></Column><Column><Text>Read second</Text></Column></Row>)],
  ["code-readout",
    mail(<Text>Your code is 482913</Text>),
    mail(<Text>Your code is 482 913</Text>)],
  ["emoji",
    <Email lang="en" title="T" previewText="A test email that says what it is about"><Heading level={1}>🎉 Order confirmed</Heading></Email>,
    <Email lang="en" title="T" previewText="A test email that says what it is about"><Heading level={1}>Order confirmed</Heading></Email>],
  ["all-caps",
    mail(<Text>YOUR ORDER WILL SHIP WITHIN TWO DAYS</Text>),
    mail(<Text>Your order will ship within two days</Text>)],
  ["justified",
    mail(<Text style={{ textAlign: "justify" }}>Some text.</Text>),
    mail(<Text>Some text.</Text>)],
  ["line-height",
    mail(<Text style={{ lineHeight: 1.1 }}>A paragraph long enough to wrap onto a second line in most email clients today.</Text>),
    mail(<Text style={{ lineHeight: 1.5 }}>A paragraph long enough to wrap onto a second line in most email clients today.</Text>)],
  ["centered-text",
    mail(<Text style={{ textAlign: "center" }}>{"A long paragraph that is centred, so that each of its lines starts in a different place and a reader with a magnifier has to look for the start of every line again. "}</Text>),
    mail(<Text style={{ textAlign: "center" }}>A short centred line.</Text>)],
  ["layout-table",
    mail(<Html html={'<table width="100%"><tr><td>Legacy footer</td></tr></table>'} />),
    mail(<Html html={'<table role="presentation" width="100%"><tr><td>Legacy footer</td></tr></table>'} />)],
];

console.log("1. Readable's rules");
for (const [rule, bad, good] of CASES) {
  const b = await findings(bad);
  const g = await findings(good);
  ok(b.includes(rule) && !g.includes(rule), `${rule}: finds it, and not once it's fixed`);
}
ok(new Set(CASES.map((c) => c[0])).size === RULES.length, `every one of the ${RULES.length} rules has a case`);
// No false alarms on text without capitals to be in, or a code that's grouped.
ok(!(await findings(mail(<Text>يعمل الرمز لمدة 15 دقيقة، حتى 14:30 CET.</Text>))).includes("all-caps"), "all-caps: Arabic text with a time zone isn't \"in capitals\"");
ok(!(await findings(mail(<Text>Total €1,234,567.00 on 2026-11-27</Text>))).includes("code-readout"), "code-readout: prices and dates aren't codes");

console.log("\n2. The templates");
for (const { slug, template: T } of TEMPLATES) {
  const a = await audit(T);
  ok(a.valid, `${slug}: ${a.ruleCount} required rules pass in ${a.locales.join(", ")}`);
  ok(a.parity.ok, `${slug}: the plain-text part has every link, heading and table cell${a.parity.missing.length ? ` (missing ${a.parity.missing.join("; ")})` : ""}`);
  ok(a.criteria.every((c) => c.status !== "fail"), `${slug}: no WCAG criterion fails`);
  const r = ConformanceReport.check(reportValues(a, "27 November 2026"));
  ok(r.valid, `${slug}: its conformance report fits its pages`);
}

console.log("\n3. Before, and failing closed");
for (const [slug, el] of Object.entries(BEFORE)) {
  const f = await findings(el);
  const own = new Set(f.filter((x) => RULES.some((r) => r.id === x)));
  ok(own.size >= 5, `${slug} (typical): Readable finds ${f.length} problems, from ${own.size} of its own rules`);
  const T = TEMPLATES.find((t) => t.slug === slug)!.template;
  const Wrapped = template({ id: "test.Before", version: "1.0.0", label: "Before", root: "Email", fields: {}, example: {}, rules: T.rules, render: () => el });
  ok(!Wrapped.check({}).valid, `${slug} (typical): refused under the template's rules`);
}
const broken = { ...readable(), check: () => { throw new Error("boom"); } };
const Strict = template({ id: "test.Strict", version: "1.0.0", label: "Strict", root: "Email", fields: {}, example: {}, rules: { plugins: { lint: broken }, require: { lint: ["target-size"] } }, render: () => mail(<Text>Hi</Text>) });
const s = Strict.check({});
ok(!s.valid && s.rules[0]?.status === "not-run", "a plugin that throws decides nothing: the required rule is not-run, and check() fails");

console.log(failed ? `\n${failed} failed` : "\nAll passed");
process.exit(failed ? 1 : 0);
