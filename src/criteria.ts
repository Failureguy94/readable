/**
 * WCAG 2.2 success criteria that apply to an email, and how each is covered: by required rules (lint's and
 * Readable's), by what Hyper Elements writes, or by a person. The conformance report is this list, decided against a
 * template's `check()` results. EN 301 549, the standard the European Accessibility Act points to, requires WCAG 2.1
 * level AA; 2.2 adds 2.5.8 (target size), checked here too.
 */
export type Coverage = "rules" | "output" | "review";

export interface Criterion {
  id: string;
  name: string;
  level: "A" | "AA";
  /** Required rules that decide it. */
  rules: string[];
  /** What Hyper Elements writes that meets it, where it's met by construction. */
  output?: string;
  /** What a person checks, where no rule can. */
  review?: string;
  /** How Readable's templates meet it by design. */
  design?: string;
}

export const CRITERIA: Criterion[] = [
  { id: "1.1.1", name: "Non-text content", level: "A", rules: ["image-alt", "alt-text", "emoji"], review: "Each image's alternate text says what it shows, or it's marked decorative.", design: "The only image is the logo, its alt the shop's name." },
  { id: "1.3.1", name: "Info and relationships", level: "A", rules: ["heading-order", "heading-one", "heading-empty", "headings", "table-header", "layout-table"], output: "Layout tables carry role=\"presentation\"; a header row is written as <th scope=\"col\">; lists are <ol> and <ul>." },
  { id: "1.3.2", name: "Meaningful sequence", level: "A", rules: ["reading-order"], output: "Columns stack on phones in source order, the order a screen reader reads; the plain-text part keeps it too (checked: plain-text parity)." },
  { id: "1.3.3", name: "Sensory characteristics", level: "A", rules: [], review: "No instruction depends on shape, colour, size or position (\"press the green button\").", design: "Instructions name what to press by its words." },
  { id: "1.4.1", name: "Use of colour", level: "A", rules: ["link-distinct"], review: "No status or warning is shown by colour alone.", design: "Delivery progress is a numbered list in words; the sign-in warning is a heading, not a red banner." },
  { id: "1.4.3", name: "Contrast (minimum)", level: "AA", rules: ["contrast"] },
  { id: "1.4.4", name: "Resize text", level: "AA", rules: ["text-size", "layout/overflow"], review: "At 200% zoom nothing is cut off (see the site's zoom view).", output: "Sizes in px, which every email client scales with its zoom." },
  { id: "1.4.5", name: "Images of text", level: "AA", rules: [], review: "No text is in an image, except the logo.", design: "Every word is text." },
  { id: "1.4.10", name: "Reflow", level: "AA", rules: ["layout/overflow"], output: "Columns stack on phones; nothing is wider than the screen at 320 px." },
  { id: "1.4.11", name: "Non-text contrast", level: "AA", rules: ["non-text-contrast"] },
  { id: "1.4.12", name: "Text spacing", level: "AA", rules: ["line-height"], output: "No fixed heights on text: it can grow when a reader spaces it out." },
  { id: "2.2.1", name: "Timing adjustable", level: "A", rules: [], review: "Anything that runs out says when, and how to get a new one.", design: "The reset code says how many minutes, until what time, and where to ask for a new one." },
  { id: "2.4.2", name: "Page titled", level: "A", rules: ["root"], output: "The template requires the Email's title (rules.root)." },
  { id: "2.4.4", name: "Link purpose (in context)", level: "A", rules: ["link-text", "link-empty", "link-target", "links"] },
  { id: "2.4.6", name: "Headings and labels", level: "AA", rules: ["headings", "heading-empty", "emoji"], review: "Headings and labels say what follows them." },
  { id: "2.5.8", name: "Target size (minimum)", level: "AA", rules: ["target-size"] },
  { id: "3.1.1", name: "Language of page", level: "A", rules: ["lang", "dir", "root"] },
  { id: "3.1.2", name: "Language of parts", level: "AA", rules: [], review: "A passage in another language than the email's is marked with its own.", design: "Every fixed word is in the customer's language; only names and addresses come as given." },
  { id: "4.1.2", name: "Name, role, value", level: "A", rules: ["role-button", "link-empty"], output: "Buttons and links are <a> elements with their words as their name." },
];

/** Readable's checks beyond WCAG's criteria: what makes an email easier, not only allowed. */
export const PRACTICES = [
  { rule: "code-readout", name: "Codes read as digits" },
  { rule: "all-caps", name: "No long text in capitals" },
  { rule: "justified", name: "No justified text" },
  { rule: "centered-text", name: "No long centred paragraphs" },
  { rule: "preview-text", name: "A preview text that says what the email is" },
  { rule: "merge-syntax", name: "No raw merge tags" },
  { rule: "parity", name: "The plain-text part says everything the HTML does" },
];
