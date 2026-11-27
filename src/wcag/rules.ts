/**
 * Readable's own rules: what makes an email hard to use with a screen reader, a magnifier, a phone or tired eyes that
 * @hyper-elements/lint doesn't already check. Each runs on the laid-out tree Hyper Elements hands a plugin (or, for
 * `layout-table`, on the HTML it wrote), and names the WCAG 2.2 success criterion it's about.
 */
import type { PluginInput, PluginNode, PluginOutput } from "@hyper-elements/react";
import { contrast, ratio } from "./color";

export type Level = "A" | "AA" | "AAA" | "Best practice";

export interface OwnRule {
  id: string;
  severity: "warning" | "info";
  /** WCAG 2.2 success criteria it checks, or helps with. */
  wcag: string[];
  level: Level;
  title: string;
  summary: string;
  fix: string;
  /** Why it matters, in one or two sentences, for the docs and the report. */
  why: string;
}

export interface Finding {
  rule: string;
  path: string;
  message: string;
}

export const RULES: readonly OwnRule[] = [
  {
    id: "target-size",
    severity: "warning",
    wcag: ["2.5.8"],
    level: "AA",
    title: "Buttons big enough to tap",
    summary: "A button (or a social icon) is smaller than 24×24 px, too small to tap reliably with a finger or a tremor.",
    fix: "Give the button padding so it's at least 24 px tall and wide; 44 px is better on phones.",
    why: "People with tremors, limited dexterity or large fingers miss small targets, and most transactional emails are opened on a phone.",
  },
  {
    id: "non-text-contrast",
    severity: "warning",
    wcag: ["1.4.11"],
    level: "AA",
    title: "Buttons you can see",
    summary: "A button's background is under 3:1 against what's behind it and it has no border that is, so its edge disappears.",
    fix: "Darken the button's background, or give it a border at least 3:1 against the background.",
    why: "A pale button on a white card looks like plain text to someone with low vision: they don't know there's something to press.",
  },
  {
    id: "link-distinct",
    severity: "warning",
    wcag: ["1.4.1"],
    level: "A",
    title: "Links that don't rely on colour",
    summary: "A link inside a sentence isn't underlined and its colour is under 3:1 against the text around it.",
    fix: "Underline links in running text (the default), or make the colour difference at least 3:1.",
    why: "Someone who can't tell the link's colour from the text's (one man in twelve has a colour vision deficiency) can't find it.",
  },
  {
    id: "headings",
    severity: "warning",
    wcag: ["1.3.1", "2.4.6"],
    level: "AA",
    title: "Headings to navigate by",
    summary: "The email has no heading, or its first heading isn't level 1.",
    fix: "Start with one level-1 Heading saying what the email is about, and use Headings for its sections.",
    why: "Screen reader users jump from heading to heading to find what they need. With none, they have to listen to everything in order.",
  },
  {
    id: "table-header",
    severity: "warning",
    wcag: ["1.3.1"],
    level: "A",
    title: "Tables with headers",
    summary: "A data table has no header row, so a screen reader can't say which column a value is in.",
    fix: "Make the first TableRow a header (`<TableRow header>`): Hyper Elements writes it as <th scope=\"col\">.",
    why: "\"12, 2, 24\" means nothing read aloud. \"Price 12, Quantity 2, Total 24\" does, and that's what a header row gives.",
  },
  {
    id: "reading-order",
    severity: "warning",
    wcag: ["1.3.2"],
    level: "A",
    title: "Reading order that matches the layout",
    summary: "A Row's direction is reversed to swap its columns on screen, so a screen reader reads them in the other order.",
    fix: "Put the columns in the order they should be read and drop the Row's dir; Hyper Elements stacks them in that order on phones.",
    why: "The dir=\"rtl\" trick puts the image first on desktop and the text first in the code: the screen reader and the phone get a different email from the desktop.",
  },
  {
    id: "code-readout",
    severity: "warning",
    wcag: ["1.3.1"],
    level: "Best practice",
    title: "Codes read as digits",
    summary: "Six or more digits in a row: a screen reader reads 482913 as \"four hundred eighty-two thousand, nine hundred thirteen\".",
    fix: "Group the digits with spaces (482 913) so they're read one by one, and the reader can keep their place.",
    why: "Sign-in codes, tracking and order numbers are typed in elsewhere. Read as one big number, they have to be listened to again and again.",
  },
  {
    id: "emoji",
    severity: "warning",
    wcag: ["1.1.1", "2.4.6"],
    level: "Best practice",
    title: "No emoji in headings, buttons and links",
    summary: "An emoji in a heading, button or link: a screen reader reads its full name (🎉 \"party popper\") as part of it.",
    fix: "Leave emoji out of headings, buttons and links, and use few in text.",
    why: "\"Party popper, party popper, your order is confirmed, party popper\" is what a screen reader user hears, and it's in every list of headings and links.",
  },
  {
    id: "all-caps",
    severity: "info",
    wcag: ["1.4.8"],
    level: "Best practice",
    title: "No long text in capitals",
    summary: "A long run of text is in capitals, which is slower to read, and some screen readers spell words in capitals letter by letter.",
    fix: "Write it in sentence case, and use weight or size for emphasis.",
    why: "Words in capitals lose their shape, which readers with dyslexia and low vision rely on.",
  },
  {
    id: "justified",
    severity: "warning",
    wcag: ["1.4.8"],
    level: "AAA",
    title: "No justified text",
    summary: "Text is justified, which leaves uneven gaps between words.",
    fix: "Align text to the start (left, or right in a right-to-left language).",
    why: "The \"rivers\" of white space in justified text make lines hard to follow, above all for readers with dyslexia.",
  },
  {
    id: "line-height",
    severity: "warning",
    wcag: ["1.4.8", "1.4.12"],
    level: "AAA",
    title: "Room between lines",
    summary: "A paragraph's line height is under 1.4 times its font size.",
    fix: "Set lineHeight to 1.5 for body text.",
    why: "Cramped lines are hard to track from the end of one to the start of the next, for readers with low vision or dyslexia.",
  },
  {
    id: "centered-text",
    severity: "info",
    wcag: ["1.4.8"],
    level: "Best practice",
    title: "No long centred paragraphs",
    summary: "A long paragraph is centred, so every line starts in a different place.",
    fix: "Centre a short line, if anything; align paragraphs to the start.",
    why: "With a magnifier, a reader has to hunt for the start of each centred line.",
  },
  {
    id: "layout-table",
    severity: "warning",
    wcag: ["1.3.1"],
    level: "A",
    title: "Layout tables hidden from screen readers",
    summary: "A table in the HTML has no header cells and no role=\"presentation\", so a screen reader announces a layout as a data table.",
    fix: "Use Rows and Columns (Hyper Elements marks their tables role=\"presentation\"), or add the role to the table in an Html block.",
    why: "\"Table, 3 columns, 1 row\" before every section is noise a screen reader user has to sit through.",
  },
];

