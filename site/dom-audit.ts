/**
 * Readable's checks for any email's HTML, the one you paste: @hyper-elements/lint's `lintHtml()` on the markup, and
 * Readable's rules on the page as the browser lays it out (colours as computed, sizes as drawn), so each finding can
 * point at its element. The same rules as the plugin, read from the DOM instead of Hyper Elements' tree.
 */
import { lintHtml } from "@hyper-elements/lint/html";
import { contrast, ratio } from "../src/wcag/color";
import { group } from "../src/wcag/rules";

export interface DomFinding {
  rule: string;
  severity: "warning" | "info";
  message: string;
  el?: Element;
  line?: number;
}

const toHex = (c: string): string | null => {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(c);
  if (!m) return null;
  if (m[4] !== undefined && +m[4] === 0) return null;
  return "#" + [m[1], m[2], m[3]].map((v) => (+v!).toString(16).padStart(2, "0")).join("");
};

function background(el: Element | null): string {
  for (let e = el; e; e = e.parentElement) {
    const st = e.ownerDocument.defaultView!.getComputedStyle(e);
    const bg = toHex(st.backgroundColor);
    if (bg) return bg;
    const attr = e.getAttribute("bgcolor");
    if (attr && /^#[0-9a-f]{3,6}$/i.test(attr)) return attr;
  }
  return "#ffffff";
}

const ownText = (el: Element) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join("").replace(/\s+/g, " ").trim();
const PICTO = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;
const LONG_DIGITS = /(?<![\d.,:/-])\d{6,}(?![\d.,:/-])/;

export function auditDom(doc: Document, html: string): DomFinding[] {
  const out: DomFinding[] = [];
  const view = doc.defaultView!;

  for (const d of lintHtml(html, { kind: "transactional" }).diagnostics)
    out.push({ rule: d.code.replace(/^lint\//, ""), severity: d.severity, message: d.message, line: d.line });

  const all = [...doc.body.querySelectorAll("*")].filter((e) => {
    const st = view.getComputedStyle(e);
    return st.display !== "none" && st.visibility !== "hidden" && e.getAttribute("aria-hidden") !== "true" && !e.closest("[aria-hidden=true]");
  });

  for (const el of all) {
    const st = view.getComputedStyle(el);
    const text = ownText(el);
    const size = parseFloat(st.fontSize);
    const bold = +st.fontWeight >= 700;

    if (/[\p{L}\p{N}]/u.test(text)) {
      const fg = toHex(st.color);
      const bg = background(el);
      const c = contrast(fg, bg);
      const large = size >= 24 || (bold && size >= 18.66);
      if (c !== null && c < (large ? 3 : 4.5))
        out.push({ rule: "contrast", severity: "warning", el, message: `"${text.slice(0, 40)}" is ${ratio(c)} against its background (${fg} on ${bg}): it needs ${large ? "3" : "4.5"}:1` });
      if (size < 13 && !el.closest("a"))
        out.push({ rule: "text-size", severity: "info", el, message: `"${text.slice(0, 40)}" is ${Math.round(size)} px: hard to read on a phone` });
      const digits = LONG_DIGITS.exec(text);
      if (digits) out.push({ rule: "code-readout", severity: "warning", el, message: `"${digits[0]}" is read as one number: write it as "${group(digits[0])}"` });
      const cased = text.replace(/[^\p{Lu}\p{Ll}]/gu, "");
      const caps = st.textTransform === "uppercase" ? cased : cased.replace(/\p{Ll}/gu, "").length === cased.length ? cased : "";
      if (caps.length >= 20) out.push({ rule: "all-caps", severity: "info", el, message: `${caps.length} letters in capitals: "${text.slice(0, 40)}…"` });
      if (st.textAlign === "justify" && view.getComputedStyle(el.parentElement!).textAlign !== "justify")
        out.push({ rule: "justified", severity: "warning", el, message: "Justified text: align it to the start" });
      if (/^(P|TD|LI|DIV|SPAN)$/.test(el.tagName) && text.length > 60) {
        const lh = st.lineHeight === "normal" ? 1.2 : parseFloat(st.lineHeight) / size;
        if (lh < 1.4) out.push({ rule: "line-height", severity: "warning", el, message: `Line height ${lh.toFixed(2)} times the font size: make it 1.5` });
        if (st.textAlign === "center" && text.length > 150) out.push({ rule: "centered-text", severity: "info", el, message: `A ${text.length}-character paragraph is centred` });
      }
    }

    if (/^H[1-6]$/.test(el.tagName) || el.tagName === "A") {
      const name = (el.textContent ?? "").trim();
      if (PICTO.test(name)) out.push({ rule: "emoji", severity: "warning", el, message: `An emoji in a ${el.tagName === "A" ? "link" : "heading"}: "${name.slice(0, 50)}" is read with each emoji's full name` });
    }

    if (el.tagName === "A" && el.hasAttribute("href")) {
      const r = el.getBoundingClientRect();
      const parent = el.parentElement!;
      const inText = [...parent.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0);
      const pst = view.getComputedStyle(parent);
      const buttonish = toHex(st.backgroundColor) !== null || toHex(pst.backgroundColor) !== null && parent.children.length === 1 && !inText || parseFloat(st.paddingTop) >= 4;
      if (buttonish && !inText && r.width > 0 && (r.height < 24 || r.width < 24))
        out.push({ rule: "target-size", severity: "warning", el, message: `This button is ${Math.round(r.width)}×${Math.round(r.height)} px: it needs at least 24×24` });
      if (buttonish && !inText) {
        const own = toHex(st.backgroundColor) ?? toHex(pst.backgroundColor);
        const behind = background(own === toHex(st.backgroundColor) ? parent : parent.parentElement);
        const c = contrast(own, behind);
        const edge = parseFloat(st.borderTopWidth) > 0 ? contrast(toHex(st.borderTopColor), behind) : null;
        if (own && c !== null && c < 3 && (edge === null || edge < 3))
          out.push({ rule: "non-text-contrast", severity: "warning", el, message: `This button (${own}) is ${ratio(c)} against what's behind it (${behind}): its edge needs 3:1` });
      }
      if (inText && !st.textDecorationLine.includes("underline")) {
        const c = contrast(toHex(st.color), toHex(pst.color));
        if (c !== null && c < 3) out.push({ rule: "link-distinct", severity: "warning", el, message: `This link isn't underlined and is ${ratio(c)} against the text around it` });
      }
    }

    if (el.tagName === "IMG") {
      const r = el.getBoundingClientRect();
      if (el.closest("a") && r.width > 0 && r.width < 24 && r.height < 24)
        out.push({ rule: "target-size", severity: "warning", el, message: `A ${Math.round(r.width)} px icon link: it needs at least 24×24` });
    }

    if (el.tagName === "TABLE" && !/^(presentation|none)$/i.test(el.getAttribute("role") ?? "") && !el.querySelector("th"))
      out.push({ rule: "layout-table", severity: "warning", el, message: "A table with no header cells and no role=\"presentation\": announced as a data table" });

    const dir = el.getAttribute("dir");
    const docDir = doc.documentElement.getAttribute("dir") || doc.body.getAttribute("dir") || "ltr";
    if (dir && dir !== docDir && el.tagName !== "HTML" && !/[֐-ࣿ]/.test(el.textContent ?? ""))
      out.push({ rule: "reading-order", severity: "warning", el, message: `dir="${dir}" in a ${docDir} email: columns are read in the other order to how they're shown` });
  }

  const hs = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")];
  if (!hs.length) out.push({ rule: "headings", severity: "warning", message: "No headings: a screen reader user can't jump to what matters" });
  else if (hs[0]!.tagName !== "H1") out.push({ rule: "headings", severity: "warning", el: hs[0], message: `The first heading is ${hs[0]!.tagName.toLowerCase()}: start with one h1` });

  // The same rule found by lintHtml and by the DOM on one element: keep one.
  const seen = new Set<string>();
  return out.filter((f) => {
    const k = f.rule + "|" + (f.el ? [...doc.body.querySelectorAll("*")].indexOf(f.el) : f.message);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
