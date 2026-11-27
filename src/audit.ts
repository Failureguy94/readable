/**
 * One template, audited: its `check()` in every language, the HTML and plain text it renders, the plain-text part
 * compared with the HTML, and each WCAG criterion decided from the required rules' results. Runs in Node and in the
 * browser alike (the site calls it as you edit).
 */
import { render } from "@hyper-elements/react";
import type { Template, RuleResult } from "@hyper-elements/react/template";
import { CRITERIA, PRACTICES, type Criterion } from "./criteria";
import { LOCALES, type Locale } from "./copy";

const decode = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/\s+/g, " ")
    .trim();

/**
 * What a reader of the plain-text part would miss: every link's address, every heading and every table cell of the
 * HTML must be in the text. (Mail apps show the text to people who turn HTML off, and some screen reader setups read it.)
 */
export function parity(html: string, text: string) {
  const body = html.replace(/<head[\s\S]*?<\/head>/i, "").replace(/<!--[\s\S]*?-->/g, "");
  const flat = text.replace(/\s+/g, " ").toLowerCase();
  // The text part writes a link as its words then its address in brackets: words are compared without the address.
  const words = flat.replace(/ \((?:https?|mailto|tel):[^)]*\)/g, "");
  const missing: string[] = [];
  const need = (what: string, kind: string, inside = words) => {
    if (/[\p{L}\p{N}]/u.test(what) && !inside.includes(what.toLowerCase())) missing.push(`${kind}: ${what}`);
  };
  for (const m of body.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) need(decode(m[1]!).replace(/^mailto:/, ""), "Link", flat);
  for (const m of body.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)) need(decode(m[1]!), "Heading");
  for (const m of body.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)) if (!/<table/i.test(m[1]!)) need(decode(m[1]!), "Table cell");
  return { ok: missing.length === 0, missing: [...new Set(missing)] };
}

export type Status = "pass" | "fail" | "review";

export interface CriterionResult extends Criterion {
  status: Status;
  /** The required rules that decide it, and how each ended (in every language checked). */
  evidence: { rule: string; status: RuleResult["status"] }[];
}

/** Decide each criterion from rule results: failed if any of its rules failed in any language. */
export function decide(results: RuleResult[][], parityOk = true): { criteria: CriterionResult[]; practices: { rule: string; name: string; status: Status }[] } {
  const statusOf = (rule: string): RuleResult["status"] | undefined => {
    const all = results.flatMap((r) => r.filter((x) => x.rule === rule));
    if (!all.length) return undefined;
    if (all.some((x) => x.status === "failed")) return "failed";
    if (all.some((x) => x.status === "not-run")) return "not-run";
    return "passed";
  };
  const criteria = CRITERIA.map((c) => {
    const evidence = c.rules.map((rule) => ({ rule, status: statusOf(rule) ?? ("not-run" as const) }));
    const failed = evidence.some((e) => e.status !== "passed") || (c.id === "1.3.2" && !parityOk);
    const status: Status = failed ? "fail" : c.review ? "review" : "pass";
    return { ...c, status, evidence };
  });
  const practices = PRACTICES.map((p) => ({
    ...p,
    status: (p.rule === "parity" ? parityOk : statusOf(p.rule) === "passed") ? ("pass" as const) : ("fail" as const),
  }));
  return { criteria, practices };
}

export interface Audit {
  id: string;
  version: string;
  label: string;
  locales: Locale[];
  valid: boolean;
  rules: { rule: string; source: string; status: RuleResult["status"] }[];
  ruleCount: number;
  html: Record<string, string>;
  text: Record<string, string>;
  parity: { ok: boolean; missing: string[] };
  criteria: CriterionResult[];
  practices: { rule: string; name: string; status: Status }[];
  review: { field?: string; template?: string; guidance: string }[];
  diagnostics: { code: string; severity: string; message: string; path: string; locale: string }[];
}

/** Check and render a template in each language, and decide every criterion. */
export async function audit(template: Template<any, any>, values: Record<string, unknown> = template.example as Record<string, unknown>, locales: readonly Locale[] = LOCALES): Promise<Audit> {
  const results: RuleResult[][] = [];
  const html: Record<string, string> = {};
  const text: Record<string, string> = {};
  const missing: string[] = [];
  const diagnostics: Audit["diagnostics"] = [];
  let valid = true;
  let review: Audit["review"] = [];
  for (const locale of locales) {
    const c = template.check({ ...values, locale });
    results.push(c.rules);
    review = c.review;
    valid &&= c.valid;
    diagnostics.push(...c.diagnostics.filter((d) => d.severity !== "info" || d.code.includes("/lint-")).map((d) => ({ code: d.code, severity: d.severity, message: d.message, path: d.path, locale })));
    const snap = c.snapshots.default;
    if (!snap) continue;
    const r = await render(snap as never);
    html[locale] = r.html;
    text[locale] = r.text;
    missing.push(...parity(r.html, r.text).missing.map((m) => `${locale}: ${m}`));
  }
  const p = { ok: missing.length === 0, missing };
  const merged = new Map<string, { rule: string; source: string; status: RuleResult["status"] }>();
  for (const r of results.flat()) {
    const prev = merged.get(r.rule);
    const status = prev?.status === "failed" || r.status === "failed" ? "failed" : prev?.status === "not-run" || r.status === "not-run" ? "not-run" : "passed";
    merged.set(r.rule, { rule: r.rule, source: r.source, status });
  }
  const { criteria, practices } = decide(results, p.ok);
  return {
    id: template.id,
    version: template.version,
    label: template.label,
    locales: [...locales],
    valid: valid && p.ok,
    rules: [...merged.values()],
    ruleCount: merged.size,
    html,
    text,
    parity: p,
    criteria,
    practices,
    review,
    diagnostics,
  };
}