export const RULE = Object.fromEntries(RULES.map((r) => [r.id, r])) as Record<string, OwnRule>;

// ---------------------------------------------------------------------------------------------------------------
// Reading the laid-out tree

type Kid = PluginNode | string;
const isNode = (c: Kid): c is PluginNode => typeof c !== "string";

const ownText = (n: PluginNode) => n.children.filter((c): c is string => typeof c === "string").join("");
const allText = (n: PluginNode): string => n.children.map((c) => (typeof c === "string" ? c : allText(c))).join("");

const TEXT_HOLDERS = new Set(["Text", "Heading", "Span", "Link", "Button", "ListItem", "TableCell"]);
const BODY = new Set(["Text", "ListItem", "TableCell"]);

const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const insets = (v: unknown) => {
  if (typeof v === "number") return { top: v, right: v, bottom: v, left: v };
  const o = (v ?? {}) as Record<string, unknown>;
  return { top: num(o.top), right: num(o.right), bottom: num(o.bottom), left: num(o.left) };
};
/** A border as Hyper Elements resolves it, one per side: the thinnest side, the one that decides if the edge shows. */
const border = (v: unknown): { width: number; color?: string } => {
  const o = (v ?? {}) as Record<string, unknown>;
  const sides = ["top", "right", "bottom", "left"].map((k) => o[k]).filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  const all = sides.length === 4 ? sides : [o];
  const thinnest = all.reduce((a, b) => (num(b.width) < num(a.width) ? b : a));
  return { width: sides.length && sides.length < 4 ? 0 : num(thinnest.width), color: typeof thinnest.color === "string" ? thinnest.color : undefined };
};

