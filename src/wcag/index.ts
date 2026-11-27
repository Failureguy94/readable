/**
 * `readable()`: @hyper-elements/lint plus Readable's own WCAG rules, as one lint plugin.
 *
 * It runs lint and adds its rules alongside lint's, described the way lint describes its own (`rules`). So a template
 * requires them exactly as it requires lint's, and Hyper Elements decides them the same way: a required rule that
 * finds something fails the template's `check()`, and if the plugin fails to run, nothing counts as passed.
 *
 *     rules: { plugins: { lint: readable() }, require: { lint: ["contrast", "target-size", "code-readout"] } }
 */
import type { ElementsPlugin, PluginDiagnostic, PluginInput, PluginOutput } from "@hyper-elements/react";
import { lint, type LintOptions } from "@hyper-elements/lint";
import { RULES, RULE, checkTree, type Finding } from "./rules";

export { RULES, RULE } from "./rules";
export type { OwnRule, Level } from "./rules";

export const DOCS = "https://github.com/Failureguy94/readable/blob/main/docs/rules.md";

export interface ReadableOptions extends LintOptions {}

/** Every lint rule's id, and Readable's. */
export const LINT_IDS = [
  "image-alt", "alt-text", "link-text", "link-empty", "link-target", "heading-order", "heading-one", "heading-empty",
  "contrast", "text-size", "lang", "dir", "title", "preview-text", "merge-syntax", "unsubscribe", "video-title", "role-button",
] as const;
export const OWN_IDS = RULES.map((r) => r.id);

export function readable(options: ReadableOptions = {}): ElementsPlugin & { readonly rules: readonly Descriptor[] } {
  const base = lint(options);
  const setting = (id: string) => options.rules?.[id];
  const own = RULES.filter((r) => setting(r.id) !== "off");
  const severity = (id: string) => {
    const s = setting(id);
    return s === "info" || s === "warning" ? s : RULE[id]!.severity;
  };
  const descriptors: Descriptor[] = [
    ...base.rules,
    ...RULES.map((r) => ({ id: r.id, roots: ["Email", "Page"] as const, enabled: setting(r.id) !== "off", summary: r.summary, fix: r.fix })),
  ];
  const enabled = new Set(own.map((r) => r.id));

  const toDiagnostics = (root: string, found: Finding[]): PluginDiagnostic[] => {
    const prefix = root === "Page" ? "page" : root === "Email" ? "email" : null;
    if (!prefix) return [];
    return found
      .filter((f) => enabled.has(f.rule))
      .map((f) => ({
        code: `${prefix}/lint-${f.rule}`,
        severity: severity(f.rule),
        message: f.message,
        path: f.path,
        fix: RULE[f.rule]!.fix,
        see: `${DOCS}#${f.rule}`,
      }));
  };

  return {
    name: "readable-lint",
    api: 1,
    rules: descriptors,
    check(input: PluginInput) {
      return [...(base.check?.(input) ?? []), ...toDiagnostics(input.root.type, checkTree(input))];
    },
    // Readable's rules all run in check(), on the tree: a template's check() decides its required rules without
    // writing any HTML, so a rule that only read the output would never fail there. Html blocks are read in the tree.
    checkOutput(output: PluginOutput) {
      return base.checkOutput?.(output) ?? [];
    },
  };
}

interface Descriptor {
  readonly id: string;
  readonly roots: readonly ("Email" | "Page")[];
  readonly enabled: boolean;
  readonly summary: string;
  readonly fix: string;
}
