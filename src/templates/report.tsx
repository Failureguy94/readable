/**
 * The accessibility conformance report: one A4 document per email template, made from its audit. What was checked
 * automatically and passed, what Hyper Elements' output guarantees, and what a person still has to look at, each
 * against its WCAG 2.2 criterion. For whoever has to show that the shop's emails meet the European Accessibility Act.
 */
import { Column, Document, Heading, PageBreak, PageFooter, PageNumber, Row, Table, TableCell, TableRow, Text, defineTheme, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Audit } from "../audit";
import { LANGUAGE } from "../copy";

const theme = defineTheme({
  colors: { foreground: "#1b1f23", muted: "#4b5563", border: "#d4dbd8", surface: "#f3f5f4", primary: "#1d5c47" },
  fonts: { body: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  spacing: { xs: 4, sm: 8, md: 14, lg: 22 },
  elements: { Heading: { fontWeight: 700, by: { level: { 1: { fontSize: 22 }, 2: { fontSize: 14 } } } } },
});

const STATUS = { pass: "Passes", review: "Passes the checks; a person confirms", fail: "Fails" } as const;
const RULE_STATUS = { passed: "passed", failed: "FAILED", "not-run": "not run" } as const;

export const ConformanceReport = template({
  id: "readable.ConformanceReport",
  version: "1.0.0",
  label: "Accessibility conformance report",
  description: "An A4 report of a template's audit against WCAG 2.2 level AA",
  root: "Document",
  fields: {
    template: prop.text({ label: "Template", required: true }),
    templateId: prop.text({ label: "Template id and version", required: true }),
    date: prop.text({ label: "Date checked", required: true }),
    languages: prop.text({ label: "Languages checked", required: true }),
    verdict: prop.text({ label: "Verdict", required: true }),
    criteria: prop.list(
      prop.object({
        id: prop.text({ label: "Criterion", required: true }),
        name: prop.text({ label: "Name", required: true }),
        level: prop.text({ label: "Level", required: true }),
        status: prop.choice(["pass", "review", "fail"], { label: "Status", default: "pass" }),
        how: prop.text({ label: "How it's checked", required: true }),
      }, { label: "Criterion" }),
      { label: "WCAG criteria", required: true, min: 1, max: 40 },
    ),
    practices: prop.list(prop.object({ name: prop.text({ label: "Practice", required: true }), status: prop.choice(["pass", "review", "fail"], { label: "Status", default: "pass" }) }, { label: "Practice" }), { label: "Best practices", min: 0, max: 20 }),
    review: prop.list(prop.text({ label: "Item", required: true }), { label: "For a person to confirm", min: 0, max: 30 }),
    rules: prop.list(prop.text({ label: "Rule", required: true }), { label: "Required rules", min: 0, max: 60 }),
  },
  // A page that's too full is cut off in a PDF: required, so a report that doesn't fit fails instead.
  rules: { require: { core: ["layout/overflow", "document/overflow"] } },
  example: {
    template: "Order confirmation",
    templateId: "readable.OrderConfirmation 1.0.0",
    date: "27 November 2026",
    languages: "English, Deutsch, Français, العربية",
    verdict: "Every automated check passes in every language.",
    criteria: [{ id: "1.4.3", name: "Contrast (minimum)", level: "AA", status: "pass", how: "Required rule: contrast" }],
    practices: [],
    review: [],
    rules: ["contrast: passed"],
  },
  render: (v) => {
    const cell = { fontSize: 9.5, color: token("colors.foreground") } as const;
    const head = { fontSize: 9, color: token("colors.muted") } as const;
    return (
      <Document size="A4" margin={44} title={`Accessibility conformance report: ${v.template}`} lang="en" theme={theme} style={{ fontSize: 10.5, lineHeight: 1.45, gap: token("spacing.lg"), color: token("colors.foreground") }}>
        <Column style={{ height: 5, backgroundColor: token("colors.primary") }} />
        <Column style={{ gap: token("spacing.xs") }}>
          <Text style={{ fontSize: 9.5, color: token("colors.muted"), fontWeight: 700 }}>Readable · Accessibility conformance report</Text>
          <Heading level={1} field="template">{v.template} email</Heading>
          <Text style={{ fontSize: 12 }} field="verdict">{v.verdict}</Text>
        </Column>

        <Row style={{ gap: token("spacing.md") }}>
          {[["Template", v.templateId], ["Checked", v.date], ["Languages", v.languages], ["Standard", "WCAG 2.2 level AA (EN 301 549 asks 2.1 AA)"]].map(([k, val]) => (
            <Column key={k} style={{ gap: 2 }}>
              <Text style={head}>{k}</Text>
              <Text style={{ fontSize: 10, fontWeight: 700 }}>{val}</Text>
            </Column>
          ))}
        </Row>

        <Column style={{ gap: token("spacing.sm") }}>
          <Heading level={2}>WCAG 2.2 success criteria</Heading>
          <Table style={{ cellPadding: [4, 4], rowBorder: { width: 1, style: "solid", color: token("colors.border") } }}>
            <TableRow header>
              <TableCell style={{ ...head, width: "9%" }}>Criterion</TableCell>
              <TableCell style={{ ...head, width: "22%" }}>Name</TableCell>
              <TableCell style={{ ...head, width: "7%" }}>Level</TableCell>
              <TableCell style={{ ...head, width: "20%" }}>Result</TableCell>
              <TableCell style={{ ...head, width: "42%" }}>How it's checked</TableCell>
            </TableRow>
            {v.criteria.map((c, i) => (
              <TableRow key={i}>
                <TableCell style={{ ...cell, fontWeight: 700 }}>{c.id}</TableCell>
                <TableCell style={cell}>{c.name}</TableCell>
                <TableCell style={cell}>{c.level}</TableCell>
                <TableCell style={{ ...cell, fontWeight: c.status === "fail" ? 700 : 400 }}>{STATUS[c.status]}</TableCell>
                <TableCell style={{ ...cell, fontSize: 8.5, lineHeight: 1.4 }}>{c.how}</TableCell>
              </TableRow>
            ))}
          </Table>
        </Column>

        <PageBreak />

        {v.practices.length > 0 && (
          <Column style={{ gap: token("spacing.sm") }}>
            <Heading level={2}>Beyond the criteria</Heading>
            <Table style={{ cellPadding: [4, 4], rowBorder: { width: 1, style: "solid", color: token("colors.border") } }}>
              <TableRow header>
                <TableCell style={{ ...head, width: "70%" }}>Practice</TableCell>
                <TableCell style={{ ...head, width: "30%" }}>Result</TableCell>
              </TableRow>
              {v.practices.map((p, i) => (
                <TableRow key={i}>
                  <TableCell style={cell}>{p.name}</TableCell>
                  <TableCell style={cell}>{STATUS[p.status]}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Column>
        )}

        {v.review.length > 0 && (
          <Column style={{ gap: token("spacing.xs") }}>
            <Heading level={2}>For a person to confirm</Heading>
            <Text style={{ fontSize: 9.5, color: token("colors.muted") }}>No automated check can decide these. Readable's templates are designed to meet them; confirm when you change the words or images.</Text>
            {v.review.map((r, i) => (
              <Text key={i} style={{ fontSize: 9.5 }}>{`${i + 1}. ${r}`}</Text>
            ))}
          </Column>
        )}

        <Column style={{ gap: token("spacing.xs") }}>
          <Heading level={2}>Required rules, as decided by the template's check()</Heading>
          <Text style={{ fontSize: 8.5, color: token("colors.muted"), lineHeight: 1.6 }}>{v.rules.join("  ·  ")}</Text>
        </Column>

        <PageFooter>
          <Row>
            <Column><Text style={{ fontSize: 8.5, color: token("colors.muted") }}>Generated by Readable with Hyper Elements. Automated checks find most barriers, not all: this report says which ones a person checks.</Text></Column>
            <Column style={{ width: 60 }}><Text style={{ fontSize: 8.5, color: token("colors.muted"), textAlign: "right" }}>Page <PageNumber /></Text></Column>
          </Row>
        </PageFooter>
      </Document>
    );
  },
});

/** The report's values, from an audit. */
export function reportValues(a: Audit, date: string) {
  const fails = a.criteria.filter((c) => c.status === "fail").length;
  const reviews = a.criteria.filter((c) => c.status === "review").length;
  const how = (c: Audit["criteria"][number]) =>
    [
      c.evidence.length ? `Required rules: ${c.evidence.map((e) => `${e.rule} (${RULE_STATUS[e.status]})`).join(", ")}.` : "",
      c.output ? `Output: ${c.output}` : "",
      c.design ? `By design: ${c.design}` : "",
      c.review ? `Review: ${c.review}` : "",
    ].filter(Boolean).join(" ");
  return {
    template: a.label,
    templateId: `${a.id} ${a.version}`,
    date,
    languages: a.locales.map((l) => LANGUAGE[l]).join(", "),
    verdict: fails
      ? `${fails} criteria fail. See the rules marked FAILED.`
      : `All ${a.ruleCount} required rules pass in all ${a.locales.length} languages. ${a.criteria.length - reviews} of ${a.criteria.length} criteria are decided by those rules alone; ${reviews} also need a person to confirm the words and images.`,
    criteria: a.criteria.map((c) => ({ id: c.id, name: c.name, level: c.level, status: c.status, how: how(c) })),
    practices: a.practices.map((p) => ({ name: p.name, status: p.status })),
    review: [...a.criteria.filter((c) => c.review).map((c) => `${c.id} ${c.name}: ${c.review}`), ...a.review.map((r) => (r.field ? `${r.field}: ${r.guidance}` : r.guidance))],
    rules: a.rules.map((r) => `${r.rule}: ${RULE_STATUS[r.status]}`),
  };
}