const PICTO = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/gu;
const EMOJI_NAMES: Record<string, string> = {
  "🎉": "party popper", "🚚": "delivery truck", "📦": "package", "✅": "check mark button", "🔒": "locked",
  "👉": "backhand index pointing right", "🔥": "fire", "⚠": "warning", "❤": "red heart", "✨": "sparkles",
  "🛒": "shopping cart", "🔑": "key", "⏰": "alarm clock", "👋": "waving hand", "🙌": "raising hands",
  "💳": "credit card", "📍": "round pushpin", "🚨": "police car light", "😊": "smiling face with smiling eyes",
  "🎁": "wrapped gift", "💚": "green heart", "⭐": "star", "🛍": "shopping bags", "👍": "thumbs up", "📧": "e-mail", "🏷": "label",
};
export const emojiName = (e: string) => EMOJI_NAMES[e.replace(/️/g, "")] ?? "its full name";

/** A text as a screen reader says it: each emoji by its name. */
export const spoken = (text: string) =>
  text.replace(PICTO, (e) => ` ${emojiName(e)}, `).replace(/\uFE0F/g, "").replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").replace(/,\s*$/, "").trim();

const LONG_DIGITS = /(?<![\d.,:/-])\d{6,}(?![\d.,:/-])/;

/** The checks over the laid-out tree. */
export function checkTree(input: PluginInput): Finding[] {
  const out: Finding[] = [];
  const root = input.root;
  const rootDir = root.props.dir === "rtl" ? "rtl" : "ltr";
  let headings = 0;
  let firstHeading: PluginNode | undefined;
  const socials = new Set<string>();

  const visit = (n: PluginNode, parents: PluginNode[]) => {
    const parent = parents[parents.length - 1];
    const at = input.templatePath(n.path);
    if (input.builtIn(at)) {
      // Inside a built-in's expansion (a Menu's separators): its parts are the built-in's, not the author's. A Social
      // is its icons, each a link holding an image: their size is the tap target, reported once, on the Social's row.
      const social = /^(.*)\(Social\)/.exec(at);
      if (social && n.type === "Image" && num(n.style.width, 99) < 24 && !socials.has(social[1]!)) {
        socials.add(social[1]!);
        const row = parents.findLast((p) => !input.builtIn(input.templatePath(p.path))) ?? parent!;
        out.push({ rule: "target-size", path: row.path, message: `These social icons are ${num(n.style.width)} px: a tap target needs at least 24×24 px` });
      }
      n.children.forEach((c) => isNode(c) && visit(c, [...parents, n]));
      return;
    }
    const own = ownText(n);
    const text = TEXT_HOLDERS.has(n.type) ? allText(n).trim() : "";

    if (n.type === "Heading") {
      headings++;
      firstHeading ??= n;
    }

    if (n.type === "Button") {
      const pad = insets(n.style.padding);
      const b = border(n.style.border);
      const h = n.text.lineHeightPx + pad.top + pad.bottom + 2 * b.width;
      const w = typeof n.style.width === "number" ? n.style.width : text.length * n.text.fontSize * 0.5 + pad.left + pad.right + 2 * b.width;
      if (h < 24 || w < 24)
        out.push({ rule: "target-size", path: n.path, message: `This button is about ${Math.round(w)}×${Math.round(h)} px: a tap target needs at least 24×24 px, and 44 px tall is better on a phone` });

      const bg = backgroundOf(parents);
      const own = n.style.backgroundColor;
      const c = contrast(own, bg);
      const edge = b.width > 0 ? contrast(b.color, bg) : null;
      if (c !== null && c < 3 && (edge === null || edge < 3))
        out.push({ rule: "non-text-contrast", path: n.path, message: `This button's background (${own}) is ${ratio(c)} against what's behind it (${bg}): its edge needs 3:1, or a border that is` });
    }

    if (n.type === "Link" && parent && TEXT_HOLDERS.has(parent.type) && parent.type !== "Link" && parent.type !== "Button") {
      const around = parent.children.some((c) => typeof c === "string" && c.trim().length > 0);
      const underlined = String(n.style.textDecoration ?? "").includes("underline");
      const c = contrast(n.text.color, parent.text.color);
      if (around && !underlined && c !== null && c < 3)
        out.push({ rule: "link-distinct", path: n.path, message: `This link isn't underlined and its colour is ${ratio(c)} against the text around it: someone who can't see the difference can't find it` });
    }

    if ((n.type === "Heading" || n.type === "Button" || n.type === "Link") && text) {
      const found = text.match(PICTO);
      if (found) {
        const kind = n.type === "Heading" ? "heading" : n.type === "Button" ? "button" : "link";
        out.push({ rule: "emoji", path: n.path, message: `A screen reader reads this ${kind} as "${spoken(text)}"` });
      }
    } else if (own && (own.match(PICTO)?.length ?? 0) >= 3) {
      out.push({ rule: "emoji", path: n.path, message: `This text has ${own.match(PICTO)!.length} emoji, each read out by its full name` });
    }

    if (own) {
      const digits = LONG_DIGITS.exec(own);
      if (digits)
        out.push({ rule: "code-readout", path: n.path, message: `"${digits[0]}" is read as one number, not as digits: write it as "${group(digits[0])}"` });

      // Only letters that have a case count: Arabic, Hebrew, Hindi or Japanese have no capitals to be in.
      const cased = own.replace(/[^\p{Lu}\p{Ll}]/gu, "");
      const caps = n.text.textTransform === "uppercase" ? cased : cased.replace(/\p{Ll}/gu, "").length === cased.length ? cased : "";
      if (caps.length >= 20)
        out.push({ rule: "all-caps", path: n.path, message: `${caps.length} letters in capitals: write it in sentence case` });

      if (n.text.textAlign === "justify" && parent?.text.textAlign !== "justify")
        out.push({ rule: "justified", path: n.path, message: "This text is justified: align it to the start" });
    }

    if (BODY.has(n.type) && text.length > 60) {
      const lh = n.text.lineHeightPx / n.text.fontSize;
      if (lh < 1.4)
        out.push({ rule: "line-height", path: n.path, message: `Its line height is ${lh.toFixed(2)} times the font size: make it 1.5` });
      if (n.text.textAlign === "center" && text.length > 150)
        out.push({ rule: "centered-text", path: n.path, message: `A ${text.length}-character paragraph is centred: align it to the start` });
    }

    if (n.type === "Table") {
      const rows = n.children.filter(isNode).filter((c) => c.type === "TableRow");
      if (rows.length && !rows.some((r) => r.props.header === true))
        out.push({ rule: "table-header", path: n.path, message: `This table's ${rows.length} rows have no header: a screen reader can't say what each column is` });
    }

    if (n.type === "Html" && typeof n.props.html === "string")
      for (const f of checkHtml(n.props.html)) out.push({ ...f, path: n.path, message: f.message.replace("in the HTML", "in this Html block") });

    if (n.type === "Row" && typeof n.props.dir === "string" && n.props.dir !== rootDir && !/[֐-ࣿ]/.test(allText(n)))
      out.push({ rule: "reading-order", path: n.path, message: `This Row is dir="${n.props.dir}" in a ${rootDir} email: its columns are read in the opposite order to how they're shown` });

    n.children.forEach((c) => isNode(c) && visit(c, [...parents, n]));
  };
  visit(root, []);

  if (headings === 0) out.push({ rule: "headings", path: root.path, message: "The email has no headings: a screen reader user can't jump to what matters" });
  else if (firstHeading && firstHeading.props.level !== 1)
    out.push({ rule: "headings", path: firstHeading.path, message: `The first heading is level ${firstHeading.props.level}: start with one level-1 heading` });
  return out;
}

const backgroundOf = (parents: PluginNode[]) => {
  for (let i = parents.length - 1; i >= 0; i--) {
    const bg = parents[i]!.style.backgroundColor;
    if (typeof bg === "string" && bg !== "transparent") return bg;
  }
  return "#ffffff";
};

/** 482913 → "482 913", 1Z99912345 → groups of four from the start. */
export const group = (digits: string) => (digits.length % 3 === 0 ? digits.match(/\d{3}/g)! : digits.match(/\d{1,4}/g)!).join(" ");

/** The checks over HTML: an Html block's, or a whole email's (the site's checker). */
export function checkHtml(html: string): Finding[] {
  const out: Finding[] = [];
  const clean = html.replace(/<!--[\s\S]*?-->/g, "");
  const stack: { layout: boolean; th: boolean; line: number }[] = [];
  const tag = /<(\/?)(table|th)\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  let bad = 0;
  while ((m = tag.exec(clean))) {
    const [, close, name, attrs] = m;
    if (name!.toLowerCase() === "th") {
      if (!close && stack.length) stack[stack.length - 1]!.th = true;
      continue;
    }
    if (!close) stack.push({ layout: /\brole\s*=\s*["']?(presentation|none)\b/i.test(attrs!), th: false, line: m.index });
    else {
      const t = stack.pop();
      if (t && !t.layout && !t.th) bad++;
    }
  }
  if (bad)
    out.push({ rule: "layout-table", path: "root", message: `${bad} table${bad === 1 ? " has" : "s have"} no header cells and no role="presentation": a screen reader announces ${bad === 1 ? "it" : "each"} as a data table` });
  return out;
}

export type { PluginOutput };
